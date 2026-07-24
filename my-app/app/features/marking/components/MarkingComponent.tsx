"use client";

import { Component } from "react";
import { markingOrders, MarkingOrdersController } from "../hooks/useMarkingOrders";
import type { MarkingState } from "../types";

export default abstract class MarkingComponent<
  Props = Record<string, never>,
> extends Component<Props, MarkingState> {
  protected readonly actions: MarkingOrdersController = markingOrders;
  private unsubscribe?: () => void;

  constructor(props: Props) {
    super(props);
    this.state = markingOrders.getSnapshot();
  }

  componentDidMount() {
    this.unsubscribe = markingOrders.subscribe(() => {
      this.setState(markingOrders.getSnapshot());
    });
    void markingOrders.initialize();
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }
}
