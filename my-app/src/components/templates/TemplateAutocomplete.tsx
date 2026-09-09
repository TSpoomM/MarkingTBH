"use client";

import { Component, type ChangeEvent } from "react";
import Autocomplete from "@/src/components/ui/Autocomplete";
import TemplateOptions from "@/src/core/templates/templateOptions";
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

/** Keeps the typed text in sync with the selected template id. */
export default class TemplateAutocomplete extends Component<TemplateAutocompleteProps, TemplateAutocompleteState> {
  private readonly normalizeDelayMs = 140;

  state: TemplateAutocompleteState = {
    query: TemplateOptions.labelFor(this.props.templates, this.props.selectedTemplateId),
  };

  componentDidUpdate(previousProps: TemplateAutocompleteProps) {
    if (
      previousProps.selectedTemplateId !== this.props.selectedTemplateId ||
      previousProps.templates !== this.props.templates
    ) {
      this.setState({ query: TemplateOptions.labelFor(this.props.templates, this.props.selectedTemplateId) });
    }
  }

  private idForQuery(query: string) {
    return TemplateOptions.idForQuery(this.props.templates, query, this.props.includeInactive);
  }

  private changeQuery = (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    const templateId = this.idForQuery(query);
    this.setState({ query });
    if (templateId || !query.trim()) {
      this.props.onSelectTemplate(templateId);
    }
  };

  /** Runs after the option list has had a chance to commit its own selection. */
  private normalizeQuery = () => {
    window.setTimeout(() => {
      const templateId = this.idForQuery(this.state.query) || this.props.selectedTemplateId;
      this.setState({ query: TemplateOptions.labelFor(this.props.templates, templateId) });
    }, this.normalizeDelayMs);
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
        options={TemplateOptions.options(this.props.templates, this.props.includeInactive)}
        placeholder={this.props.placeholder}
        value={this.state.query}
        onBlur={this.normalizeQuery}
        onChange={this.changeQuery}
      />
    );
  }
}
