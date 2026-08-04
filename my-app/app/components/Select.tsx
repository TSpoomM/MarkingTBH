import { Component } from "react";
import type { SelectProps } from "@/app/types/ui";

export default class Select extends Component<SelectProps> {
  render() {
    const { label, hint, children, bare = false, required, className = "", ...props } = this.props;
    const control = <select required={required} className={`app-control ${className}`.trim()} {...props}>{children}</select>;
    if (bare || !label) return control;
    return (
      <label className="field">
        <span>{label}{required && <em>*</em>}</span>
        {control}
        {hint && <small>{hint}</small>}
      </label>
    );
  }
}
