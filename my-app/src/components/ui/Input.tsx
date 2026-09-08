import { Component } from "react";
import Field from "./Field";
import cn from "@/src/core/ui/cn";
import { control } from "@/src/core/ui/fields";
import type { InputProps } from "@/src/core/models/ui";

export default class Input extends Component<InputProps> {
  render() {
    const { label, hint, bare = false, required, size = "md", className = "", ...props } = this.props;
    const isCheckbox = props.type === "checkbox";
    const el = (
      <input
        required={required}
        className={cn(!isCheckbox && control(size), className)}
        {...props}
      />
    );
    if (bare) return el;
    return <Field label={label} hint={hint} required={required} size={size}>{el}</Field>;
  }
}
