"use client";

import { useEffect, useSyncExternalStore } from "react";
import { INITIAL_MARKING_STATE, MESSAGES } from "@/src/core/models/constants";
import {
  markingApiService,
  MarkingApiService,
} from "@/src/core/services/marking-api.service";
import TemplateFieldUtils from "@/src/core/templates/templateFieldUtils";
import type {
  MarkingContent,
  PrintSection,
  MarkingState,
  SaveMarkingPayload,
} from "@/src/core/models/marking";
import type { CounterType, TemplateField } from "@/src/core/models/template";

class MarkingOrderFieldNormalizer {
  private static uniqueSegmentKey(
    fieldKey: string,
    segmentKey: string | undefined,
    segmentIndex: number,
    usedKeys: Set<string>,
  ) {
    const fallback = `${fieldKey}_${segmentIndex + 1}`;
    const baseKey = (segmentKey ?? "").trim() || fallback;
    if (!usedKeys.has(baseKey)) {
      usedKeys.add(baseKey);
      return baseKey;
    }

    let suffix = segmentIndex + 1;
    let nextKey = `${fieldKey}_${baseKey}_${suffix}`;
    while (usedKeys.has(nextKey)) {
      suffix += 1;
      nextKey = `${fieldKey}_${baseKey}_${suffix}`;
    }
    usedKeys.add(nextKey);
    return nextKey;
  }

  static normalizeSegmentKeys(field: TemplateField): TemplateField {
    if (!field.segments?.length) return field;
    const usedKeys = new Set<string>();
    return {
      ...field,
      segments: field.segments.map((segment, index) => ({
        ...segment,
        key: this.uniqueSegmentKey(field.key, segment.key, index, usedKeys),
      })),
    };
  }
}

export class MarkingOrdersController {
  private state: MarkingState = { ...INITIAL_MARKING_STATE };
  private listeners = new Set<() => void>();
  private initialized = false;

  constructor(private readonly service: MarkingApiService) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.state;

  private setState(patch: Partial<MarkingState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  private sortedTemplates(templates: MarkingState["templates"]) {
    return templates
      .sort((first, second) =>
        Number(second.isActive) - Number(first.isActive) ||
        first.name.localeCompare(second.name),
      );
  }

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    const [session, templates] = await Promise.allSettled([
      this.service.getSession(),
      this.service.getTemplates(),
    ]);
    this.setState({
      isAdmin: session.status === "fulfilled" && session.value.user?.role === "admin",
      templates: templates.status === "fulfilled" ? this.sortedTemplates(templates.value) : [],
      isLoading: false,
      notice:
        templates.status === "rejected"
          ? { type: "error", text: this.errorMessage(templates.reason, MESSAGES.loadFailed) }
          : null,
    });
  }

