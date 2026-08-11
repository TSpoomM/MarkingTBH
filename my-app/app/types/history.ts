import type { MarkingHistoryItem } from "@/app/types/marking";

export interface HistoryPageState {
  items: MarkingHistoryItem[];
  isLoading: boolean;
  notice: string;
  customerQuery: string;
  employeeQuery: string;
  action: "all" | MarkingHistoryItem["actionType"];
  date: string;
  openId: string | number | null;
}
