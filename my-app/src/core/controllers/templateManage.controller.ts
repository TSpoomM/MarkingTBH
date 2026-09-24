import Store from "@/src/core/store/store";
import { templateApiService, TemplateApiService } from "@/src/core/services/client/template-api.service";
import { sessionApiService, SessionApiService } from "@/src/core/services/client/session-api.service";
import type { Template, StickerDefaults, StickerGroupLayout, TemplateDetail, TemplateField } from "@/src/core/models/template";
import { DEFAULT_STICKER_DEFAULTS, type CreateTemplatePayload } from "@/src/core/models/template-form";
import {
  fixedInsideFields,
  initialGroups,
  type TemplateFormState,
  type TemplateFormTarget,
  type TemplateFieldPreset,
  type TemplateManageMode,
  type TemplateSection,
} from "@/src/core/models/manage-template";
import TemplateFormDefaults from "@/src/core/templates/templateFormDefaults";
import TemplateDraftEditor from "@/src/core/templates/templateDraftEditor";
import TemplateDraftSubmission from "@/src/core/templates/templateDraftSubmission";

type DraftKey = "templateInsideDraft" | "templateOutsideDraft" | "createInsideDraft" | "createOutsideDraft";

const EMPTY_LAYOUTS = {
  insideFrame: true,
  outsideFrame: true,
  customerName: false,
  fscLogo: false,
} as const;

const DRAFT_KEYS: Record<TemplateFormTarget, Record<TemplateSection, DraftKey>> = {
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

/**
 * Owns the manage-template page state and its async flows. The draft edits themselves
 * live in TemplateDraftEditor and the clean/validate step in TemplateDraftSubmission.
 */
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

  private draft(target: TemplateFormTarget, section: TemplateSection) {
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

  changeDraftField = (target: TemplateFormTarget, section: TemplateSection, index: number, fieldPatch: Partial<TemplateField>) => {
    const { key, fields } = this.draft(target, section);
    this.patch(key, TemplateDraftEditor.patchField(section, fields, index, fieldPatch));
  };

  addField = (target: TemplateFormTarget, section: TemplateSection, tableOrder?: number, preset: TemplateFieldPreset = "field") => {
    const { key, fields } = this.draft(target, section);
    const nextFields = TemplateDraftEditor.addField(section, fields, tableOrder, preset);
    if (nextFields) this.patch(key, nextFields);
  };

  addTable = (target: TemplateFormTarget, layout: StickerGroupLayout) => {
    const key = this.outsideDraftKey(target);
    this.patch(key, TemplateDraftEditor.addTable(this.state[key], layout));
  };

  renameTable = (target: TemplateFormTarget, tableOrder: number, name: string) => {
    const key = this.outsideDraftKey(target);
    this.patch(key, TemplateDraftEditor.renameTable(this.state[key], tableOrder, name));
  };

  changeTableLayout = (target: TemplateFormTarget, tableOrder: number, layout: StickerGroupLayout) => {
    const key = this.outsideDraftKey(target);
    this.patch(key, TemplateDraftEditor.changeTableLayout(this.state[key], tableOrder, layout));
  };

  removeTable = (target: TemplateFormTarget, tableOrder: number) => {
    const key = this.outsideDraftKey(target);
    this.patch(key, TemplateDraftEditor.removeTable(this.state[key], tableOrder));
  };

  removeField = (target: TemplateFormTarget, section: TemplateSection, index: number) => {
    const { key, fields } = this.draft(target, section);
    this.patch(key, TemplateDraftEditor.removeField(fields, index));
  };

  moveField = (target: TemplateFormTarget, section: TemplateSection, fromIndex: number, toIndex: number, tableOrder?: number) => {
    const { key, fields } = this.draft(target, section);
    this.patch(key, TemplateDraftEditor.moveField(section, fields, fromIndex, toIndex, tableOrder));
  };

  moveTable = (target: TemplateFormTarget, fromOrder: number, toOrder: number) => {
    const key = this.outsideDraftKey(target);
    this.patch(key, TemplateDraftEditor.moveTable(this.state[key], fromOrder, toOrder));
  };

  setPreviewSlot = (target: TemplateFormTarget, section: TemplateSection, slotIndex: number, fieldKey: string) => {
    const { key, fields } = this.draft(target, section);
    this.patch(key, TemplateDraftEditor.assignPreviewSlot(fields, slotIndex, fieldKey));
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

  private cleanDrafts(target: TemplateFormTarget) {
    return {
      inside: TemplateDraftSubmission.cleanFields("inside", this.draft(target, "inside").fields),
      outside: TemplateDraftSubmission.cleanFields("outside", this.draft(target, "outside").fields),
    };
  }

  private validateDrafts(target: TemplateFormTarget, inside: TemplateField[], outside: TemplateField[]) {
    return TemplateDraftSubmission.validate(target, inside, outside, this.state[FORM_KEYS[target].layouts]);
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
