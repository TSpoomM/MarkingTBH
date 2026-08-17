import { Component } from "react";
import type { SectionHeadingProps } from "@/app/types/manage-customer";

export default class SectionHeading extends Component<SectionHeadingProps> {
  render() {
    const { number, title, subtitle } = this.props;
    return <div className="config-heading"><span>{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div>;
  }
}
