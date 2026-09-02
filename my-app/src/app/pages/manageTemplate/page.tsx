"use client";

import { Component, type FormEvent } from "react";
import Modal from "@/src/components/ui/Modal";
import Toast from "@/src/components/ui/Toast";
import type { Template, TemplateDetail, StickerGroupLayout, TemplateField } from "@/src/core/models/template";
import {
  DEFAULT_STICKER_DEFAULTS,
  type CreateTemplatePayload,
  type InsideGroup,
  type OutsideTable,
} from "@/src/core/models/template-form";
import {
  fixedInsideFields,
  initialGroups,
  TemplateManageModelFactory,
  type TemplateFormState,
  type TemplateManageMode,
} from "@/src/core/models/manage-template";
import CreateTemplateForm from "@/src/components/manageTemplate/CreateTemplateForm";
import EditTemplateForm from "@/src/components/manageTemplate/EditTemplateForm";
import TemplateFieldUtils from "@/src/core/templates/templateFieldUtils";
import Button from "@/src/components/ui/Button";

const REQUIRED_STICKER_FIELDS: TemplateDetail["sticker"]["enabledFields"] = ["side", "format", "type", "other"];

class TemplateFormDefaults {
  static createDefaultInsideDraft(): TemplateField[] {
    return [
      ...initialGroups.map((group, groupIndex) => TemplateFieldUtils.normalizeCounterField({
        key: group.key,
        label: group.label,
        type: "text" as const,
        required: true,
        showOnSticker: true,
        stickerOrder: groupIndex,
        segments: group.segments.map((segment, segmentIndex) => ({
          ...segment,
          showOnSticker: true,
          stickerOrder: groupIndex * 10 + segmentIndex,
        })),
      })),
      ...fixedInsideFields.map((field, index) => ({
        ...field,
        type: "text" as const,
        showOnSticker: true,
        stickerOrder: initialGroups.length + index,
      })),
    ];
  }

  static normalizeDraftField(section: "inside" | "outside", field: TemplateField): TemplateField {
    const isVerticalOutside = section === "outside" && this.isVerticalStickerGroupLayout(field.stickerGroupLayout);
    return TemplateFieldUtils.normalizeCounterField({
      ...field,
      label: field.label.toUpperCase(),
      segments: field.segments?.map((segment) => ({
        ...segment,
        label: segment.label.toUpperCase(),
      })),
      type: "text",
      required: true,
      condition: undefined,
      fontScale: section === "outside" && !isVerticalOutside ? field.fontScale : undefined,
      isCounter: section === "outside" && !field.segments?.length ? field.isCounter : undefined,
      counterType: section === "outside" && !field.segments?.length ? field.counterType : undefined,
      showOnSticker: field.showOnSticker ?? true,
      uppercase: section === "outside" ? field.uppercase ?? true : field.uppercase,
      defaultValue: !field.segments?.length && field.locked
        ? field.defaultValue ?? field.label
        : section === "outside" ? undefined : field.defaultValue,
      locked: !field.segments?.length ? field.locked : false,
    });
  }

  static cloneTemplateField(field: TemplateField): TemplateField {
    return {
      ...field,
      condition: field.condition ? { ...field.condition } : undefined,
      segments: field.segments?.map((segment) => ({ ...segment })),
    };
  }

  static withRequiredStickerFields() {
    return [...REQUIRED_STICKER_FIELDS];
  }

  static withRequiredStickerLayouts(layouts: TemplateFormState["stickerLayouts"]): TemplateFormState["stickerLayouts"] {
    return { ...layouts };
  }

  static normalizeStickerGroupLayout(layout: TemplateField["stickerGroupLayout"]): StickerGroupLayout {
    return layout === "8x2" || layout === "4x2" ? "8x2" : "2x2";
  }

  static isVerticalStickerGroupLayout(layout: TemplateField["stickerGroupLayout"]) {
    return this.normalizeStickerGroupLayout(layout) === "8x2";
  }

  static enforceOutsideVerticalSingleRows(fields: TemplateField[]) {
    const seenVerticalGroups = new Set<number>();
    return fields.filter((field, index) => {
      const groupOrder = field.stickerGroupOrder ?? index;
      if (!this.isVerticalStickerGroupLayout(field.stickerGroupLayout)) return true;
      if (seenVerticalGroups.has(groupOrder)) return false;
      seenVerticalGroups.add(groupOrder);
      return true;
    });
  }

  static defaultStickerDefaults() {
    return { ...DEFAULT_STICKER_DEFAULTS };
  }
}

export default class TemplateForm extends Component<Record<string, never>, TemplateFormState> {
  state: TemplateFormState = {
    mode: "edit",
    templates: [],
    selectedTemplateId: "",
    templateName: "",
    templateInsideDraft: [],
    templateOutsideDraft: [],
    createInsideDraft: TemplateFormDefaults.createDefaultInsideDraft(),
    createOutsideDraft: [],
    duplicateSourceTemplateId: "",
    name: "",
    isActive: true,
    templateIsActive: true,
    stickerFields: TemplateFormDefaults.withRequiredStickerFields(),
    templateStickerFields: TemplateFormDefaults.withRequiredStickerFields(),
    stickerLayouts: {
      insideFrame: true,
      outsideFrame: true,
      customerName: false,
      fscLogo: false,
    },
    stickerDefaults: TemplateFormDefaults.defaultStickerDefaults(),
    templateStickerLayouts: {
      insideFrame: true,
      outsideFrame: true,
      customerName: false,
      fscLogo: false,
    },
    templateStickerDefaults: TemplateFormDefaults.defaultStickerDefaults(),
    duplicateNamePrompt: undefined,
    groups: initialGroups.map((group) => ({
      ...group,
      segments: group.segments.map((segment) => ({ ...segment })),
    })),
    tables: [],
    notice: undefined,
    templateNotice: undefined,
    isAdmin: false,
    checkingRole: true,
    loadingTemplates: false,
    loadingTemplate: false,
    duplicatingTemplate: false,
    savingTemplate: false,
    saving: false,
  };

