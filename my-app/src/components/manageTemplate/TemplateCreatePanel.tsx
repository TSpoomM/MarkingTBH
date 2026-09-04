"use client";

import CreateTemplateForm from "./CreateTemplateForm";
import TemplateManageComponent from "./TemplateManageComponent";
import { fixedInsideFields } from "@/src/core/models/manage-template";

export default class TemplateCreatePanel extends TemplateManageComponent {
  render() {
    if (this.state.checkingRole || !this.state.isAdmin || this.state.mode !== "create") return null;
    return (
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
        onDismissNotice={this.actions.dismissNotice}
        onSubmit={this.actions.submit}
        onNameChange={this.actions.changeCreateName}
        onActiveChange={this.actions.changeCreateIsActive}
        onDuplicateSourceChange={(templateId) => void this.actions.duplicateTemplateToCreateDraft(templateId)}
        onStickerDefaultsChange={this.actions.changeStickerDefaults}
        onSegmentCountChange={this.actions.changeSegmentCount}
        onGroupSegmentChange={this.actions.updateGroupSegment}
        onTablesChange={this.actions.updateTables}
        onTableUpdate={this.actions.updateTable}
        onSelectPreviewSlot={this.actions.setCreatePreviewSlot}
        onChangeField={this.actions.changeCreateTemplateDraft}
        onAddField={this.actions.addCreateTemplateField}
        onRemoveField={this.actions.removeCreateTemplateField}
        onMoveField={this.actions.moveCreateTemplateField}
        onAddTable={this.actions.addCreateTemplateTable}
        onRenameTable={this.actions.renameCreateTemplateTable}
        onChangeTableLayout={this.actions.changeCreateTemplateTableLayout}
        onRemoveTable={this.actions.removeCreateTemplateTable}
        onMoveTable={this.actions.moveCreateTemplateTable}
      />
    );
  }
}
