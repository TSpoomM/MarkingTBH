import Store from "@/src/core/store/store";
import { templateApiService, TemplateApiService } from "@/src/core/services/template-api.service";
import { sessionApiService, SessionApiService } from "@/src/core/services/session-api.service";
import type { Template, StickerDefaults, StickerGroupLayout, TemplateDetail, TemplateField } from "@/src/core/models/template";
import { DEFAULT_STICKER_DEFAULTS, type CreateTemplatePayload } from "@/src/core/models/template-form";
import {
  fixedInsideFields,
  initialGroups,
  type TemplateFormState,
  type TemplateManageMode,
} from "@/src/core/models/manage-template";
import TemplateFormDefaults from "@/src/core/templates/templateFormDefaults";
import TemplateFieldUtils from "@/src/core/templates/templateFieldUtils";
import DateFormatter from "@/src/core/dates/dateFormatter";

/** The manage-template page keeps two independent drafts side by side. */
export type TemplateFormTarget = "edit" | "create";
type Section = "inside" | "outside";
type DraftKey = "templateInsideDraft" | "templateOutsideDraft" | "createInsideDraft" | "createOutsideDraft";

const EMPTY_LAYOUTS = {
  insideFrame: true,
  outsideFrame: true,
  customerName: false,
  fscLogo: false,
} as const;

const DRAFT_KEYS: Record<TemplateFormTarget, Record<Section, DraftKey>> = {
  edit: { inside: "templateInsideDraft", outside: "templateOutsideDraft" },
  create: { inside: "createInsideDraft", outside: "createOutsideDraft" },
};

const FORM_KEYS = {
  edit: {
    name: "templateName",
    isActive: "templateIsActive",
    notice: "templateNotice",
    layouts: "templateStickerLayouts",
    defaults: "templateStickerDefaults",
  },
  create: {
    name: "name",
    isActive: "isActive",
    notice: "notice",
    layouts: "stickerLayouts",
    defaults: "stickerDefaults",
  },
} as const;

/** The two drafts report the same problems with different wording. */
const VALIDATION_MESSAGES: Record<TemplateFormTarget, { emptyLabel: string; noLayout: string; duplicateKey: string }> = {
  edit: {
    emptyLabel: "กรุณากรอกชื่อ Field ให้ครบ",
    noLayout: "เลือกรูปแบบสติ๊กเกอร์ที่ต้องพิมพ์อย่างน้อย 1 แบบ",
    duplicateKey: "ชื่อ Field บางรายการซ้ำกันในระบบ กรุณาลบแล้วเพิ่ม Field ใหม่อีกครั้ง",
  },
  create: {
    emptyLabel: "กรุณากรอกชื่อ Field ให้ครบทุกช่อง",
    noLayout: "กรุณาเลือกรูปแบบสติ๊กเกอร์อย่างน้อย 1 แบบ",
    duplicateKey: "มี Field ที่ซ้ำกัน กรุณาลบแล้วเพิ่ม Field ใหม่อีกครั้ง",
  },
};