  async componentDidMount() {
    try {
      const response = await fetch("/api/session");
      const session = (await response.json()) as { user?: { role?: string } };
      this.setState({
        isAdmin: response.ok && session.user?.role === "admin",
        checkingRole: false,
      });
      if (response.ok && session.user?.role === "admin") {
        await this.loadTemplates();
      }
    } catch {
      this.setState({ isAdmin: false, checkingRole: false });
    }
  }

  private changeMode = (mode: TemplateManageMode) => {
    this.setState({
      mode,
      notice: undefined,
      templateNotice: undefined,
    });
  };

  private loadTemplates = async () => {
    this.setState({ loadingTemplates: true });
    try {
      const response = await fetch("/api/templates?includeInactive=1");
      const result = (await response.json()) as { data?: Template[]; message?: string };
      if (!response.ok) throw new Error(result.message);
      this.setState({ templates: this.sortedTemplates(result.data ?? []) });
    } catch (error) {
      this.setState({
        templateNotice: {
          kind: "error",
          text: error instanceof Error ? error.message : "โหลดรายชื่อลูกค้าไม่สำเร็จ",
        },
      });
    } finally {
      this.setState({ loadingTemplates: false });
    }
  };

  private selectTemplate = async (templateId: string) => {
    const selectedTemplate = this.state.templates.find((template) => String(template.id) === templateId);
    const initialName = selectedTemplate?.name ?? "";
    this.setState({
      selectedTemplateId: templateId,
      templateName: initialName,
      templateIsActive: selectedTemplate?.isActive ?? true,
      templateInsideDraft: [],
      templateOutsideDraft: [],
      templateStickerFields: TemplateFormDefaults.withRequiredStickerFields(),
      templateStickerLayouts: {
        insideFrame: true,
        outsideFrame: true,
        customerName: false,
        fscLogo: false,
      },
      templateStickerDefaults: TemplateFormDefaults.defaultStickerDefaults(),
      templateNotice: undefined,
    });
    if (!templateId) return;
    this.setState({ loadingTemplate: true });
    try {
      const response = await fetch(`/api/templates/${templateId}/template`);
      const result = (await response.json()) as { data?: TemplateDetail; message?: string };
      if (!response.ok || !result.data) throw new Error(result.message);
      this.setState({
        templateName: result.data.customerName,
        templateInsideDraft: result.data.inside.map((field) => TemplateFormDefaults.normalizeDraftField("inside", field)),
        templateOutsideDraft: TemplateFormDefaults.enforceOutsideVerticalSingleRows(
          result.data.outside.map((field) => TemplateFormDefaults.normalizeDraftField("outside", field)),
        ),
        templateStickerFields: TemplateFormDefaults.withRequiredStickerFields(),
        templateStickerLayouts: TemplateFormDefaults.withRequiredStickerLayouts(result.data.sticker.layouts),
        templateStickerDefaults: { ...DEFAULT_STICKER_DEFAULTS, ...result.data.sticker.defaults },
      });
    } catch (error) {
      this.setState({
        templateNotice: {
          kind: "error",
          text: error instanceof Error ? error.message : "โหลด Template ไม่สำเร็จ",
        },
      });
    } finally {
      this.setState({ loadingTemplate: false });
    }
  };

  private changeTemplateDraft = (
    section: "inside" | "outside",
    index: number,
    patch: Partial<TemplateField>,
  ) => {
    const key = section === "inside" ? "templateInsideDraft" : "templateOutsideDraft";
    this.setState({
      [key]: this.state[key].map((field, fieldIndex) =>
        fieldIndex === index
          ? TemplateFormDefaults.normalizeDraftField(section, { ...field, ...patch })
          : field,
      ),
    } as Pick<TemplateFormState, typeof key>);
  };

  private changeCreateTemplateDraft = (
    section: "inside" | "outside",
    index: number,
    patch: Partial<TemplateField>,
  ) => {
    const key = section === "inside" ? "createInsideDraft" : "createOutsideDraft";
    this.setState({
      [key]: this.state[key].map((field, fieldIndex) =>
        fieldIndex === index
          ? TemplateFormDefaults.normalizeDraftField(section, { ...field, ...patch })
          : field,
      ),
    } as Pick<TemplateFormState, typeof key>);
  };

