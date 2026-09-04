"use client";

import { Component } from "react";
import HistoryNotice from "@/src/components/history/HistoryNotice";
import HistoryModeSwitch from "@/src/components/history/HistoryModeSwitch";
import HistoryOverview from "@/src/components/history/HistoryOverview";
import HistoryFilterPanel from "@/src/components/history/HistoryFilterPanel";
import HistoryLogsPanel from "@/src/components/history/HistoryLogsPanel";
import HistoryTemplatesPanel from "@/src/components/history/HistoryTemplatesPanel";
import HistoryDetailModal from "@/src/components/history/HistoryDetailModal";

export default class HistoryPage extends Component {
  render() {
    return (
      <>
        <main className="history-wrap">
          <HistoryNotice />
          <HistoryModeSwitch />
          <HistoryOverview />
          <HistoryFilterPanel />
          <HistoryLogsPanel />
          <HistoryTemplatesPanel />
        </main>
        <HistoryDetailModal />
      </>
    );
  }
}
