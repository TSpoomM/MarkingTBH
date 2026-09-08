import Store from "@/src/core/store/store";
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

export class HistoryController extends Store<HistoryPageState> {
  constructor(private readonly service: HistoryApiService) {
    super({ ...INITIAL_HISTORY_STATE });
  }

  protected async load() {
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

  setMode = (mode: HistoryPageState["mode"]) => {
    this.setState({ mode, openId: null });
    if (mode === "templates" && !this.state.templateItems.length && !this.state.isTemplateLoading) {
      void this.loadTemplateHistory();
    }
  };

  setTemplateQuery = (templateQuery: string) => this.setState({ templateQuery });
  setEmployeeQuery = (employeeQuery: string) => this.setState({ employeeQuery });
  setAction = (action: HistoryPageState["action"]) => this.setState({ action });
  setDate = (date: string) => this.setState({ date });

  clearFilters = () => {
    this.setState({
      templateQuery: "",
      employeeQuery: "",
      action: "all",
      date: "",
      openId: null,
    });
  };

  openDetail = (id: string | number) => this.setState({ openId: id });
  closeDetail = () => this.setState({ openId: null });
  dismissNotice = () => this.setState({ notice: "" });
}

export const historyStore = new HistoryController(historyApiService);
