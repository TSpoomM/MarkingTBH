import { Component, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  bare?: boolean;
}

export default class Input extends Component<InputProps> {
  render() {
    const { label, hint, bare = false, required, className = "", ...props } = this.props;
    const control = <input required={required} className={`app-control ${className}`.trim()} {...props} />;
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
