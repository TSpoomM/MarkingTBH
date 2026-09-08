import type { MarkingContent, MarkingHistoryFieldMeta, MarkingHistoryItem } from "@/src/core/models/marking";

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

export interface HistoryNoticeProps {
  notice: string;
  onDismiss: () => void;
}

export interface HistoryModeSwitchProps {
  mode: HistoryPageState["mode"];
  onChangeMode: (mode: HistoryPageState["mode"]) => void;
}

export interface HistoryFilterPanelProps {
  mode: HistoryPageState["mode"];
  templateOptions: string[];
  employeeOptions: string[];
  templateQuery: string;
  employeeQuery: string;
  action: HistoryPageState["action"];
  date: string;
  activeFilterCount: number;
  onTemplateQueryChange: (value: string) => void;
  onEmployeeQueryChange: (value: string) => void;
  onActionChange: (action: HistoryPageState["action"]) => void;
  onDateChange: (date: string) => void;
  onClearFilters: () => void;
}

export interface HistoryPanelHeadingProps {
  title: string;
  subtitle: string;
  visibleCount: number;
  totalCount: number;
}

export interface HistoryLogsPanelProps {
  items: MarkingHistoryItem[];
  totalCount: number;
  isLoading: boolean;
  onOpenDetail: (id: string | number) => void;
}

export interface HistoryTemplatesPanelProps {
  items: TemplateHistoryItem[];
  totalCount: number;
  isLoading: boolean;
}

export interface HistoryDetailModalProps {
  item: MarkingHistoryItem | undefined;
  onClose: () => void;
}

export interface HistoryTemplateSectionProps {
  title: string;
  rows: MarkingContent[];
  fieldMeta?: Record<string, MarkingHistoryFieldMeta>;
}
