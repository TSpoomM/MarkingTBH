import { Component, type ReactNode } from "react";
import cn from "@/src/core/ui/cn";
import {
  FIELD, FIELD_HINT, FIELD_HINT_LG, FIELD_LABEL, FIELD_LABEL_LG, FIELD_LG, FIELD_REQUIRED,
  type ControlSize,
} from "@/src/core/ui/fields";

interface FieldProps {
  label?: string;
  hint?: string;
  required?: boolean;
  size?: ControlSize;
  children: ReactNode;
}

/**
 * Wraps label + control + hint into one unit
 * Previously Input / Select / Autocomplete / CalendarInput each wrote this markup themselves
 */
export default class Field extends Component<FieldProps> {
  render() {
    const { label, hint, required, size = "md", children } = this.props;
    if (!label) return <>{children}</>;
    const lg = size === "lg";
    return (
      <label className={cn(lg ? FIELD_LG : FIELD)}>
        <span className={lg ? FIELD_LABEL_LG : FIELD_LABEL}>
          {label}
          {required && <em className={FIELD_REQUIRED}>*</em>}
        </span>
        {children}
        <small className={lg ? FIELD_HINT_LG : FIELD_HINT} aria-hidden={!hint}>{hint || "\u00a0"}</small>
      </label>
    );
  }
}
