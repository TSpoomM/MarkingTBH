import { Component } from "react";
import type { ChoiceProps } from "@/app/types/manage-customer";

export default class Choice extends Component<ChoiceProps> {
  render() {
    const { label, description, checked, onChange } = this.props;
    return <label className={`choice ${checked ? "selected" : ""}`}><input type="checkbox" checked={checked} onChange={onChange} /><span><b>{label}</b>{description && <small>{description}</small>}</span></label>;
  }
}