  async selectTemplate(templateId: string) {
    const selectedTemplate = this.state.templates.find((template) => String(template.id) === templateId);
    if (selectedTemplate?.isActive === false) {
      this.setState({ notice: { type: "error", text: "Template นี้ Inactive อยู่" } });
      return;
    }
    this.setState({ templateId, notice: null });
    if (!templateId) {
      this.setState({ template: null, insideRows: [], outsideRows: [] });
      return;
    }
    this.setState({ isLoading: true });
    try {
      const productionDate = this.state.productionDate || this.today();
      const template = await this.service.getTemplate(Number(templateId));
      const lotStart = await this.loadLotStart(templateId, productionDate);
      const stickerDefaults = template.sticker.defaults;
      this.setState({
        template,
        stickerSides: String(stickerDefaults.sideCount),
        stickerFormat: stickerDefaults.format,
        stickerType: stickerDefaults.stickerType,
        stickerFsc: stickerDefaults.stickerFsc,
        stickerOther: stickerDefaults.stickerOther,
        lotCount: "1",
        lotStart,
        productionDate,
        insideRows: [this.emptyRow(template.inside, lotStart)],
        outsideRows: template.outside.length ? [this.emptyRow(template.outside, lotStart)] : [],
        printOutsideGroups: {},
      });
    } catch (error) {
      this.setState({ notice: { type: "error", text: this.errorMessage(error, MESSAGES.loadFailed) } });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  settotalLot(totalLot: string) { this.setState({ totalLot }); }
  setStickerSides(stickerSides: string) { this.setState({ stickerSides }); }
  setStickerFormat(stickerFormat: string) { this.setState({ stickerFormat }); }
  setStickerType(stickerType: string) { this.setState({ stickerType, stickerFsc: stickerType === "TNR" ? this.state.stickerFsc : false }); }
  setStickerFsc(stickerFsc: boolean) { this.setState({ stickerFsc }); }
  setStickerOther(stickerOther: string) { this.setState({ stickerOther }); }
  setLotCount(lotCount: string) { this.setState({ lotCount }); }
  setProductionDate(productionDate: string) {
    this.setState({ productionDate });
    if (this.state.templateId && productionDate) {
      void this.refreshLotStart(this.state.templateId, productionDate);
    }
  }
  dismissNotice() { this.setState({ notice: null }); }
  closeTemplateEditor() { this.setState({ isTemplateEditorOpen: false }); }
  closeExportModal() { this.setState({ isExportModalOpen: false }); }

  setPrintSection(section: PrintSection, enabled: boolean) {
    this.setState({
      printSections: {
        ...this.state.printSections,
        [section]: enabled,
      },
    });
  }

  setPrintOutsideGroup(groupKey: string, enabled: boolean) {
    this.setState({
      printOutsideGroups: {
        ...this.state.printOutsideGroups,
        [groupKey]: enabled,
      },
    });
  }

  openExportModal() {
    const validationError = this.validate();
    if (validationError) {
      this.setState({ notice: { type: "error", text: validationError } });
      return;
    }
    this.setState({ isExportModalOpen: true, notice: null });
  }

  private async loadLotStart(templateId: string, productionDate: string) {
    try {
      return await this.service.getNextLotStart(Number(templateId), productionDate);
    } catch {
      return 1;
    }
  }

  private async refreshLotStart(templateId: string, productionDate: string) {
    const previousLotStart = this.state.lotStart;
    const lotStart = await this.loadLotStart(templateId, productionDate);
    this.setState({
      lotStart,
      insideRows: this.withCounterDefaults(this.state.insideRows, this.state.template?.inside ?? [], lotStart, previousLotStart),
      outsideRows: this.withCounterDefaults(this.state.outsideRows, this.state.template?.outside ?? [], lotStart, previousLotStart),
    });
  }

  private buildSavePayload(actionType: SaveMarkingPayload["actionType"] = "save"): SaveMarkingPayload {
    const insideRows = this.withLockedDefaults("inside", this.state.insideRows);
    const outsideRows = this.withLockedDefaults("outside", this.state.outsideRows);
    return {
      templateId: Number(this.state.templateId),
      totalLot: Number(this.state.totalLot || 0),
      stickerSides: Number(this.state.stickerSides || 1),
      lotCount: Number(this.state.lotCount || 1),
      lotStart: this.state.lotStart,
      productionDate: this.state.productionDate,
      actionType,
      contentInside: insideRows.map((row) => ({
        ...row,
        production_date: this.state.productionDate,
        lot_count: this.state.lotCount,
        lot_start: String(this.state.lotStart),
        lot_end: String(this.state.lotStart + Number(this.state.lotCount || 1) - 1),
        ...(this.state.stickerFormat && { sticker_format: this.state.stickerFormat }),
        ...(this.state.stickerType && { sticker_type: this.state.stickerType }),
        ...(this.state.stickerType === "TNR" && { sticker_fsc: this.state.stickerFsc ? "YES" : "NO" }),
        ...(this.state.stickerOther && { sticker_other: this.state.stickerOther }),
      })),
      contentOutside: outsideRows,
    };
  }

  private matchesCondition(field: TemplateField) {
    return (
      (!field.condition?.stickerType || field.condition.stickerType === this.state.stickerType) &&
      (!field.condition?.stickerOther || field.condition.stickerOther === this.state.stickerOther)
    );
  }

  private shouldUppercase(section: "inside" | "outside", key: string) {
    if (section === "inside") return true;
    const fields = this.state.template?.outside ?? [];
    const field = fields.find((item) =>
      item.key === key || item.segments?.some((segment) => segment.key === key),
    );
    return field?.uppercase ?? true;
  }

  private lockedValue(section: "inside" | "outside", key: string) {
    const fields = section === "inside" ? this.state.template?.inside : this.state.template?.outside;
    const field = fields?.find((item) => item.key === key);
    if (!field?.locked) return undefined;
    const value = String(field.defaultValue ?? field.label);
    return field.uppercase === false ? value : value.toUpperCase();
  }

  private withLockedDefaults(section: "inside" | "outside", rows: MarkingContent[]) {
    const fields = section === "inside" ? this.state.template?.inside : this.state.template?.outside;
    const lockedFields = fields?.filter((field) => field.locked && !field.segments?.length) ?? [];
    if (!lockedFields.length) return rows;
    return rows.map((row) => ({
      ...row,
      ...Object.fromEntries(lockedFields.map((field) => [field.key, this.lockedValue(section, field.key) ?? ""])),
    }));
  }

  private isLotCounterKey(section: "inside" | "outside", key: string) {
    const fields = section === "inside" ? this.state.template?.inside : this.state.template?.outside;
    return fields?.some((field) =>
      field.key === key
        ? field.isCounter && this.counterType(field, { counterType: field.counterType }) === "lot"
        : field.segments?.some((segment) =>
          segment.key === key &&
          segment.isCounter &&
          this.counterType(field, segment) === "lot",
        ),
    ) ?? key.toLowerCase().includes("lot");
  }

  updateRow(section: "inside" | "outside", rowIndex: number, key: string, value: string) {
    const stateKey = section === "inside" ? "insideRows" : "outsideRows";
    const lockedValue = this.lockedValue(section, key);
    const normalizedValue = lockedValue ?? (this.shouldUppercase(section, key) ? value.toUpperCase() : value);
    const rows = this.state[stateKey].map((row, index) =>
      index === rowIndex ? { ...row, [key]: normalizedValue } : row,
    );
    this.setState({
      [stateKey]: rows,
      ...(this.isLotCounterKey(section, key) && Number.isInteger(Number(normalizedValue)) && Number(normalizedValue) > 0
        ? { lotStart: Number(normalizedValue) }
        : {}),
    });
  }

  openTemplateEditor() {
    if (!this.state.isAdmin) {
      this.setState({ notice: { type: "error", text: "เฉพาะ Admin เท่านั้น" } });
      return;
    }
    if (!this.state.template) {
      this.setState({ notice: { type: "error", text: "กรุณาเลือกลูกค้าก่อนแก้ไข Template" } });
      return;
    }
    this.setState({
      insideDraft: this.state.template?.inside.map((field) => MarkingOrderFieldNormalizer.normalizeSegmentKeys({ ...field })) ?? [],
      outsideDraft: this.state.template?.outside.map((field) => MarkingOrderFieldNormalizer.normalizeSegmentKeys({ ...field })) ?? [],
      isTemplateEditorOpen: true,
    });
  }

  updateDraft(section: "inside" | "outside", index: number, patch: Partial<TemplateField>) {
    const draftKey = section === "inside" ? "insideDraft" : "outsideDraft";
    this.setState({
      [draftKey]: this.state[draftKey].map((field, fieldIndex) =>
        fieldIndex === index ? MarkingOrderFieldNormalizer.normalizeSegmentKeys({ ...field, ...patch }) : field,
      ),
    });
  }

  addDraftField(section: "inside" | "outside") {
    const draftKey = section === "inside" ? "insideDraft" : "outsideDraft";
    this.setState({
      [draftKey]: [
        ...this.state[draftKey],
        {
          key: `${section}_field_${this.state[draftKey].length + 1}`,
          label: "",
          type: "text",
          required: false,
          uppercase: section === "outside" ? true : undefined,
        },
      ],
    });
  }

  removeDraftField(section: "inside" | "outside", index: number) {
    const draftKey = section === "inside" ? "insideDraft" : "outsideDraft";
    this.setState({
      [draftKey]: this.state[draftKey].filter((_, fieldIndex) => fieldIndex !== index),
    });
  }

  private validate(): string {
    const { templateId, template, insideRows, outsideRows } = this.state;
    if (!templateId) return MESSAGES.selectTemplate;
    const stickerFields = template?.sticker.enabledFields ?? [];
    if (!this.state.productionDate) return "กรุณาเลือก Production Date";
    if (!Number.isInteger(Number(this.state.lotCount)) || Number(this.state.lotCount) < 1) return "กรุณากรอกจำนวน Lot";
    if (!this.state.stickerSides) return "กรุณาเลือก Side";
    if (!this.state.stickerFormat) return "กรุณาเลือก Format";
    if ((stickerFields.includes("type") || (template?.outside ?? []).some((field) => !!field.condition?.stickerType)) && !this.state.stickerType) return "กรุณาเลือกเกรด";
    if ((stickerFields.includes("other") || (template?.outside ?? []).some((field) => !!field.condition?.stickerOther)) && !this.state.stickerOther) return "กรุณาเลือก Other";
    for (const [index, row] of insideRows.entries()) {
      const missing = template?.inside.find((field) =>
        field.required &&
        this.matchesCondition(field) &&
        (field.segments?.length
          ? field.segments.some((segment) => !segment.isCounter && !row[segment.key]?.trim())
          : !row[field.key]?.trim()),
      );
      if (missing) return `Inside แถว ${index + 1}: กรุณากรอก ${missing.label}`;
    }
    for (const [index, row] of outsideRows.entries()) {
      const missing = template?.outside.find((field) =>
        field.required &&
        this.matchesCondition(field) &&
        !row[field.key]?.trim(),
      );
      if (missing) return `Outside แถว ${index + 1}: กรุณากรอก ${missing.label}`;
    }
    return "";
  }

  private debugSave(label: string, payload: SaveMarkingPayload, result?: { id: number }) {
    if (process.env.NODE_ENV === "production") return;
    console.debug(`[Marking] ${label}`, { payload, result });
  }

  private debugStickerFontMetrics(label: string) {
    if (process.env.NODE_ENV === "production" || typeof document === "undefined") return;
    const stickers = Array.from(document.querySelectorAll<HTMLElement>(".print-sheet .sticker-label"));
    if (!stickers.length) {
      console.debug(`[Marking] ${label}: no print-sheet stickers found`);
      return;
    }

    console.groupCollapsed(`[Marking] ${label}: sticker font metrics`);
    console.table(stickers.slice(0, 8).map((sticker, index) => {
      const style = getComputedStyle(sticker);
      const details = sticker.querySelector<HTMLElement>(".sticker-details");
      const detailsStyle = details ? getComputedStyle(details) : null;
      return {
        index,
        kind: Array.from(sticker.classList).filter((className) => className !== "sticker-label").join(" "),
        stickerFontVar: style.getPropertyValue("--sticker-font").trim(),
        stickerLabelFontVar: style.getPropertyValue("--sticker-label-font").trim(),
        stickerGapVar: style.getPropertyValue("--sticker-gap").trim(),
        stickerLabelColumnVar: style.getPropertyValue("--sticker-label-column").trim(),
        fitScale: detailsStyle?.getPropertyValue("--sticker-fit-scale").trim() || "",
        computedFontSize: style.fontSize,
        detailsFontSize: detailsStyle?.fontSize || "",
        padding: style.padding,
        width: `${Math.round(sticker.getBoundingClientRect().width)}px`,
        height: `${Math.round(sticker.getBoundingClientRect().height)}px`,
      };
    }));

    console.table(stickers.slice(0, 3).flatMap((sticker, stickerIndex) =>
      Array.from(sticker.querySelectorAll<HTMLElement>(".sticker-detail-row")).map((row, rowIndex) => {
        const style = getComputedStyle(row);
        return {
          stickerIndex,
          rowIndex,
          label: row.querySelector("dt")?.textContent?.trim() ?? "",
          rowFontVar: style.getPropertyValue("--sticker-row-font").trim(),
          computedFontSize: style.fontSize,
          width: `${Math.round(row.getBoundingClientRect().width)}px`,
          scrollWidth: `${row.scrollWidth}px`,
        };
      }),
    ));
    console.groupEnd();
  }

  async save(actionType: SaveMarkingPayload["actionType"] = "save") {
    const validationError = this.validate();
    if (validationError) {
      this.setState({ notice: { type: "error", text: validationError } });
      return null;
    }
    this.setState({ isSaving: true });
    try {
      const payload = this.buildSavePayload(actionType);
      this.debugSave("save:start", payload);
      this.debugStickerFontMetrics("save:start");
      const result = await this.service.saveMarking(payload);
      this.debugSave("save:done", payload, result);
      this.setState({
        notice: { type: "success", text: `บันทึกรายการ #${result.id} แล้ว` },
      });
      return result;
    } catch (error) {
      this.setState({ notice: { type: "error", text: this.errorMessage(error, MESSAGES.saveFailed) } });
      return null;
    } finally {
      this.setState({ isSaving: false });
    }
  }

  async saveAndExport() {
    if (!Object.values(this.state.printSections).some(Boolean)) {
      this.setState({ notice: { type: "error", text: "กรุณาเลือกสติ๊กเกอร์ที่ต้องการปริ้นอย่างน้อย 1 แบบ" } });
      return;
    }
    const result = await this.save("print");
    if (!result) return;
    this.setState({ isExportModalOpen: false });
    if (process.env.NODE_ENV !== "production") {
      console.debug("[Marking] export:print");
    }
    window.setTimeout(() => window.print(), 120);
  }

  async saveTemplate() {
    if (!this.state.templateId) return;
    const cleanFields = (section: "inside" | "outside", fields: TemplateField[]) => fields.map((field, index) => {
      const fieldKey = field.key.trim() || `${section}_field_${index + 1}`;
      const usedSegmentKeys = new Set<string>();
      return {
        ...field,
        key: fieldKey,
        label: field.label.trim(),
        uppercase: section === "outside" ? field.uppercase ?? true : field.uppercase,
        segments: field.segments?.map((segment, segmentIndex) => ({
          ...segment,
          key: TemplateFieldUtils.uniqueSegmentKey(fieldKey, segment.key, segmentIndex, usedSegmentKeys),
          label: segment.label.trim(),
        })),
      };
    });
    const inside = cleanFields("inside", this.state.insideDraft);
    const outside = cleanFields("outside", this.state.outsideDraft);
    const cleaned = [...inside, ...outside];
    if (cleaned.some((field) => !field.label)) {
      this.setState({ notice: { type: "error", text: MESSAGES.fieldLabelRequired } });
      return;
    }
    if (
      new Set(inside.map((field) => field.key)).size !== inside.length ||
      new Set(outside.map((field) => field.key)).size !== outside.length
    ) {
      this.setState({ notice: { type: "error", text: MESSAGES.duplicateKey } });
      return;
    }
    this.setState({ isSaving: true });
    try {
      const template = await this.service.saveTemplate(Number(this.state.templateId), inside, outside);
      this.setState({
        template,
        insideRows: template.inside.length ? [this.emptyRow(template.inside, this.state.lotStart)] : [],
        outsideRows: template.outside.length ? [this.emptyRow(template.outside, this.state.lotStart)] : [],
        isTemplateEditorOpen: false,
        notice: { type: "success", text: MESSAGES.templateSaved },
      });
    } catch (error) {
      this.setState({ notice: { type: "error", text: this.errorMessage(error, MESSAGES.saveFailed) } });
    } finally {
      this.setState({ isSaving: false });
    }
  }

  private errorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }

  private counterType(field: Pick<TemplateField, "key" | "label">, segment?: { counterType?: CounterType }) {
    if (segment?.counterType) return segment.counterType;
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return key.includes("pallet") || label.includes("pallet") ? "pallet" : "lot";
  }

  private counterSeed(type: CounterType, lotStart: number) {
    return type === "lot" ? lotStart || 1 : 1;
  }

  private counterDefault(
    field: Pick<TemplateField, "key" | "label" | "counterPad4">,
    lotStart: number,
    segment?: { counterType?: CounterType; counterPad4?: boolean },
  ) {
    const type = this.counterType(field, segment);
    const value = this.counterSeed(type, lotStart);
    const pad4 = segment?.counterPad4 ?? field.counterPad4 ?? false;
    return pad4 ? String(value).padStart(4, "0") : String(value);
  }

  private fieldDefault(field: TemplateField) {
    const value = String(field.locked ? field.defaultValue ?? field.label : field.defaultValue ?? "");
    return field.uppercase === false ? value : value.toUpperCase();
  }

  private emptyRow(fields: TemplateField[], lotStart = this.state.lotStart): MarkingContent {
    return Object.fromEntries(fields.flatMap((field) =>
      field.segments?.length
        ? field.segments.map((segment) => [segment.key, segment.isCounter ? this.counterDefault(field, lotStart, segment) : ""])
        : [[field.key, field.isCounter ? this.counterDefault(field, lotStart, { counterType: field.counterType, counterPad4: field.counterPad4 }) : this.fieldDefault(field)]],
    ));
  }

  private syncFieldCounterDefault(
    row: MarkingContent,
    field: TemplateField,
    lotStart: number,
    previousLotStart: number,
  ) {
    if (!field.isCounter) return;
    const previousDefault = this.counterDefault(field, previousLotStart, { counterType: field.counterType, counterPad4: field.counterPad4 });
    const previousRawDefault = String(this.counterSeed(this.counterType(field, { counterType: field.counterType }), previousLotStart));
    if (!row[field.key] || row[field.key] === previousDefault || row[field.key] === previousRawDefault) {
      row[field.key] = this.counterDefault(field, lotStart, { counterType: field.counterType, counterPad4: field.counterPad4 });
    }
  }

  private withCounterDefaults(
    rows: MarkingContent[],
    fields: TemplateField[],
    lotStart: number,
    previousLotStart: number,
  ) {
    return rows.map((row) => {
      const nextRow = { ...row };
      fields.forEach((field) => {
        if (!field.segments?.length) {
          this.syncFieldCounterDefault(nextRow, field, lotStart, previousLotStart);
          return;
        }
        field.segments?.forEach((segment) => {
          if (!segment.isCounter) return;
          const previousDefault = this.counterDefault(field, previousLotStart, segment);
          const previousRawDefault = String(this.counterSeed(this.counterType(field, segment), previousLotStart));
          if (!nextRow[segment.key] || nextRow[segment.key] === previousDefault || nextRow[segment.key] === previousRawDefault) {
            nextRow[segment.key] = this.counterDefault(field, lotStart, segment);
          }
        });
      });
      return nextRow;
    });
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }
}

export const markingOrders = new MarkingOrdersController(markingApiService);

export function useMarkingOrders() {
  const state = useSyncExternalStore(
    markingOrders.subscribe,
    markingOrders.getSnapshot,
    markingOrders.getSnapshot,
  );
  useEffect(() => { void markingOrders.initialize(); }, []);
  return { state, actions: markingOrders };
}
