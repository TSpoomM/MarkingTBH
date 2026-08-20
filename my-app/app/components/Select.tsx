import { Component } from "react";
import type { SelectProps } from "@/app/types/ui";

export default class Select extends Component<SelectProps> {
  render() {
    const { label, hint, children, bare = false, required, className = "", ...props } = this.props;
    const control = (
      <div className="app-select-wrap">
        <select required={required} className={`app-control app-select ${className}`.trim()} {...props}>{children}</select>
      </div>
    );
    if (bare || !label) return control;
    return (
      <label className="field">
        <span>{label}{required && <em>*</em>}</span>
        {control}
        <small className="field-hint" aria-hidden={!hint}>{hint || "\u00a0"}</small>
      </label>
    );
  }
}
