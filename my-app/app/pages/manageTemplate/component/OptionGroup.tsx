import { Component } from "react";
import type { OptionGroupProps } from "@/app/types/manage-template";

export default class OptionGroup extends Component<OptionGroupProps> {
  render() {
    const { label, hint, children } = this.props;
    return <div className="option-group"><div><strong>{label}</strong>{hint && <small>{hint}</small>}</div><div className="choice-list">{children}</div></div>;
  }
}
