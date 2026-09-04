"use client";

import EditTemplateForm from "./EditTemplateForm";
import TemplateManageComponent from "./TemplateManageComponent";

export default class TemplateEditPanel extends TemplateManageComponent {
  render() {
    if (this.state.checkingRole || !this.state.isAdmin || this.state.mode !== "edit") return null;
    return (
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
        onDismissNotice={this.actions.dismissTemplateNotice}
        onSelectTemplate={(templateId) => void this.actions.selectTemplate(templateId)}
        onNameChange={this.actions.changeTemplateName}
        onActiveChange={this.actions.setTemplateIsActive}
        onSave={() => void this.actions.saveExistingTemplate()}
        onCancel={() => void this.actions.cancelTemplateEdit()}
        onStickerDefaultsChange={this.actions.changeTemplateStickerDefaults}
        onSelectPreviewSlot={this.actions.setPreviewSlot}
        onChangeField={this.actions.changeTemplateDraft}
        onAddField={this.actions.addTemplateField}
        onRemoveField={this.actions.removeTemplateField}
        onMoveField={this.actions.moveTemplateField}
        onAddTable={this.actions.addTemplateTable}
        onRenameTable={this.actions.renameTemplateTable}
        onChangeTableLayout={this.actions.changeTemplateTableLayout}
        onRemoveTable={this.actions.removeTemplateTable}
        onMoveTable={this.actions.moveTemplateTable}
      />
    );
  }
}