const INITIAL_TEMPLATE_FORM_STATE: TemplateFormState = {
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
  stickerLayouts: { ...EMPTY_LAYOUTS },
  stickerDefaults: TemplateFormDefaults.defaultStickerDefaults(),
  templateStickerLayouts: { ...EMPTY_LAYOUTS },
  templateStickerDefaults: TemplateFormDefaults.defaultStickerDefaults(),
  duplicateNamePrompt: undefined,
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

export class TemplateManageController extends Store<TemplateFormState> {
  constructor(
    private readonly service: TemplateApiService,
    private readonly session: SessionApiService,
  ) {
    super({ ...INITIAL_TEMPLATE_FORM_STATE });
  }

  protected async load() {
    const isAdmin = await this.session.isAdmin();
    this.setState({ isAdmin, checkingRole: false });
    if (isAdmin) await this.loadTemplates();
  }

  private patch<K extends keyof TemplateFormState>(key: K, value: TemplateFormState[K]) {
    this.setState({ [key]: value } as unknown as Partial<TemplateFormState>);
  }

  private draft(target: TemplateFormTarget, section: Section) {
    const key = DRAFT_KEYS[target][section];
    return { key, fields: this.state[key] };
  }

  private outsideDraftKey(target: TemplateFormTarget) {
    return DRAFT_KEYS[target].outside;
  }

  private errorText(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  private setNotice(target: TemplateFormTarget, notice: TemplateFormState["notice"]) {
    this.patch(FORM_KEYS[target].notice, notice);
  }

  changeMode = (mode: TemplateManageMode) => {
    this.setState({ mode, notice: undefined, templateNotice: undefined });
  };

  loadTemplates = async () => {
    this.setState({ loadingTemplates: true });
    try {
      this.setState({ templates: this.sortedTemplates(await this.service.getTemplates()) });
    } catch (error) {
      this.setState({
        templateNotice: { kind: "error", text: this.errorText(error, "โหลดรายชื่อลูกค้าไม่สำเร็จ") },
      });
    } finally {
      this.setState({ loadingTemplates: false });
    }
  };

  private sortedTemplates(templates: Template[]) {
    return [...templates].sort((first, second) =>
      Number(second.isActive) - Number(first.isActive) ||
      first.name.localeCompare(second.name),
    );
  }

  private editDraftsFrom(detail: TemplateDetail) {
    return {
      templateInsideDraft: detail.inside.map((field) => TemplateFormDefaults.normalizeDraftField("inside", field)),
      templateOutsideDraft: TemplateFormDefaults.enforceOutsideVerticalSingleRows(
        detail.outside.map((field) => TemplateFormDefaults.normalizeDraftField("outside", field)),
      ),
    };
  }

  selectTemplate = async (templateId: string) => {
    const selectedTemplate = this.state.templates.find((template) => String(template.id) === templateId);
    this.setState({
      selectedTemplateId: templateId,
      templateName: selectedTemplate?.name ?? "",
      templateIsActive: selectedTemplate?.isActive ?? true,
      templateInsideDraft: [],
      templateOutsideDraft: [],
      templateStickerLayouts: { ...EMPTY_LAYOUTS },
      templateStickerDefaults: TemplateFormDefaults.defaultStickerDefaults(),
      templateNotice: undefined,
    });
    if (!templateId) return;
    this.setState({ loadingTemplate: true });
    try {
      const detail = await this.service.getTemplate(templateId);
      this.setState({
        templateName: detail.customerName,
        ...this.editDraftsFrom(detail),
        templateStickerLayouts: TemplateFormDefaults.withRequiredStickerLayouts(detail.sticker.layouts),
        templateStickerDefaults: { ...DEFAULT_STICKER_DEFAULTS, ...detail.sticker.defaults },
      });
    } catch (error) {
      this.setState({ templateNotice: { kind: "error", text: this.errorText(error, "โหลด Template ไม่สำเร็จ") } });
    } finally {
      this.setState({ loadingTemplate: false });
    }
  };

  duplicateTemplateToCreateDraft = async (templateId: string) => {
    this.setState({ duplicateSourceTemplateId: templateId, notice: undefined });
    if (!templateId) return;
    this.setState({ duplicatingTemplate: true });
    try {
      const detail = await this.service.getTemplate(templateId);
      this.setState({
        createInsideDraft: detail.inside.map((field) =>
          TemplateFormDefaults.normalizeDraftField("inside", TemplateFormDefaults.cloneTemplateField(field)),
        ),
        createOutsideDraft: TemplateFormDefaults.enforceOutsideVerticalSingleRows(
          detail.outside.map((field) =>
            TemplateFormDefaults.normalizeDraftField("outside", {
              ...TemplateFormDefaults.cloneTemplateField(field),
              showOnSticker: field.showOnSticker ?? true,
            }),
          ),
        ),
        stickerLayouts: TemplateFormDefaults.withRequiredStickerLayouts(detail.sticker.layouts),
        stickerDefaults: { ...DEFAULT_STICKER_DEFAULTS, ...detail.sticker.defaults },
        notice: {
          kind: "success",
          text: `คัดลอก Template จาก ${detail.customerName} แล้ว คุณสามารถแก้ไขได้ก่อนสร้าง Template ใหม่`,
        },
      });
    } catch (error) {
      this.setState({ notice: { kind: "error", text: this.errorText(error, "คัดลอก Template ไม่สำเร็จ") } });
    } finally {
      this.setState({ duplicatingTemplate: false });
    }
  };

  changeDraftField = (target: TemplateFormTarget, section: Section, index: number, fieldPatch: Partial<TemplateField>) => {
    const { key, fields } = this.draft(target, section);
    this.patch(key, fields.map((field, fieldIndex) =>
      fieldIndex === index
        ? TemplateFormDefaults.normalizeDraftField(section, { ...field, ...fieldPatch })
        : field,
    ));
  };

  addField = (target: TemplateFormTarget, section: Section, tableOrder?: number) => {
    const { key, fields } = this.draft(target, section);
    const outsideGroup = section === "outside" ? this.outsideGroup(fields, tableOrder) : undefined;
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
    const insertIndex = section === "outside"
      ? this.lastOutsideGroupIndex(fields, outsideGroup?.order ?? 0) + 1
      : fields.length;
    this.patch(key, TemplateFieldUtils.renumberStickerOrders([
      ...fields.slice(0, insertIndex),
      nextField,
      ...fields.slice(insertIndex),
    ]));
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

  addTable = (target: TemplateFormTarget, layout: StickerGroupLayout) => {
    const key = this.outsideDraftKey(target);
    const fields = this.state[key];
    const tableOrder = this.nextOutsideGroupOrder(fields);
    this.patch(key, TemplateFieldUtils.renumberStickerOrders([
      ...fields,
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
    ]));
  };

  renameTable = (target: TemplateFormTarget, tableOrder: number, name: string) => {
    const key = this.outsideDraftKey(target);
    this.patch(key, this.state[key].map((field) =>
      (field.stickerGroupOrder ?? 0) === tableOrder ? { ...field, stickerGroup: name } : field,
    ));
  };

  changeTableLayout = (target: TemplateFormTarget, tableOrder: number, layout: StickerGroupLayout) => {
    const key = this.outsideDraftKey(target);
    const isVertical = TemplateFormDefaults.isVerticalStickerGroupLayout(layout);
    const nextFields = this.state[key].map((field) =>
      (field.stickerGroupOrder ?? 0) === tableOrder
        ? { ...field, stickerGroupLayout: layout, fontScale: isVertical ? undefined : field.fontScale }
        : field,
    );
    this.patch(key, isVertical ? TemplateFormDefaults.enforceOutsideVerticalSingleRows(nextFields) : nextFields);
  };

  removeTable = (target: TemplateFormTarget, tableOrder: number) => {
    const key = this.outsideDraftKey(target);
    this.patch(key, TemplateFieldUtils.renumberStickerOrders(
      TemplateFieldUtils.renumberOutsideTableOrders(
        this.state[key].filter((field) => (field.stickerGroupOrder ?? 0) !== tableOrder),
      ),
    ));
  };

  removeField = (target: TemplateFormTarget, section: Section, index: number) => {
    const { key, fields } = this.draft(target, section);
    this.patch(key, TemplateFieldUtils.renumberStickerOrders(
      fields.filter((_, fieldIndex) => fieldIndex !== index),
    ));
  };

  moveField = (target: TemplateFormTarget, section: Section, fromIndex: number, toIndex: number, tableOrder?: number) => {
    const { key, fields } = this.draft(target, section);
    this.patch(key, TemplateFieldUtils.moveField(
      fields, fromIndex, toIndex, section === "outside" ? tableOrder : undefined,
    ));
  };

  moveTable = (target: TemplateFormTarget, fromOrder: number, toOrder: number) => {
    const key = this.outsideDraftKey(target);
    this.patch(key, TemplateFieldUtils.moveOutsideTable(this.state[key], fromOrder, toOrder));
  };

  /** Puts one field into a sticker preview slot and clears whoever held that slot. */
  setPreviewSlot = (target: TemplateFormTarget, section: Section, slotIndex: number, fieldKey: string) => {
    const { key, fields } = this.draft(target, section);
    const [targetFieldKey, targetSegmentKey] = fieldKey.split(".");
    this.patch(key, fields.map((field) => {
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
    }));
  };

  changeName = (target: TemplateFormTarget, name: string) => {
    this.patch(FORM_KEYS[target].name, name);
  };

  setIsActive = (target: TemplateFormTarget, isActive: boolean) => {
    this.patch(FORM_KEYS[target].isActive, isActive);
  };

  /** The FSC layout follows the sticker defaults, so both move together. */
  changeStickerDefaults = (target: TemplateFormTarget, defaults: StickerDefaults) => {
    const keys = FORM_KEYS[target];
    this.patch(keys.defaults, defaults);
    this.patch(keys.layouts, {
      ...this.state[keys.layouts],
      fscLogo: defaults.stickerType === "TNR" && defaults.stickerFsc,
    });
  };

  dismissNotice = (target: TemplateFormTarget) => {
    this.setNotice(target, undefined);
  };

  private cleanFields(section: Section, fields: TemplateField[]) {
    const cleaned = fields.map((field, index) => {
      const fieldKey = field.key.trim() || `${section}_field_${TemplateFieldUtils.uid()}`;
      const usedSegmentKeys = new Set<string>();
      const hasSegmentAffixes = field.segments?.some((segment) => segment.prefix?.trim() || segment.suffix?.trim());
      const isVerticalOutside = section === "outside" && TemplateFormDefaults.isVerticalStickerGroupLayout(field.stickerGroupLayout);
      return TemplateFieldUtils.normalizeCounterField({
        ...field,
        key: fieldKey,
        label: field.label.trim().toUpperCase(),
        type: field.isCounter ? "number" : field.type ?? "text",
        displayFormat: hasSegmentAffixes ? undefined : field.displayFormat?.trim() || undefined,
        dateFormat: field.type === "date" ? DateFormatter.normalizeFormat(field.dateFormat) : undefined,
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
        counterPad4: section === "outside" && !field.segments?.length ? field.counterPad4 : undefined,
        fontScale: section === "outside" && !isVerticalOutside ? field.fontScale : undefined,
        segments: field.segments?.map((segment, segmentIndex) => ({
          ...segment,
          key: TemplateFieldUtils.uniqueSegmentKey(fieldKey, segment.key, segmentIndex, usedSegmentKeys),
          label: segment.label.trim().toUpperCase(),
          type: segment.isCounter ? "number" : segment.type ?? "text",
          dateFormat: segment.type === "date" ? DateFormatter.normalizeFormat(segment.dateFormat ?? field.dateFormat) : undefined,
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
  }

  private cleanDrafts(target: TemplateFormTarget) {
    return {
      inside: this.cleanFields("inside", this.draft(target, "inside").fields),
      outside: this.cleanFields("outside", this.draft(target, "outside").fields),
    };
  }

  /**
   * The create draft also rejects empty segment labels; the edit draft never has,
   * so the two keep their own predicate as well as their own wording.
   */
  private validateDrafts(target: TemplateFormTarget, inside: TemplateField[], outside: TemplateField[]) {
    const messages = VALIDATION_MESSAGES[target];
    const hasEmptyLabel = [...inside, ...outside].some((field) =>
      !field.label || (target === "create" && field.segments?.some((segment) => !segment.label)),
    );
    if (hasEmptyLabel) return messages.emptyLabel;

    const layouts = TemplateFormDefaults.withRequiredStickerLayouts(this.state[FORM_KEYS[target].layouts]);
    if (!layouts.insideFrame && !layouts.outsideFrame && !layouts.customerName && !layouts.fscLogo) {
      return messages.noLayout;
    }
    if (
      new Set(inside.map((field) => field.key)).size !== inside.length ||
      new Set(outside.map((field) => field.key)).size !== outside.length
    ) {
      return messages.duplicateKey;
    }
    return undefined;
  }

  private stickerPayload(target: TemplateFormTarget) {
    const keys = FORM_KEYS[target];
    return {
      enabledFields: TemplateFormDefaults.withRequiredStickerFields(),
      layouts: TemplateFormDefaults.withRequiredStickerLayouts(this.state[keys.layouts]),
      defaults: this.state[keys.defaults],
    };
  }

  saveExistingTemplate = async () => {
    if (!this.state.selectedTemplateId) return;
    if (!this.state.templateName.trim()) {
      this.setState({ templateNotice: { kind: "error", text: "กรุณากรอกชื่อ Template" } });
      return;
    }
    const { inside, outside } = this.cleanDrafts("edit");
    const validationError = this.validateDrafts("edit", inside, outside);
    if (validationError) {
      this.setState({ templateNotice: { kind: "error", text: validationError } });
      return;
    }

    this.setState({ savingTemplate: true, templateNotice: undefined });
    try {
      const detail = await this.service.saveTemplate(this.state.selectedTemplateId, {
        name: this.state.templateName.trim(),
        isActive: this.state.templateIsActive,
        inside,
        outside,
        sticker: this.stickerPayload("edit"),
      });
      this.setState({
        templateName: detail.customerName,
        ...this.editDraftsFrom(detail),
        templateNotice: { kind: "success", text: "บันทึก Sticker Template แล้ว" },
      });
      await this.loadTemplates();
    } catch (error) {
      this.setState({ templateNotice: { kind: "error", text: this.errorText(error, "บันทึก Template ไม่สำเร็จ") } });
    } finally {
      this.setState({ savingTemplate: false });
    }
  };

  cancelTemplateEdit = async () => {
    if (!this.state.selectedTemplateId || this.state.loadingTemplate || this.state.savingTemplate) return;
    await this.selectTemplate(this.state.selectedTemplateId);
  };

  private findDuplicateTemplate(name: string) {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return undefined;
    return this.state.templates.find((template) => template.name.trim().toLowerCase() === normalized);
  }

  private resetCreateForm(notice: TemplateFormState["notice"]) {
    this.setState({
      name: "",
      isActive: true,
      createInsideDraft: TemplateFormDefaults.createDefaultInsideDraft(),
      createOutsideDraft: [],
      duplicateSourceTemplateId: "",
      duplicateNamePrompt: undefined,
      stickerLayouts: { ...EMPTY_LAYOUTS },
      stickerDefaults: TemplateFormDefaults.defaultStickerDefaults(),
      notice,
    });
  }

  submitCreate = async () => {
    this.setState({ notice: undefined });
    const { inside, outside } = this.cleanDrafts("create");
    const validationError = this.validateDrafts("create", inside, outside);
    if (validationError) {
      this.setState({ notice: { kind: "error", text: validationError } });
      return;
    }

    const duplicate = this.findDuplicateTemplate(this.state.name);
    if (duplicate) {
      this.setState({ duplicateNamePrompt: { templateId: String(duplicate.id), name: duplicate.name } });
      return;
    }

    await this.createTemplate(inside, outside);
  };

  private async createTemplate(inside: TemplateField[], outside: TemplateField[]) {
    const sticker = this.stickerPayload("create");
    const payload: CreateTemplatePayload = {
      name: this.state.name,
      isActive: this.state.isActive,
      configuration: {
        version: 2,
        sticker,
        inside: { groups: initialGroups, fields: [...fixedInsideFields] },
        outside: { tables: [] },
      },
      template: { sticker, inside, outside },
    };

    this.setState({ saving: true });
    try {
      const created = await this.service.createTemplate(payload);
      this.resetCreateForm({
        kind: "success",
        text: `เพิ่ม ${created.name} เรียบร้อยแล้ว (Template ID: ${created.id})`,
      });
      await this.loadTemplates();
    } catch (error) {
      this.setState({ notice: { kind: "error", text: this.errorText(error, "บันทึกไม่สำเร็จ") } });
    } finally {
      this.setState({ saving: false });
    }
  }

  dismissDuplicatePrompt = () => {
    this.setState({ duplicateNamePrompt: undefined });
  };

  replaceDuplicateTemplate = async () => {
    const prompt = this.state.duplicateNamePrompt;
    if (!prompt) return;
    const { inside, outside } = this.cleanDrafts("create");
    this.setState({ saving: true, duplicateNamePrompt: undefined });
    try {
      await this.service.saveTemplate(prompt.templateId, {
        isActive: this.state.isActive,
        inside,
        outside,
        sticker: this.stickerPayload("create"),
      });
      this.resetCreateForm({ kind: "success", text: `แทนที่ Template ของ ${prompt.name} เรียบร้อยแล้ว` });
      await this.loadTemplates();
    } catch (error) {
      this.setState({ notice: { kind: "error", text: this.errorText(error, "แทนที่ Template ไม่สำเร็จ") } });
    } finally {
      this.setState({ saving: false });
    }
  };
}

export const templateManageStore = new TemplateManageController(templateApiService, sessionApiService);
