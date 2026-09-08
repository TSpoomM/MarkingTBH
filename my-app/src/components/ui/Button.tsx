import { Component } from "react";
import cn from "@/src/core/ui/cn";
import { BUTTON_BASE, BUTTON_SIZES, BUTTON_VARIANTS } from "@/src/core/ui/variants";
import type { ButtonProps } from "@/src/core/models/ui";

export default class Button extends Component<ButtonProps> {
  render() {
    const {
      children,
      loading = false,
      loadingText = "กำลังดำเนินการ...",
      wrapContent = true,
      disabled,
      type = "button",
      variant = "secondary",
      size,
      className = "",
      ...props
    } = this.props;
    const sizing = size ? BUTTON_SIZES[size] : variant === "primary" ? BUTTON_SIZES.lg : BUTTON_SIZES.md;
    return (
      <button
        type={type}
        disabled={disabled || loading}
        className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], sizing, className)}
        {...props}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="size-3.5 animate-spin rounded-full border-2 border-current/35 border-t-current"
          />
        )}
        {wrapContent ? (
          <span className="inline-flex min-w-0 items-center justify-center gap-2 leading-none">
            {loading ? loadingText : children}
          </span>
        ) : loading ? loadingText : children}
      </button>
    );
  }
}
