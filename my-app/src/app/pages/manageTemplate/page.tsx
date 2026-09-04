"use client";

import { Component } from "react";
import TemplateAccessGuard from "@/src/components/manageTemplate/TemplateAccessGuard";
import TemplateModeSwitch from "@/src/components/manageTemplate/TemplateModeSwitch";
import TemplateEditPanel from "@/src/components/manageTemplate/TemplateEditPanel";
import TemplateCreatePanel from "@/src/components/manageTemplate/TemplateCreatePanel";
import TemplateDuplicatePrompt from "@/src/components/manageTemplate/TemplateDuplicatePrompt";

export default class ManageTemplatePage extends Component {
  render() {
    return (
      <div className="template-admin">
        <main className="template-form-wrap">
          <TemplateAccessGuard />
          <TemplateModeSwitch />
          <TemplateEditPanel />
          <TemplateCreatePanel />
        </main>
        <TemplateDuplicatePrompt />
      </div>
    );
  }
}
