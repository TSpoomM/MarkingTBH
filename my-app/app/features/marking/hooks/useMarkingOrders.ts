"use client";

import { useEffect, useSyncExternalStore } from "react";
import { INITIAL_MARKING_STATE, MESSAGES } from "../constants";
import {
  markingApiService,
  MarkingApiService,
} from "../services/marking-api.service";
import type {
  MarkingContent,
  MarkingState,
  SaveMarkingPayload,
  TemplateField,
} from "../types";

const emptyRow = (fields: TemplateField[]): MarkingContent =>
  Object.fromEntries(fields.flatMap((field) =>
    field.segments?.length
      ? field.segments.map((segment) => [segment.key, ""])
      : [[field.key, field.defaultValue ?? ""]],
  ));

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
      const template = await this.service.getTemplate(Number(customerId));
      this.setState({
        template,
        stickerSides: "",
        stickerFormat: "",
        stickerType: "",
        stickerOther: "",
        insideRows: [emptyRow(template.inside)],
        outsideRows: template.outside.length ? [emptyRow(template.outside)] : [],
      });
    } catch (error) {
      this.setState({ notice: { type: "error", text: this.errorMessage(error, MESSAGES.loadFailed) } });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  setTotalWeight(totalWeight: string) { this.setState({ totalWeight }); }
  setStickerSides(stickerSides: string) { this.setState({ stickerSides }); }
  setStickerFormat(stickerFormat: string) { this.setState({ stickerFormat }); }
  setStickerType(stickerType: string) { this.setState({ stickerType }); }
  setStickerOther(stickerOther: string) { this.setState({ stickerOther }); }
  dismissNotice() { this.setState({ notice: null }); }
  closeTemplateEditor() { this.setState({ isTemplateEditorOpen: false }); }

  private buildSavePayload(): SaveMarkingPayload {
    return {
      customerId: Number(this.state.customerId),
      totalWeight: Number(this.state.totalWeight || 0),
      stickerSides: Number(this.state.stickerSides || 1),
      contentInside: this.state.insideRows.map((row) => ({
        ...row,
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
    this.setState({
      outsideDraft: this.state.template?.outside.map((field) => ({ ...field })) ?? [],
      isTemplateEditorOpen: true,
    });
  }

  updateDraft(index: number, patch: Partial<TemplateField>) {
    this.setState({
      outsideDraft: this.state.outsideDraft.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field,
      ),
    });
  }

  addDraftField() {
    this.setState({
      outsideDraft: [
        ...this.state.outsideDraft,
        {
          key: `outside_field_${this.state.outsideDraft.length + 1}`,
          label: "",
          type: "text",
          required: false,
        },
      ],
    });
  }

  removeDraftField(index: number) {
    this.setState({
      outsideDraft: this.state.outsideDraft.filter((_, fieldIndex) => fieldIndex !== index),
    });
  }

  private validate(): string {
    const { customerId, template, insideRows, outsideRows } = this.state;
    if (!customerId) return MESSAGES.selectCustomer;
    const stickerFields = template?.sticker.enabledFields ?? [];
    if (stickerFields.includes("side") && !this.state.stickerSides) return "กรุณาเลือก Side";
    if (stickerFields.includes("format") && !this.state.stickerFormat) return "กรุณาเลือก Format";
    if (stickerFields.includes("type") && !this.state.stickerType) return "กรุณาเลือก Type";
    if (stickerFields.includes("other") && !this.state.stickerOther) return "กรุณาเลือก Other";
    for (const [index, row] of insideRows.entries()) {
      const missing = template?.inside.find((field) =>
        field.required && (field.segments?.length
          ? field.segments.some((segment) => !row[segment.key]?.trim())
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
    const cleaned = this.state.outsideDraft.map((field, index) => ({
      ...field,
      key: field.key.trim() || `outside_field_${index + 1}`,
      label: field.label.trim(),
    }));
    if (cleaned.some((field) => !field.label)) {
      this.setState({ notice: { type: "error", text: MESSAGES.fieldLabelRequired } });
      return;
    }
    if (new Set(cleaned.map((field) => field.key)).size !== cleaned.length) {
      this.setState({ notice: { type: "error", text: MESSAGES.duplicateKey } });
      return;
    }
    this.setState({ isSaving: true });
    try {
      const template = await this.service.saveOutsideTemplate(Number(this.state.customerId), cleaned);
      this.setState({
        template,
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
