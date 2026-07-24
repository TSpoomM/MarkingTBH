import { Component, type HTMLAttributes, type ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export default class Card extends Component<CardProps> {
  render() {
    const { children, className = "", ...props } = this.props;
    return <section className={`panel ${className}`.trim()} {...props}>{children}</section>;
  }
}
