"use client";

import StoreContainer from "@/src/components/StoreContainer";
import { historyStore } from "@/src/core/controllers/history.controller";
import HistoryFormatter from "@/src/core/history/historyFormatter";
import { HISTORY_WRAP } from "@/src/core/ui/history";
import Toast from "@/src/components/ui/Toast";
import HistoryModeSwitch from "@/src/components/history/HistoryModeSwitch";
import HistoryFilterPanel from "@/src/components/history/HistoryFilterPanel";
import HistoryLogsPanel from "@/src/components/history/HistoryLogsPanel";
import HistoryTemplatesPanel from "@/src/components/history/HistoryTemplatesPanel";
import HistoryDetailModal from "@/src/components/history/HistoryDetailModal";
import type { HistoryPageState } from "@/src/core/models/history";

/**
 * Composition root for the history page: the only subscriber to the history store.
 * Every panel below is presentational and driven purely by the props handed down here.
 */
export default class HistoryPage extends StoreContainer<HistoryPageState> {
  constructor(props: Record<string, never>) {
    super(props, historyStore);
  }

  render() {
    const state = this.state;
    const isTemplateMode = state.mode === "templates";
    const filteredItems = HistoryFormatter.filteredItems(
      state.items, state.templateQuery, state.employeeQuery, state.action, state.date,
    );
    const filteredTemplateItems = HistoryFormatter.filteredTemplateItems(
      state.templateItems, state.templateQuery, state.date,
    );
    const openItem = state.openId
      ? state.items.find((entry) => entry.id === state.openId)
      : undefined;

    return (
      <>
        <main className={HISTORY_WRAP}>
          {state.notice && <Toast type="error" message={state.notice} onClose={historyStore.dismissNotice} />}
          <HistoryModeSwitch mode={state.mode} onChangeMode={historyStore.setMode} />
          <HistoryFilterPanel
            mode={state.mode}
            templateOptions={isTemplateMode
              ? HistoryFormatter.uniqueTemplateValues(state.templateItems)
              : HistoryFormatter.uniqueValues(state.items, (item) => item.customerName)}
            employeeOptions={HistoryFormatter.uniqueValues(state.items, (item) => item.employeeName)}
            templateQuery={state.templateQuery}
            employeeQuery={state.employeeQuery}
            action={state.action}
            date={state.date}
            activeFilterCount={HistoryFormatter.activeFilterCount(state)}
            onTemplateQueryChange={historyStore.setTemplateQuery}
            onEmployeeQueryChange={historyStore.setEmployeeQuery}
            onActionChange={historyStore.setAction}
            onDateChange={historyStore.setDate}
            onClearFilters={historyStore.clearFilters}
          />
          {!isTemplateMode && (
            <HistoryLogsPanel
              items={filteredItems}
              totalCount={state.items.length}
              isLoading={state.isLoading}
              onOpenDetail={historyStore.openDetail}
            />
          )}
          {isTemplateMode && (
            <HistoryTemplatesPanel
              items={filteredTemplateItems}
              totalCount={state.templateItems.length}
              isLoading={state.isTemplateLoading}
            />
          )}
        </main>
        <HistoryDetailModal item={openItem} onClose={historyStore.closeDetail} />
      </>
    );
  }
}
