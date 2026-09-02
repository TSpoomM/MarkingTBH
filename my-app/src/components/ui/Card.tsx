import { Component } from "react";
import type { CardProps } from "@/src/core/models/ui";

export default class Card extends Component<CardProps> {
  render() {
    const { children, className = "", ...props } = this.props;
    return <section className={`panel ${className}`.trim()} {...props}>{children}</section>;
  }
}
