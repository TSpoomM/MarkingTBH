import { Component, type ReactNode, type SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  children: ReactNode;
  bare?: boolean;
}

export default class Select extends Component<SelectProps> {
  render() {
    const { label, hint, children, bare = false, required, ...props } = this.props;
    const control = <select required={required} {...props}>{children}</select>;
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
