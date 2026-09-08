"use client";

import { Component, type ChangeEvent } from "react";
import Autocomplete from "@/src/components/ui/Autocomplete";
import type { Template } from "@/src/core/models/template";
import type { ControlSize } from "@/src/core/ui/fields";

export interface TemplateAutocompleteProps {
  templates: Template[];
  selectedTemplateId: string;
  label?: string;
  hint?: string;
  placeholder: string;
  bare?: boolean;
  size?: ControlSize;
  disabled?: boolean;
  includeInactive?: boolean;
  maxOptions?: number;
  onSelectTemplate: (templateId: string) => void;
}

interface TemplateAutocompleteState {
  query: string;
}

export default class TemplateAutocomplete extends Component<TemplateAutocompleteProps, TemplateAutocompleteState> {
  state: TemplateAutocompleteState = {
    query: this.selectedTemplateLabel(this.props.selectedTemplateId),
  };

  componentDidUpdate(previousProps: TemplateAutocompleteProps) {
    if (
      previousProps.selectedTemplateId !== this.props.selectedTemplateId ||
      previousProps.templates !== this.props.templates
    ) {
      this.setState({ query: this.selectedTemplateLabel(this.props.selectedTemplateId) });
    }
  }

  private templateLabel(template: Template) {
    return template.isActive === false ? `[Inactive] ${template.name}` : template.name;
  }

  private selectableTemplates() {
    return this.props.includeInactive
      ? this.props.templates
      : this.props.templates.filter((template) => template.isActive !== false);
  }

  private selectedTemplateLabel(templateId: string) {
    const template = this.props.templates.find((item) => String(item.id) === templateId);
    return template ? this.templateLabel(template) : "";
  }

  private templateIdForQuery(query: string) {
    const normalized = query.trim().toLowerCase();
    const template = this.selectableTemplates().find((item) =>
      this.templateLabel(item).trim().toLowerCase() === normalized ||
      item.name.trim().toLowerCase() === normalized ||
      String(item.id) === query.trim(),
    );
    return template ? String(template.id) : "";
  }

  private options() {
    return this.selectableTemplates().map((template) => this.templateLabel(template));
  }

  private changeQuery = (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    const templateId = this.templateIdForQuery(query);
    this.setState({ query });
    if (templateId || !query.trim()) {
      this.props.onSelectTemplate(templateId);
    }
  };

  private normalizeQuery = () => {
    window.setTimeout(() => {
      const templateId = this.templateIdForQuery(this.state.query);
      this.setState({
        query: templateId ? this.selectedTemplateLabel(templateId) : this.selectedTemplateLabel(this.props.selectedTemplateId),
      });
    }, 140);
  };

  render() {
    return (
      <Autocomplete
        bare={this.props.bare}
        size={this.props.size}
        disabled={this.props.disabled}
        hint={this.props.hint}
        label={this.props.label}
        maxOptions={this.props.maxOptions ?? 24}
        options={this.options()}
        placeholder={this.props.placeholder}
        value={this.state.query}
        onBlur={this.normalizeQuery}
        onChange={this.changeQuery}
      />
    );
  }
}