  private duplicateTemplateToCreateDraft = async (templateId: string) => {
    this.setState({ duplicateSourceTemplateId: templateId, notice: undefined });
    if (!templateId) return;
    this.setState({ duplicatingTemplate: true });
    try {
      const response = await fetch(`/api/templates/${templateId}/template`);
      const result = (await response.json()) as { data?: TemplateDetail; message?: string };
      if (!response.ok || !result.data) throw new Error(result.message);
      this.setState({
        createInsideDraft: result.data.inside.map((field) => TemplateFormDefaults.normalizeDraftField("inside", TemplateFormDefaults.cloneTemplateField(field))),
        createOutsideDraft: TemplateFormDefaults.enforceOutsideVerticalSingleRows(
          result.data.outside.map((field) =>
            TemplateFormDefaults.normalizeDraftField("outside", {
              ...TemplateFormDefaults.cloneTemplateField(field),
              showOnSticker: field.showOnSticker ?? true,
            }),
          ),
        ),
        stickerFields: TemplateFormDefaults.withRequiredStickerFields(),
        stickerLayouts: TemplateFormDefaults.withRequiredStickerLayouts(result.data.sticker.layouts),
        stickerDefaults: { ...DEFAULT_STICKER_DEFAULTS, ...result.data.sticker.defaults },
        notice: {
          kind: "success",
          text: `คัดลอก Template จาก ${result.data.customerName} แล้ว คุณสามารถแก้ไขได้ก่อนสร้าง Template ใหม่`,
        },
      });
    } catch (error) {
      this.setState({
        notice: {
          kind: "error",
          text: error instanceof Error ? error.message : "คัดลอก Template ไม่สำเร็จ",
        },
      });
    } finally {
      this.setState({ duplicatingTemplate: false });
    }
  };

  private addTemplateField = (section: "inside" | "outside", tableOrder?: number) => {
    const key = section === "inside" ? "templateInsideDraft" : "templateOutsideDraft";
    const outsideGroup = section === "outside"
      ? this.outsideGroup(this.state[key] as TemplateField[], tableOrder)
      : undefined;
    if (section === "outside" && TemplateFormDefaults.isVerticalStickerGroupLayout(outsideGroup?.layout)) return;
    const nextField: TemplateField = {
      key: `${section}_field_${TemplateFieldUtils.uid()}`,
      label: "",
      type: "text",
      required: true,
      showOnSticker: true,
      stickerGroup: outsideGroup?.name,
      stickerGroupOrder: outsideGroup?.order,
      stickerGroupLayout: outsideGroup?.layout,
      uppercase: section === "outside" ? true : undefined,
    };
    const currentFields = this.state[key];
    const insertIndex = section === "outside"
      ? this.lastOutsideGroupIndex(currentFields as TemplateField[], outsideGroup?.order ?? 0) + 1
      : currentFields.length;
    const nextFields = [
      ...currentFields.slice(0, insertIndex),
      nextField,
      ...currentFields.slice(insertIndex),
    ];
    this.setState({
      [key]: TemplateFieldUtils.renumberStickerOrders(nextFields),
    } as Pick<TemplateFormState, typeof key>);
  };

  private addCreateTemplateField = (section: "inside" | "outside", tableOrder?: number) => {
    const key = section === "inside" ? "createInsideDraft" : "createOutsideDraft";
    const outsideGroup = section === "outside"
      ? this.outsideGroup(this.state[key] as TemplateField[], tableOrder)
      : undefined;
    if (section === "outside" && TemplateFormDefaults.isVerticalStickerGroupLayout(outsideGroup?.layout)) return;
    const nextField: TemplateField = {
      key: `${section}_field_${TemplateFieldUtils.uid()}`,
      label: "",
      type: "text",
      required: true,
      showOnSticker: true,
      stickerGroup: outsideGroup?.name,
      stickerGroupOrder: outsideGroup?.order,
      stickerGroupLayout: outsideGroup?.layout,
      uppercase: section === "outside" ? true : undefined,
    };
    const currentFields = this.state[key];
    const insertIndex = section === "outside"
      ? this.lastOutsideGroupIndex(currentFields as TemplateField[], outsideGroup?.order ?? 0) + 1
      : currentFields.length;
    const nextFields = [
      ...currentFields.slice(0, insertIndex),
      nextField,
      ...currentFields.slice(insertIndex),
    ];
    this.setState({
      [key]: TemplateFieldUtils.renumberStickerOrders(nextFields),
    } as Pick<TemplateFormState, typeof key>);
  };

  private lastOutsideGroupIndex(fields: TemplateField[], tableOrder: number) {
    return fields.reduce((lastIndex, field, index) =>
      (field.stickerGroupOrder ?? 0) === tableOrder ? index : lastIndex,
      -1);
  }

  private outsideGroup(fields: TemplateField[], requestedOrder?: number) {
    if (!fields.length) return { order: 0, name: "นอกกรอบ 1", layout: "2x2" as const };
    const order = requestedOrder ?? Math.max(...fields.map((field) => field.stickerGroupOrder ?? 0));
    const field = [...fields].reverse().find((item) => (item.stickerGroupOrder ?? 0) === order);
    return {
      order,
      name: field?.stickerGroup ?? `นอกกรอบ ${order + 1}`,
      layout: TemplateFormDefaults.normalizeStickerGroupLayout(field?.stickerGroupLayout),
    };
  }

  private nextOutsideGroupOrder(fields: TemplateField[]) {
    return fields.length ? Math.max(...fields.map((field) => field.stickerGroupOrder ?? 0)) + 1 : 0;
  }

  private addTemplateTable = (layout: StickerGroupLayout) => {
    const tableOrder = this.nextOutsideGroupOrder(this.state.templateOutsideDraft);
    this.setState({
      templateOutsideDraft: TemplateFieldUtils.renumberStickerOrders([
        ...this.state.templateOutsideDraft,
        {
          key: `outside_field_${TemplateFieldUtils.uid()}`,
          label: "",
          type: "text",
          required: true,
          showOnSticker: true,
          stickerGroup: `นอกกรอบ ${tableOrder + 1}`,
          stickerGroupOrder: tableOrder,
          stickerGroupLayout: layout,
          uppercase: true,
          fontScale: undefined,
        },
      ]),
    });
  };

