import { Component, type ButtonHTMLAttributes, type ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
}

export default class Button extends Component<ButtonProps> {
  render() {
    const {
      children,
      loading = false,
      loadingText = "กำลังดำเนินการ...",
      disabled,
      type = "button",
      className = "",
      ...props
    } = this.props;
    return (
      <button
        type={type}
        disabled={disabled || loading}
        className={`app-button ${loading ? "is-loading" : ""} ${className}`.trim()}
        {...props}
      >
        {loading && <span className="button-spinner" aria-hidden="true" />}
        <span>{loading ? loadingText : children}</span>
      </button>
    );
  }
}
