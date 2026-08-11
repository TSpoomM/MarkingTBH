import { Component } from "react";
import type { AutocompleteProps } from "@/app/types/ui";

let instanceCount = 0;

export default class Autocomplete extends Component<AutocompleteProps> {
  private listId = `autocomplete-options-${++instanceCount}`;

  render() {
    const { label, hint, options, bare = false, required, className = "", ...props } = this.props;
    const control = (
      <>
        <input required={required} className={`app-control ${className}`.trim()} list={this.listId} {...props} />
        <datalist id={this.listId}>
          {options.map((option) => <option key={option} value={option} />)}
        </datalist>
      </>
    );
    if (bare || !label) return control;
    return (
      <label className="field">
        <span>{label}{required && <em>*</em>}</span>
        {control}
        <small className="field-hint" aria-hidden={!hint}>{hint || " "}</small>
      </label>
    );
  }
}
