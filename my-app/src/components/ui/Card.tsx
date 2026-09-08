import { Component } from "react";
import cn from "@/src/core/ui/cn";
import { PANEL } from "@/src/core/ui/surfaces";
import type { CardProps } from "@/src/core/models/ui";

export default class Card extends Component<CardProps> {
  render() {
    const { children, className = "", ...props } = this.props;
    return <section className={cn(PANEL, className)} {...props}>{children}</section>;
  }
}
