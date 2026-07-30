"use client";

import { useEffect, useSyncExternalStore } from "react";
import { INITIAL_MARKING_STATE, MESSAGES } from "../types/constants";
import {
  markingApiService,
  MarkingApiService,
} from "../services/marking-api.service";
import type {
  MarkingContent,
  MarkingState,
  SaveMarkingPayload,
} from "@/app/types/marking";
import { TemplateField } from "@/app/types/customer";

const emptyRow = (fields: TemplateField[]): MarkingContent =>
  Object.fromEntries(fields.flatMap((field) =>
    field.segments?.length
      ? field.segments.map((segment) => [segment.key, ""])
      : [[field.key, field.defaultValue ?? ""]],
  ));

const today = () => new Date().toISOString().slice(0, 10);

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

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    const [session, customers] = await Promise.allSettled([
      this.service.getSession(),
      this.service.getCustomers(),
    ]);
    this.setState({
      isAdmin: session.status === "fulfilled" && session.value.user?.role === "admin",
      customers: customers.status === "fulfilled" ? customers.value : [],
      isLoading: false,
      notice:
        customers.status === "rejected"
          ? { type: "error", text: this.errorMessage(customers.reason, MESSAGES.loadFailed) }
          : null,
    });
    const firstCustomer = customers.status === "fulfilled" ? customers.value[0] : undefined;
    if (firstCustomer) await this.selectCustomer(String(firstCustomer.id));
  }

  async selectCustomer(customerId: string) {
    this.setState({ customerId, notice: null });
    if (!customerId) {
      this.setState({ template: null, insideRows: [], outsideRows: [] });
      return;
    }
    this.setState({ isLoading: true });
    try {
      const productionDate = this.state.productionDate || today();
      const template = await this.service.getTemplate(Number(customerId));
      this.setState({
        template,
        stickerSides: "",
        stickerFormat: "",
        stickerType: "",
        stickerOther: "",
        lotCount: "1",
        productionDate,
        insideRows: [emptyRow(template.inside)],
        outsideRows: template.outside.length ? [emptyRow(template.outside)] : [],
      });
      await this.refreshLotStart(customerId, productionDate);
    } catch (error) {
      this.setState({ notice: { type: "error", text: this.errorMessage(error, MESSAGES.loadFailed) } });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  settotalLot(totalLot: string) { this.setState({ totalLot }); }
  setStickerSides(stickerSides: string) { this.setState({ stickerSides }); }
  setStickerFormat(stickerFormat: string) { this.setState({ stickerFormat }); }
  setStickerType(stickerType: string) { this.setState({ stickerType }); }
  setStickerOther(stickerOther: string) { this.setState({ stickerOther }); }
  setLotCount(lotCount: string) { this.setState({ lotCount }); }
  setProductionDate(productionDate: string) {
    this.setState({ productionDate });
    if (this.state.customerId && productionDate) {
      void this.refreshLotStart(this.state.customerId, productionDate);
    }
  }
  dismissNotice() { this.setState({ notice: null }); }
  closeTemplateEditor() { this.setState({ isTemplateEditorOpen: false }); }

  private async refreshLotStart(customerId: string, productionDate: string) {
    try {
      const lotStart = await this.service.getNextLotStart(Number(customerId), productionDate);
      this.setState({ lotStart });
    } catch {
      this.setState({ lotStart: 1 });
    }
  }

  private buildSavePayload(): SaveMarkingPayload {
    return {
      customerId: Number(this.state.customerId),
      totalLot: Number(this.state.totalLot || 0),
      stickerSides: Number(this.state.stickerSides || 1),
      lotCount: Number(this.state.lotCount || 1),
      lotStart: this.state.lotStart,
      productionDate: this.state.productionDate,
      contentInside: this.state.insideRows.map((row) => ({
        ...row,
        production_date: this.state.productionDate,
        lot_count: this.state.lotCount,
        lot_start: String(this.state.lotStart),
        lot_end: String(this.state.lotStart + Number(this.state.lotCount || 1) - 1),
        ...(this.state.stickerFormat && { sticker_format: this.state.stickerFormat }),
        ...(this.state.stickerType && { sticker_type: this.state.stickerType }),
        ...(this.state.stickerOther && { sticker_other: this.state.stickerOther }),
      })),
      contentOutside: this.state.outsideRows,
    };
  }

  updateRow(section: "inside" | "outside", rowIndex: number, key: string, value: string) {
    const stateKey = section === "inside" ? "insideRows" : "outsideRows";
    const rows = this.state[stateKey].map((row, index) =>
      index === rowIndex ? { ...row, [key]: value } : row,
    );
    this.setState({ [stateKey]: rows });
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
      insideDraft: this.state.template?.inside.map((field) => ({ ...field })) ?? [],
      outsideDraft: this.state.template?.outside.map((field) => ({ ...field })) ?? [],
      isTemplateEditorOpen: true,
    });
  }

  updateDraft(section: "inside" | "outside", index: number, patch: Partial<TemplateField>) {
    const draftKey = section === "inside" ? "insideDraft" : "outsideDraft";
    this.setState({
      [draftKey]: this.state[draftKey].map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field,
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
    const { customerId, template, insideRows, outsideRows } = this.state;
    if (!customerId) return MESSAGES.selectCustomer;
    const stickerFields = template?.sticker.enabledFields ?? [];
    if (!this.state.productionDate) return "กรุณาเลือก Production Date";
    if (!Number.isInteger(Number(this.state.lotCount)) || Number(this.state.lotCount) < 1) return "กรุณากรอกจำนวน Lot";
    if (stickerFields.includes("side") && !this.state.stickerSides) return "กรุณาเลือก Side";
    if (stickerFields.includes("format") && !this.state.stickerFormat) return "กรุณาเลือก Format";
    if (stickerFields.includes("type") && !this.state.stickerType) return "กรุณาเลือก Type";
    if (stickerFields.includes("other") && !this.state.stickerOther) return "กรุณาเลือก Other";
    for (const [index, row] of insideRows.entries()) {
      const missing = template?.inside.find((field) =>
        field.required && (field.segments?.length
          ? field.segments.some((segment) => !segment.isCounter && !row[segment.key]?.trim())
          : !row[field.key]?.trim()),
      );
      if (missing) return `Inside แถว ${index + 1}: กรุณากรอก ${missing.label}`;
    }
    for (const [index, row] of outsideRows.entries()) {
      const missing = template?.outside.find((field) =>
        field.required &&
        (!field.condition || field.condition.stickerType === this.state.stickerType) &&
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

  async save() {
    const validationError = this.validate();
    if (validationError) {
      this.setState({ notice: { type: "error", text: validationError } });
      return null;
    }
    this.setState({ isSaving: true });
    try {
      const payload = this.buildSavePayload();
      this.debugSave("save:start", payload);
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
    const result = await this.save();
    if (!result) return;
    if (process.env.NODE_ENV !== "production") {
      console.debug("[Marking] export:print");
    }
    window.setTimeout(() => window.print(), 120);
  }

  async saveTemplate() {
    if (!this.state.customerId) return;
    const cleanFields = (section: "inside" | "outside", fields: TemplateField[]) => fields.map((field, index) => ({
      ...field,
      key: field.key.trim() || `${section}_field_${index + 1}`,
      label: field.label.trim(),
    }));
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
      const template = await this.service.saveTemplate(Number(this.state.customerId), inside, outside);
      this.setState({
        template,
        insideRows: template.inside.length ? [emptyRow(template.inside)] : [],
        outsideRows: template.outside.length ? [emptyRow(template.outside)] : [],
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