  private addCreateTemplateTable = (layout: StickerGroupLayout) => {
    const tableOrder = this.nextOutsideGroupOrder(this.state.createOutsideDraft);
    this.setState({
      createOutsideDraft: TemplateFieldUtils.renumberStickerOrders([
        ...this.state.createOutsideDraft,
        {
          key: `outside_field_${TemplateFieldUtils.uid()}`,
          label: "",
          type: "text",
          required: true,
          showOnSticker: true,
          stickerGroup: `นอกกรอบ ${tableOrder + 1}`,
          stickerGroupOrder: tableOrder,
          stickerGroupLayout: layout,
          uppercase: true,
          fontScale: undefined,
        },
      ]),
    });
  };

  private renameTemplateTable = (tableOrder: number, name: string) => {
    this.setState({
      templateOutsideDraft: this.state.templateOutsideDraft.map((field) =>
        (field.stickerGroupOrder ?? 0) === tableOrder ? { ...field, stickerGroup: name } : field,
      ),
    });
  };

  private renameCreateTemplateTable = (tableOrder: number, name: string) => {
    this.setState({
      createOutsideDraft: this.state.createOutsideDraft.map((field) =>
        (field.stickerGroupOrder ?? 0) === tableOrder ? { ...field, stickerGroup: name } : field,
      ),
    });
  };

  private changeTemplateTableLayout = (tableOrder: number, layout: StickerGroupLayout) => {
    const nextFields = this.state.templateOutsideDraft.map((field) =>
      (field.stickerGroupOrder ?? 0) === tableOrder
        ? { ...field, stickerGroupLayout: layout, fontScale: TemplateFormDefaults.isVerticalStickerGroupLayout(layout) ? undefined : field.fontScale }
        : field,
    );
    this.setState({
      templateOutsideDraft: TemplateFormDefaults.isVerticalStickerGroupLayout(layout)
        ? TemplateFormDefaults.enforceOutsideVerticalSingleRows(nextFields)
        : nextFields,
    });
  };

  private changeCreateTemplateTableLayout = (tableOrder: number, layout: StickerGroupLayout) => {
    const nextFields = this.state.createOutsideDraft.map((field) =>
      (field.stickerGroupOrder ?? 0) === tableOrder
        ? { ...field, stickerGroupLayout: layout, fontScale: TemplateFormDefaults.isVerticalStickerGroupLayout(layout) ? undefined : field.fontScale }
        : field,
    );
    this.setState({
      createOutsideDraft: TemplateFormDefaults.isVerticalStickerGroupLayout(layout)
        ? TemplateFormDefaults.enforceOutsideVerticalSingleRows(nextFields)
        : nextFields,
    });
  };

  private removeTemplateTable = (tableOrder: number) => {
    this.setState({
      templateOutsideDraft: TemplateFieldUtils.renumberStickerOrders(
        TemplateFieldUtils.renumberOutsideTableOrders(
          this.state.templateOutsideDraft.filter((field) => (field.stickerGroupOrder ?? 0) !== tableOrder),
        ),
      ),
    });
  };

  private removeCreateTemplateTable = (tableOrder: number) => {
    this.setState({
      createOutsideDraft: TemplateFieldUtils.renumberStickerOrders(
        TemplateFieldUtils.renumberOutsideTableOrders(
          this.state.createOutsideDraft.filter((field) => (field.stickerGroupOrder ?? 0) !== tableOrder),
        ),
      ),
    });
  };

  private removeTemplateField = (section: "inside" | "outside", index: number) => {
    const key = section === "inside" ? "templateInsideDraft" : "templateOutsideDraft";
    this.setState({
      [key]: TemplateFieldUtils.renumberStickerOrders(this.state[key].filter((_, fieldIndex) => fieldIndex !== index)),
    } as Pick<TemplateFormState, typeof key>);
  };

  private removeCreateTemplateField = (section: "inside" | "outside", index: number) => {
    const key = section === "inside" ? "createInsideDraft" : "createOutsideDraft";
    this.setState({
      [key]: TemplateFieldUtils.renumberStickerOrders(this.state[key].filter((_, fieldIndex) => fieldIndex !== index)),
    } as Pick<TemplateFormState, typeof key>);
  };

  private moveTemplateField = (section: "inside" | "outside", fromIndex: number, toIndex: number, tableOrder?: number) => {
    const key = section === "inside" ? "templateInsideDraft" : "templateOutsideDraft";
    this.setState({
      [key]: TemplateFieldUtils.moveField(this.state[key], fromIndex, toIndex, section === "outside" ? tableOrder : undefined),
    } as Pick<TemplateFormState, typeof key>);
  };

  private moveCreateTemplateField = (section: "inside" | "outside", fromIndex: number, toIndex: number, tableOrder?: number) => {
    const key = section === "inside" ? "createInsideDraft" : "createOutsideDraft";
    this.setState({
      [key]: TemplateFieldUtils.moveField(this.state[key], fromIndex, toIndex, section === "outside" ? tableOrder : undefined),
    } as Pick<TemplateFormState, typeof key>);
  };

  private moveTemplateTable = (fromOrder: number, toOrder: number) => {
    this.setState({
      templateOutsideDraft: TemplateFieldUtils.moveOutsideTable(this.state.templateOutsideDraft, fromOrder, toOrder),
    });
  };

  private moveCreateTemplateTable = (fromOrder: number, toOrder: number) => {
    this.setState({
      createOutsideDraft: TemplateFieldUtils.moveOutsideTable(this.state.createOutsideDraft, fromOrder, toOrder),
    });
  };

