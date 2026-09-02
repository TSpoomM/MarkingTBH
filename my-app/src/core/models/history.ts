import type { MarkingHistoryItem } from "@/src/core/models/marking";

export interface TemplateHistoryItem {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  insideFieldCount: number;
  outsideFieldCount: number;
}

export interface HistoryPageState {
  mode: "logs" | "templates";
  items: MarkingHistoryItem[];
  templateItems: TemplateHistoryItem[];
  isLoading: boolean;
  isTemplateLoading: boolean;
  notice: string;
  templateQuery: string;
  employeeQuery: string;
  action: "all" | MarkingHistoryItem["actionType"];
  date: string;
  openId: string | number | null;
}
