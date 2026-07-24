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
  TemplateField,
} from "../types";

const emptyRow = (fields: TemplateField[]): MarkingContent =>
  Object.fromEntries(fields.map((field) => [field.key, field.defaultValue ?? ""]));

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
  dismissNotice() { this.setState({ notice: null }); }
  closeTemplateEditor() { this.setState({ isTemplateEditorOpen: false }); }

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
    const { customerId, totalWeight, template, insideRows, outsideRows } = this.state;
    if (!customerId) return MESSAGES.selectCustomer;
    if (Number(totalWeight) <= 0) return MESSAGES.enterWeight;
    for (const [index, row] of insideRows.entries()) {
      const missing = template?.inside.find((field) => field.required && !row[field.key]?.trim());
      if (missing) return `Inside แถว ${index + 1}: กรุณากรอก ${missing.label}`;
    }
    for (const [index, row] of outsideRows.entries()) {
      const missing = template?.outside.find((field) => field.required && !row[field.key]?.trim());
      if (missing) return `Outside แถว ${index + 1}: กรุณากรอก ${missing.label}`;
    }
    return "";
  }

  async saveAndExport() {
    const validationError = this.validate();
    if (validationError) {
      this.setState({ notice: { type: "error", text: validationError } });
      return;
    }
    this.setState({ isSaving: true });
    try {
      const result = await this.service.saveMarking({
        customerId: Number(this.state.customerId),
        totalWeight: Number(this.state.totalWeight),
        stickerSides: Number(this.state.stickerSides),
        contentInside: this.state.insideRows,
        contentOutside: this.state.outsideRows,
      });
      this.setState({
        notice: { type: "success", text: `บันทึกรายการ #${result.id} แล้ว` },
      });
      window.setTimeout(() => window.print(), 120);
    } catch (error) {
      this.setState({ notice: { type: "error", text: this.errorMessage(error, MESSAGES.saveFailed) } });
    } finally {
      this.setState({ isSaving: false });
    }
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
