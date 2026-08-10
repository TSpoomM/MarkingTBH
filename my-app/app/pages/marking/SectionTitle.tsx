"use client";

import { Component } from "react";
import type { SectionTitleProps } from "@/app/types/ui";

export default class SectionTitle extends Component<SectionTitleProps> {
  render() {
    const { number, title, subtitle } = this.props;
    return (
      <div className="section-title">
        <div>
          <span>{number}</span>
          <div><h2>{title}</h2><p>{subtitle}</p></div>
        </div>
      </div>
    );
  }
}
