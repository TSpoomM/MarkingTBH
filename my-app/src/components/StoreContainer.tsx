"use client";

import { Component } from "react";
import type Store from "@/src/core/store/store";

/**
 * Page-level bridge between a controller store and the React tree.
 * It is the only place that subscribes: everything below a container
 * receives plain props, so views stay presentational and reusable.
 */
export default abstract class StoreContainer<S, P = Record<string, never>> extends Component<P, S> {
  private unsubscribe?: () => void;

  protected constructor(props: P, protected readonly store: Store<S>) {
    super(props);
    this.state = store.getSnapshot();
  }

  componentDidMount() {
    this.unsubscribe = this.store.subscribe(() => this.setState(this.store.getSnapshot()));
    void this.store.initialize();
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }
}
