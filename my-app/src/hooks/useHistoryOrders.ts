"use client";

import { useEffect, useSyncExternalStore } from "react";
import { historyApiService, HistoryApiService } from "@/src/core/services/history-api.service";
import type { HistoryPageState } from "@/src/core/models/history";

const INITIAL_HISTORY_STATE: HistoryPageState = {
  mode: "logs",
  items: [],
  templateItems: [],
  isLoading: true,
  isTemplateLoading: false,
  notice: "",
  templateQuery: "",
  employeeQuery: "",
  action: "all",
  date: "",
  openId: null,
};

export class HistoryOrdersController {
  private state: HistoryPageState = { ...INITIAL_HISTORY_STATE };
  private listeners = new Set<() => void>();
  private initialized = false;

  constructor(private readonly service: HistoryApiService) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.state;

  private setState(patch: Partial<HistoryPageState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    await this.loadHistory();
  }

  private async loadHistory() {
    this.setState({ isLoading: true });
    try {
      const items = await this.service.getHistory(200);
      this.setState({ items, notice: "" });
    } catch (error) {
      this.setState({ notice: error instanceof Error ? error.message : "โหลด history ไม่สำเร็จ" });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  private async loadTemplateHistory() {
    this.setState({ isTemplateLoading: true });
    try {
      const templateItems = await this.service.getTemplateHistory();
      this.setState({ templateItems, notice: "" });
    } catch (error) {
      this.setState({ notice: error instanceof Error ? error.message : "โหลดประวัติ Template ไม่สำเร็จ" });
    } finally {
      this.setState({ isTemplateLoading: false });
    }
  }

  setMode(mode: HistoryPageState["mode"]) {
    this.setState({ mode, openId: null });
    if (mode === "templates" && !this.state.templateItems.length && !this.state.isTemplateLoading) {
      void this.loadTemplateHistory();
    }
  }

  setTemplateQuery(templateQuery: string) { this.setState({ templateQuery }); }
  setEmployeeQuery(employeeQuery: string) { this.setState({ employeeQuery }); }
  setAction(action: HistoryPageState["action"]) { this.setState({ action }); }
  setDate(date: string) { this.setState({ date }); }

  clearFilters() {
    this.setState({
      templateQuery: "",
      employeeQuery: "",
      action: "all",
      date: "",
      openId: null,
    });
  }

  openDetail(id: string | number) { this.setState({ openId: id }); }
  closeDetail() { this.setState({ openId: null }); }
  dismissNotice() { this.setState({ notice: "" }); }
}

export const historyOrders = new HistoryOrdersController(historyApiService);

export function useHistoryOrders() {
  const state = useSyncExternalStore(
    historyOrders.subscribe,
    historyOrders.getSnapshot,
    historyOrders.getSnapshot,
  );
  useEffect(() => { void historyOrders.initialize(); }, []);
  return { state, actions: historyOrders };
}
