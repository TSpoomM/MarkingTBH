"use client";

import { Component } from "react";
import { historyOrders, HistoryOrdersController } from "@/src/hooks/useHistoryOrders";
import type { HistoryPageState } from "@/src/core/models/history";

export default abstract class HistoryComponent<
  Props = Record<string, never>,
> extends Component<Props, HistoryPageState> {
  protected readonly actions: HistoryOrdersController = historyOrders;
  private unsubscribe?: () => void;

  constructor(props: Props) {
    super(props);
    this.state = historyOrders.getSnapshot();
  }

  componentDidMount() {
    this.unsubscribe = historyOrders.subscribe(() => {
      this.setState(historyOrders.getSnapshot());
    });
    void historyOrders.initialize();
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }
}