  private setPreviewSlot = (section: "inside" | "outside", slotIndex: number, fieldKey: string) => {
    const key = section === "inside" ? "templateInsideDraft" : "templateOutsideDraft";
    this.setPreviewSlotForDraft(key, slotIndex, fieldKey);
  };

  private setCreatePreviewSlot = (section: "inside" | "outside", slotIndex: number, fieldKey: string) => {
    const key = section === "inside" ? "createInsideDraft" : "createOutsideDraft";
    this.setPreviewSlotForDraft(key, slotIndex, fieldKey);
  };

  private setPreviewSlotForDraft = (
    key: "templateInsideDraft" | "templateOutsideDraft" | "createInsideDraft" | "createOutsideDraft",
    slotIndex: number,
    fieldKey: string,
  ) => {
    const [targetFieldKey, targetSegmentKey] = fieldKey.split(".");
    this.setState({
      [key]: this.state[key].map((field) => {
        if (field.segments?.length) {
          return {
            ...field,
            segments: field.segments.map((segment) => {
              const isTarget = field.key === targetFieldKey && segment.key === targetSegmentKey;
              const isSameSlot = segment.stickerOrder === slotIndex;
              if (isTarget) return { ...segment, showOnSticker: true, stickerOrder: slotIndex };
              if (isSameSlot) return { ...segment, showOnSticker: false, stickerOrder: undefined };
              return segment;
            }),
          };
        }
        if (field.key === targetFieldKey) {
          return fieldKey ? { ...field, showOnSticker: true, stickerOrder: slotIndex } : field;
        }
        if (field.stickerOrder === slotIndex) {
          return { ...field, showOnSticker: false, stickerOrder: undefined };
        }
        return field;
      }),
    } as Pick<TemplateFormState, typeof key>);
  };

  private cleanTemplateFields = (section: "inside" | "outside", fields: TemplateField[]) => {
    const cleaned = fields.map((field, index) => {
      const fieldKey = field.key.trim() || `${section}_field_${TemplateFieldUtils.uid()}`;
      const usedSegmentKeys = new Set<string>();
      const hasSegmentAffixes = field.segments?.some((segment) => segment.prefix?.trim() || segment.suffix?.trim());
      const isVerticalOutside = section === "outside" && TemplateFormDefaults.isVerticalStickerGroupLayout(field.stickerGroupLayout);
      return TemplateFieldUtils.normalizeCounterField({
        ...field,
        key: fieldKey,
        label: field.label.trim().toUpperCase(),
        type: "text",
        displayFormat: hasSegmentAffixes ? undefined : field.displayFormat?.trim() || undefined,
        defaultValue: !field.segments?.length && field.locked
          ? field.defaultValue?.trim() || field.label.trim()
          : section === "outside" ? undefined : field.defaultValue?.trim() || undefined,
        locked: !field.segments?.length ? field.locked === true : false,
        required: true,
        condition: undefined,
        showOnSticker: field.showOnSticker ?? true,
        stickerOrder: field.showOnSticker === false ? undefined : index,
        uppercase: section === "outside" ? field.uppercase ?? true : field.uppercase,
        isCounter: section === "outside" && !field.segments?.length ? field.isCounter : undefined,
        counterType: section === "outside" && !field.segments?.length ? field.counterType : undefined,
        fontScale: section === "outside" && !isVerticalOutside ? field.fontScale : undefined,
        segments: field.segments?.map((segment, segmentIndex) => ({
          ...segment,
          key: TemplateFieldUtils.uniqueSegmentKey(fieldKey, segment.key, segmentIndex, usedSegmentKeys),
          label: segment.label.trim().toUpperCase(),
          type: segment.isCounter ? "number" : "text",
          prefix: segment.prefix ?? "",
          suffix: segment.suffix ?? "",
          showOnSticker: segment.showOnSticker ?? true,
          stickerOrder: segment.showOnSticker === false ? undefined : index * 10 + segmentIndex,
          counterType: segment.counterType ?? TemplateFieldUtils.inferCounterType({ ...field, key: fieldKey }),
        })),
      });
    });
    return section === "outside"
      ? TemplateFieldUtils.renumberStickerOrders(
        TemplateFieldUtils.renumberOutsideTableOrders(TemplateFormDefaults.enforceOutsideVerticalSingleRows(cleaned)),
      )
      : TemplateFieldUtils.renumberStickerOrders(cleaned);
  };

  private validateTemplateDrafts = (
    inside: TemplateField[],
    outside: TemplateField[],
    layouts: TemplateFormState["stickerLayouts"],
  ): string | undefined => {
    if ([...inside, ...outside].some((field) => !field.label || field.segments?.some((segment) => !segment.label))) {
      return "กรุณากรอกชื่อ Field ให้ครบทุกช่อง";
    }
    const requiredLayouts = TemplateFormDefaults.withRequiredStickerLayouts(layouts);
    if (!requiredLayouts.insideFrame && !requiredLayouts.outsideFrame && !requiredLayouts.customerName && !requiredLayouts.fscLogo) {
      return "กรุณาเลือกรูปแบบสติ๊กเกอร์อย่างน้อย 1 แบบ";
    }
    if (
      new Set(inside.map((field) => field.key)).size !== inside.length ||
      new Set(outside.map((field) => field.key)).size !== outside.length
    ) {
      return "มี Field ที่ซ้ำกัน กรุณาลบแล้วเพิ่ม Field ใหม่อีกครั้ง";
    }
    return undefined;
  };

