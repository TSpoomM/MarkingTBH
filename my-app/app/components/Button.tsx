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
      ...props
    } = this.props;
    return (
      <button type={type} disabled={disabled || loading} {...props}>
        {loading ? loadingText : children}
      </button>
    );
  }
}
