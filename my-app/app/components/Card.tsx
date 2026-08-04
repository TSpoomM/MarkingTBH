import { Component } from "react";
import type { CardProps } from "@/app/types/ui";

export default class Card extends Component<CardProps> {
  render() {
    const { children, className = "", ...props } = this.props;
    return <section className={`panel ${className}`.trim()} {...props}>{children}</section>;
  }
}
