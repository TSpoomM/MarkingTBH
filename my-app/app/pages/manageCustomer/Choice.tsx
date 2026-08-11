import { Component } from "react";
import type { ChoiceProps } from "@/app/types/manage-customer";
import Input from "@/app/components/Input";

export default class Choice extends Component<ChoiceProps> {
  render() {
    const { label, description, checked, onChange } = this.props;
    return <label className={`choice ${checked ? "selected" : ""}`}><Input type="checkbox" checked={checked} onChange={onChange} /><span><b>{label}</b>{description && <small>{description}</small>}</span></label>;
  }
}
