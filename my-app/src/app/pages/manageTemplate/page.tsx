"use client";

import StoreContainer from "@/src/components/StoreContainer";
import { templateManageStore } from "@/src/core/controllers/templateManage.controller";
import TemplateAccessGuard from "@/src/components/manageTemplate/TemplateAccessGuard";
import TemplateModeSwitch from "@/src/components/manageTemplate/TemplateModeSwitch";
import EditTemplateForm from "@/src/components/manageTemplate/EditTemplateForm";
import CreateTemplateForm from "@/src/components/manageTemplate/CreateTemplateForm";
import TemplateDuplicatePrompt from "@/src/components/manageTemplate/TemplateDuplicatePrompt";
import type { TemplateFormState } from "@/src/core/models/manage-template";

const PAGE_MAIN =
  "screen-only mx-auto grid w-full max-w-[1240px] gap-6 overflow-x-clip px-7 pt-7 pb-[130px] " +
  "max-bp700:px-3.5 max-bp700:pt-[18px] max-bp700:pb-[210px] max-bp640:px-2.5 max-bp640:pt-4 max-bp640:pb-[220px]";

/**
 * Composition root for the manage-template page: the only subscriber to the
 * template store. Both forms receive plain props, and the "edit" / "create"
 * target is bound here so the controller keeps one implementation per action.
 */
export default class ManageTemplatePage extends StoreContainer<TemplateFormState> {
  constructor(props: Record<string, never>) {
    super(props, templateManageStore);
  }

  private editForm(state: TemplateFormState) {
    return (
      <EditTemplateForm
        templates={state.templates}
        selectedTemplateId={state.selectedTemplateId}
        name={state.templateName}
        isActive={state.templateIsActive}
        insideDraft={state.templateInsideDraft}
        outsideDraft={state.templateOutsideDraft}
        stickerLayouts={state.templateStickerLayouts}
        stickerDefaults={state.templateStickerDefaults}
        notice={state.templateNotice}
        loadingTemplates={state.loadingTemplates}
        loadingTemplate={state.loadingTemplate}
        savingTemplate={state.savingTemplate}
        onDismissNotice={() => templateManageStore.dismissNotice("edit")}
        onSelectTemplate={(templateId) => void templateManageStore.selectTemplate(templateId)}
        onNameChange={(name) => templateManageStore.changeName("edit", name)}
        onActiveChange={(isActive) => templateManageStore.setIsActive("edit", isActive)}
        onSave={() => void templateManageStore.saveExistingTemplate()}
        onCancel={() => void templateManageStore.cancelTemplateEdit()}
        onStickerDefaultsChange={(defaults) => templateManageStore.changeStickerDefaults("edit", defaults)}
        onSelectPreviewSlot={(section, slotIndex, fieldKey) => templateManageStore.setPreviewSlot("edit", section, slotIndex, fieldKey)}
        onChangeField={(section, index, patch) => templateManageStore.changeDraftField("edit", section, index, patch)}
        onAddField={(section, tableOrder) => templateManageStore.addField("edit", section, tableOrder)}
        onRemoveField={(section, index) => templateManageStore.removeField("edit", section, index)}
        onMoveField={(section, fromIndex, toIndex, tableOrder) => templateManageStore.moveField("edit", section, fromIndex, toIndex, tableOrder)}
        onAddTable={(layout) => templateManageStore.addTable("edit", layout)}
        onRenameTable={(tableOrder, name) => templateManageStore.renameTable("edit", tableOrder, name)}
        onChangeTableLayout={(tableOrder, layout) => templateManageStore.changeTableLayout("edit", tableOrder, layout)}
        onRemoveTable={(tableOrder) => templateManageStore.removeTable("edit", tableOrder)}
        onMoveTable={(fromOrder, toOrder) => templateManageStore.moveTable("edit", fromOrder, toOrder)}
      />
    );
  }

  private createForm(state: TemplateFormState) {
    return (
      <CreateTemplateForm
        templates={state.templates}
        name={state.name}
        isActive={state.isActive}
        duplicateSourceTemplateId={state.duplicateSourceTemplateId}
        stickerLayouts={state.stickerLayouts}
        stickerDefaults={state.stickerDefaults}
        insideDraft={state.createInsideDraft}
        outsideDraft={state.createOutsideDraft}
        notice={state.notice}
        loadingTemplates={state.loadingTemplates}
        duplicatingTemplate={state.duplicatingTemplate}
        saving={state.saving}
        onDismissNotice={() => templateManageStore.dismissNotice("create")}
        onSubmit={() => void templateManageStore.submitCreate()}
        onNameChange={(name) => templateManageStore.changeName("create", name)}
        onActiveChange={(isActive) => templateManageStore.setIsActive("create", isActive)}
        onDuplicateSourceChange={(templateId) => void templateManageStore.duplicateTemplateToCreateDraft(templateId)}
        onStickerDefaultsChange={(defaults) => templateManageStore.changeStickerDefaults("create", defaults)}
        onSelectPreviewSlot={(section, slotIndex, fieldKey) => templateManageStore.setPreviewSlot("create", section, slotIndex, fieldKey)}
        onChangeField={(section, index, patch) => templateManageStore.changeDraftField("create", section, index, patch)}
        onAddField={(section, tableOrder) => templateManageStore.addField("create", section, tableOrder)}
        onRemoveField={(section, index) => templateManageStore.removeField("create", section, index)}
        onMoveField={(section, fromIndex, toIndex, tableOrder) => templateManageStore.moveField("create", section, fromIndex, toIndex, tableOrder)}
        onAddTable={(layout) => templateManageStore.addTable("create", layout)}
        onRenameTable={(tableOrder, name) => templateManageStore.renameTable("create", tableOrder, name)}
        onChangeTableLayout={(tableOrder, layout) => templateManageStore.changeTableLayout("create", tableOrder, layout)}
        onRemoveTable={(tableOrder) => templateManageStore.removeTable("create", tableOrder)}
        onMoveTable={(fromOrder, toOrder) => templateManageStore.moveTable("create", fromOrder, toOrder)}
      />
    );
  }

  render() {
    const state = this.state;
    const canManage = !state.checkingRole && state.isAdmin;

    return (
      <div className="min-h-screen bg-[#eef3f1]">
        <main className={PAGE_MAIN}>
          <TemplateAccessGuard checkingRole={state.checkingRole} isAdmin={state.isAdmin} />
          {canManage && <TemplateModeSwitch mode={state.mode} onChangeMode={templateManageStore.changeMode} />}
          {canManage && state.mode === "edit" && this.editForm(state)}
          {canManage && state.mode === "create" && this.createForm(state)}
        </main>
        <TemplateDuplicatePrompt
          duplicateName={state.duplicateNamePrompt?.name}
          saving={state.saving}
          onDismiss={templateManageStore.dismissDuplicatePrompt}
          onReplace={() => void templateManageStore.replaceDuplicateTemplate()}
        />
      </div>
    );
  }
}