  private saveExistingTemplate = async () => {
    if (!this.state.selectedTemplateId) return;
    if (!this.state.templateName.trim()) {
      this.setState({ templateNotice: { kind: "error", text: "กรุณากรอกชื่อ Template" } });
      return;
    }
    const inside = this.cleanTemplateFields("inside", this.state.templateInsideDraft);
    const outside = this.cleanTemplateFields("outside", this.state.templateOutsideDraft);
    if ([...inside, ...outside].some((field) => !field.label)) {
      this.setState({ templateNotice: { kind: "error", text: "กรุณากรอกชื่อ Field ให้ครบ" } });
      return;
    }
    if (
      !TemplateFormDefaults.withRequiredStickerLayouts(this.state.templateStickerLayouts).insideFrame &&
      !this.state.templateStickerLayouts.outsideFrame &&
      !this.state.templateStickerLayouts.customerName &&
      !this.state.templateStickerLayouts.fscLogo
    ) {
      this.setState({ templateNotice: { kind: "error", text: "เลือกรูปแบบสติ๊กเกอร์ที่ต้องพิมพ์อย่างน้อย 1 แบบ" } });
      return;
    }
    if (
      new Set(inside.map((field) => field.key)).size !== inside.length ||
      new Set(outside.map((field) => field.key)).size !== outside.length
    ) {
      this.setState({ templateNotice: { kind: "error", text: "ชื่อ Field บางรายการซ้ำกันในระบบ กรุณาลบแล้วเพิ่ม Field ใหม่อีกครั้ง" } });
      return;
    }

    this.setState({ savingTemplate: true, templateNotice: undefined });
    try {
      const response = await fetch(`/api/templates/${this.state.selectedTemplateId}/template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: this.state.templateName.trim(),
          isActive: this.state.templateIsActive,
          inside,
          outside,
          sticker: {
            enabledFields: TemplateFormDefaults.withRequiredStickerFields(),
            layouts: TemplateFormDefaults.withRequiredStickerLayouts(this.state.templateStickerLayouts),
            defaults: this.state.templateStickerDefaults,
          },
        }),
      });
      const result = (await response.json()) as { data?: TemplateDetail; message?: string };
      if (!response.ok || !result.data) throw new Error(result.message);
      this.setState({
        templateName: result.data.customerName,
        templateInsideDraft: result.data.inside.map((field) => TemplateFormDefaults.normalizeDraftField("inside", field)),
        templateOutsideDraft: TemplateFormDefaults.enforceOutsideVerticalSingleRows(
          result.data.outside.map((field) => TemplateFormDefaults.normalizeDraftField("outside", field)),
        ),
        templateNotice: { kind: "success", text: "บันทึก Sticker Template แล้ว" },
      });
      await this.loadTemplates();
    } catch (error) {
      this.setState({
        templateNotice: {
          kind: "error",
          text: error instanceof Error ? error.message : "บันทึก Template ไม่สำเร็จ",
        },
      });
    } finally {
      this.setState({ savingTemplate: false });
    }
  };

  private cancelTemplateEdit = async () => {
    if (!this.state.selectedTemplateId || this.state.loadingTemplate || this.state.savingTemplate) return;
    await this.selectTemplate(this.state.selectedTemplateId);
  };

  private changeTemplateName = (name: string) => {
    this.setState({ templateName: name });
  };

  private sortedTemplates(templates: Template[]) {
    return [...templates].sort((first, second) =>
      Number(second.isActive) - Number(first.isActive) ||
      first.name.localeCompare(second.name),
    );
  }

  private changeStickerDefaults = (stickerDefaults: TemplateFormState["stickerDefaults"]) => {
    this.setState({
      stickerDefaults,
      stickerLayouts: {
        ...this.state.stickerLayouts,
        fscLogo: stickerDefaults.stickerType === "TNR" && stickerDefaults.stickerFsc,
      },
    });
  };

  private changeTemplateStickerDefaults = (templateStickerDefaults: TemplateFormState["templateStickerDefaults"]) => {
    this.setState({
      templateStickerDefaults,
      templateStickerLayouts: {
        ...this.state.templateStickerLayouts,
        fscLogo: templateStickerDefaults.stickerType === "TNR" && templateStickerDefaults.stickerFsc,
      },
    });
  };

  private dismissNotice = () => {
    this.setState({ notice: undefined });
  };

  private dismissTemplateNotice = () => {
    this.setState({ templateNotice: undefined });
  };

  private changeSegmentCount = (groupKey: InsideGroup["key"], count: number) => {
    this.setState((current) => ({
      groups: current.groups.map((group) => {
        if (group.key !== groupKey) return group;
        const segments = TemplateManageModelFactory.createSegments(groupKey, count)
          .map((segment, index) => group.segments[index] ?? segment);
        const hasCounter = segments.some((segment) => segment.isCounter);
        return {
          ...group,
          segments: segments.map((segment, index) => ({
            ...segment,
            isCounter: hasCounter ? segment.isCounter : index === 0,
          })),
        };
      }),
    }));
  };

  private updateTable = (tableId: string, update: (table: OutsideTable) => OutsideTable) => {
    this.setState((current) => ({
      tables: current.tables.map((table) => (table.id === tableId ? update(table) : table)),
    }));
  };

  private updateTables = (updater: (tables: OutsideTable[]) => OutsideTable[]) => {
    this.setState((current) => ({ tables: updater(current.tables) }));
  };

  private updateGroupSegment = (groupKey: InsideGroup["key"], segmentIndex: number, label: string) => {
    this.setState((current) => ({
      groups: current.groups.map((group) => {
        if (group.key !== groupKey) return group;
        return {
          ...group,
          segments: group.segments.map((segment, index) =>
            index === segmentIndex ? { ...segment, label } : segment,
          ),
        };
      }),
    }));
  };

  private findDuplicateTemplate = (name: string) => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return undefined;
    return this.state.templates.find((template) => template.name.trim().toLowerCase() === normalized);
  };

  private resetCreateForm = (notice: TemplateFormState["notice"]) => {
    this.setState({
      name: "",
      isActive: true,
      createInsideDraft: TemplateFormDefaults.createDefaultInsideDraft(),
      createOutsideDraft: [],
      duplicateSourceTemplateId: "",
      duplicateNamePrompt: undefined,
      stickerFields: TemplateFormDefaults.withRequiredStickerFields(),
      stickerLayouts: {
        insideFrame: true,
        outsideFrame: true,
        customerName: false,
        fscLogo: false,
      },
      stickerDefaults: TemplateFormDefaults.defaultStickerDefaults(),
      notice,
    });
  };

  private submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.setState({ notice: undefined });
    const inside = this.cleanTemplateFields("inside", this.state.createInsideDraft);
    const outside = this.cleanTemplateFields("outside", this.state.createOutsideDraft);
    const validationError = this.validateTemplateDrafts(inside, outside, this.state.stickerLayouts);
    if (validationError) {
      this.setState({ notice: { kind: "error", text: validationError } });
      return;
    }

    const duplicate = this.findDuplicateTemplate(this.state.name);
    if (duplicate) {
      this.setState({
        duplicateNamePrompt: { templateId: String(duplicate.id), name: duplicate.name },
      });
      return;
    }

    await this.createTemplate(inside, outside);
  };

  private createTemplate = async (inside: TemplateField[], outside: TemplateField[]) => {
    const payload: CreateTemplatePayload = {
      name: this.state.name,
      isActive: this.state.isActive,
      configuration: {
        version: 2,
        sticker: {
          enabledFields: TemplateFormDefaults.withRequiredStickerFields(),
          layouts: TemplateFormDefaults.withRequiredStickerLayouts(this.state.stickerLayouts),
          defaults: this.state.stickerDefaults,
        },
        inside: { groups: this.state.groups, fields: [...fixedInsideFields] },
        outside: { tables: this.state.tables },
      },
      template: {
        sticker: {
          enabledFields: TemplateFormDefaults.withRequiredStickerFields(),
          layouts: TemplateFormDefaults.withRequiredStickerLayouts(this.state.stickerLayouts),
          defaults: this.state.stickerDefaults,
        },
        inside,
        outside,
      },
    };

    this.setState({ saving: true });
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      this.resetCreateForm({
        kind: "success",
        text: `เพิ่ม ${result.data.name} เรียบร้อยแล้ว (Template ID: ${result.data.id})`,
      });
      await this.loadTemplates();
    } catch (error) {
      this.setState({
        notice: {
          kind: "error",
          text: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ",
        },
      });
    } finally {
      this.setState({ saving: false });
    }
  };

  private dismissDuplicatePrompt = () => {
    this.setState({ duplicateNamePrompt: undefined });
  };

  private replaceDuplicateTemplate = async () => {
    const prompt = this.state.duplicateNamePrompt;
    if (!prompt) return;
    const inside = this.cleanTemplateFields("inside", this.state.createInsideDraft);
    const outside = this.cleanTemplateFields("outside", this.state.createOutsideDraft);
    this.setState({ saving: true, duplicateNamePrompt: undefined });
    try {
      const response = await fetch(`/api/templates/${prompt.templateId}/template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inside,
          outside,
          isActive: this.state.isActive,
          sticker: {
            enabledFields: TemplateFormDefaults.withRequiredStickerFields(),
            layouts: TemplateFormDefaults.withRequiredStickerLayouts(this.state.stickerLayouts),
            defaults: this.state.stickerDefaults,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      this.resetCreateForm({
        kind: "success",
        text: `แทนที่ Template ของ ${prompt.name} เรียบร้อยแล้ว`,
      });
      await this.loadTemplates();
    } catch (error) {
      this.setState({
        notice: {
          kind: "error",
          text: error instanceof Error ? error.message : "แทนที่ Template ไม่สำเร็จ",
        },
      });
    } finally {
      this.setState({ saving: false });
    }
  };

  render() {
    return (
      <div className="template-admin">
        <main className="template-form-wrap">
          {this.state.checkingRole && <Toast type="success" message="กำลังตรวจสอบสิทธิ์..." />}
          {!this.state.checkingRole && !this.state.isAdmin && (
            <Toast type="error" message="เฉพาะ Admin เท่านั้นที่จัดการ Template และ Sticker Template ได้" />
          )}
          {!this.state.checkingRole && this.state.isAdmin && (
            <>
              <div className="template-admin-top">
                <div className="template-mode-switch" aria-label="เลือกโหมดจัดการ Template">
                  <Button
                    type="button"
                    className={this.state.mode === "edit" ? "active" : ""}
                    onClick={() => this.changeMode("edit")}
                  >
                    แก้ไข Template
                  </Button>
                  <Button
                    type="button"
                    className={this.state.mode === "create" ? "active" : ""}
                    onClick={() => this.changeMode("create")}
                  >
                    เพิ่ม Template
                  </Button>
                </div>
                <div className="template-mode-help">
                  <strong>{this.state.mode === "edit" ? "เลือก Tempate เดิม แล้วปรับช่องบนสติ๊กเกอร์" : "สร้าง Template ใหม่ แล้วกำหนดช่องที่ User ต้องกรอก"}</strong>
                  <span>{this.state.mode === "edit" ? "เหมาะกับการแก้ Field, ลำดับ Preview และ Template ที่ใช้อยู่" : "ทำตามลำดับ 1 ถึง 4 แล้วกดบันทึกด้านล่าง"}</span>
                </div>
              </div>
              {this.state.mode === "edit" && (
                <EditTemplateForm
                  templates={this.state.templates}
                  selectedTemplateId={this.state.selectedTemplateId}
                  name={this.state.templateName}
                  isActive={this.state.templateIsActive}
                  insideDraft={this.state.templateInsideDraft}
                  outsideDraft={this.state.templateOutsideDraft}
                  stickerLayouts={this.state.templateStickerLayouts}
                  stickerDefaults={this.state.templateStickerDefaults}
                  notice={this.state.templateNotice}
                  loadingTemplates={this.state.loadingTemplates}
                  loadingTemplate={this.state.loadingTemplate}
                  savingTemplate={this.state.savingTemplate}
                  onDismissNotice={this.dismissTemplateNotice}
                  onSelectTemplate={(templateId) => void this.selectTemplate(templateId)}
                  onNameChange={this.changeTemplateName}
                  onActiveChange={(isActive) => this.setState({ templateIsActive: isActive })}
                  onSave={() => void this.saveExistingTemplate()}
                  onCancel={() => void this.cancelTemplateEdit()}
                  onStickerDefaultsChange={this.changeTemplateStickerDefaults}
                  onSelectPreviewSlot={this.setPreviewSlot}
                  onChangeField={this.changeTemplateDraft}
                  onAddField={this.addTemplateField}
                  onRemoveField={this.removeTemplateField}
                  onMoveField={this.moveTemplateField}
                  onAddTable={this.addTemplateTable}
                  onRenameTable={this.renameTemplateTable}
                  onChangeTableLayout={this.changeTemplateTableLayout}
                  onRemoveTable={this.removeTemplateTable}
                  onMoveTable={this.moveTemplateTable}
                />
              )}
              {this.state.mode === "create" && (
                <CreateTemplateForm
                  templates={this.state.templates}
                  name={this.state.name}
                  isActive={this.state.isActive}
                  duplicateSourceTemplateId={this.state.duplicateSourceTemplateId}
                  stickerLayouts={this.state.stickerLayouts}
                  stickerDefaults={this.state.stickerDefaults}
                  groups={this.state.groups}
                  tables={this.state.tables}
                  fixedInsideFields={fixedInsideFields}
                  insideDraft={this.state.createInsideDraft}
                  outsideDraft={this.state.createOutsideDraft}
                  notice={this.state.notice}
                  loadingTemplates={this.state.loadingTemplates}
                  duplicatingTemplate={this.state.duplicatingTemplate}
                  saving={this.state.saving}
                  onDismissNotice={this.dismissNotice}
                  onSubmit={this.submit}
                  onNameChange={(name) => this.setState({ name })}
                  onActiveChange={(isActive) => this.setState({ isActive })}
                  onDuplicateSourceChange={(templateId) => void this.duplicateTemplateToCreateDraft(templateId)}
                  onStickerDefaultsChange={this.changeStickerDefaults}
                  onSegmentCountChange={this.changeSegmentCount}
                  onGroupSegmentChange={this.updateGroupSegment}
                  onTablesChange={this.updateTables}
                  onTableUpdate={this.updateTable}
                  onSelectPreviewSlot={this.setCreatePreviewSlot}
                  onChangeField={this.changeCreateTemplateDraft}
                  onAddField={this.addCreateTemplateField}
                  onRemoveField={this.removeCreateTemplateField}
                  onMoveField={this.moveCreateTemplateField}
                  onAddTable={this.addCreateTemplateTable}
                  onRenameTable={this.renameCreateTemplateTable}
                  onChangeTableLayout={this.changeCreateTemplateTableLayout}
                  onRemoveTable={this.removeCreateTemplateTable}
                  onMoveTable={this.moveCreateTemplateTable}
                />
              )}
            </>
          )}
        </main>
        <Modal
          open={!!this.state.duplicateNamePrompt}
          title="มี template นี้อยู่แล้ว"
          subtitle={``}
          onClose={this.dismissDuplicatePrompt}
          footer={(
            <div className="duplicate-template-actions">
              <Button type="button" className="duplicate-template-secondary" onClick={this.dismissDuplicatePrompt}>
                เปลี่ยนชื่อ
              </Button>
              <Button
                type="button"
                className="duplicate-template-primary"
                onClick={() => void this.replaceDuplicateTemplate()}
                loading={this.state.saving}
                loadingText="กำลังแทนที่..."
              >
                แทนที่ Template เดิม
              </Button>
            </div>
          )}
        >
          <div className="duplicate-template-alert">
            <div className="duplicate-template-icon" aria-hidden="true">!</div>
            <div className="duplicate-template-copy">
              <span className="duplicate-template-eyebrow">พบชื่อซ้ำในระบบ</span>
              <strong>{this.state.duplicateNamePrompt?.name ?? ""}</strong>
              <div className="duplicate-template-note">
                <b>แนะนำ:</b>
                <span>เลือก “เปลี่ยนชื่อ” ถ้านี่เป็น Template คนละราย หรือ คนละ template</span>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}
