import { Component } from "react";
import type { SectionHeadingProps } from "@/src/core/models/manage-template";
import { CONFIG_HEADING } from "@/src/core/ui/template";

export default class SectionHeading extends Component<SectionHeadingProps> {
  render() {
    const { number, title, subtitle } = this.props;
    return (
      <div className={CONFIG_HEADING}>
        <span>{number}</span>
        <div><h2>{title}</h2><p>{subtitle}</p></div>
      </div>
    );
  }
}
