import type { MarkingHistoryItem } from "@/app/types/marking";

export interface HistoryPageState {
  items: MarkingHistoryItem[];
  isLoading: boolean;
  notice: string;
  query: string;
  action: "all" | MarkingHistoryItem["actionType"];
  date: string;
  openId: string | number | null;
}
