"use client";

import { Component } from "react";
import Toast from "@/src/components/ui/Toast";
import type { HistoryNoticeProps } from "@/src/core/models/history";

export default class HistoryNotice extends Component<HistoryNoticeProps> {
  render() {
    const { notice, onDismiss } = this.props;
    if (!notice) return null;
    return <Toast type="error" message={notice} onClose={onDismiss} />;
  }
}
