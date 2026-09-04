"use client";

import Toast from "@/src/components/ui/Toast";
import HistoryComponent from "./HistoryComponent";

export default class HistoryNotice extends HistoryComponent {
  render() {
    if (!this.state.notice) return null;
    return <Toast type="error" message={this.state.notice} onClose={() => this.actions.dismissNotice()} />;
  }
}
