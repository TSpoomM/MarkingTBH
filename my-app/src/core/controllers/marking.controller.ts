import Store from "@/src/core/store/store";
import { INITIAL_MARKING_STATE, MESSAGES } from "@/src/core/models/constants";
import { markingApiService, MarkingApiService } from "@/src/core/services/client/marking-api.service";
import { ApiError } from "@/src/core/services/client/http.service";
import { sessionApiService, SessionApiService } from "@/src/core/services/client/session-api.service";
import { printService, PrintService } from "@/src/core/services/client/print.service";
import MarkingRows from "@/src/core/marking/markingRows";
import MarkingSubmission from "@/src/core/marking/markingSubmission";
import type {
  MarkingState,
  PrintSection,
  SaveMarkingPayload,
} from "@/src/core/models/marking";
import type { TemplateField } from "@/src/core/models/template";

type Section = "inside" | "outside";

/**
 * Owns the marking page state and its async flows. Row defaults and input rules live in
 * MarkingRows, and validating and building the save request in MarkingSubmission.
 */
export class MarkingController extends Store<MarkingState> {
  constructor(
    private readonly service: MarkingApiService,
    private readonly session: SessionApiService,
    private readonly printer: PrintService,
  ) {
    super({ ...INITIAL_MARKING_STATE });
  }

  private sortedTemplates(templates: MarkingState["templates"]) {
    return templates
      .sort((first, second) =>
        Number(second.isActive) - Number(first.isActive) ||
        first.name.localeCompare(second.name),
      );
  }

  protected async load() {
    const [isAdmin, templates, destinations] = await Promise.allSettled([
      this.session.isAdmin(),
      this.service.getTemplates(),
      this.service.getDestinations(),
    ]);
    this.setState({
      isAdmin: isAdmin.status === "fulfilled" && isAdmin.value,
      templates: templates.status === "fulfilled" ? this.sortedTemplates(templates.value) : [],
      destinationOptions: destinations.status === "fulfilled" ? destinations.value : [],
      isLoading: false,
      notice:
        templates.status === "rejected"
          ? { type: "error", text: this.errorMessage(templates.reason, MESSAGES.loadFailed) }
          : null,
    });
  }

  selectTemplate = async (templateId: string) => {
    const selectedTemplate = this.state.templates.find((template) => String(template.id) === templateId);
    if (selectedTemplate?.isActive === false) {
      this.setState({ notice: { type: "error", text: "Template นี้ Inactive อยู่" } });
      return;
    }
    this.setState({ templateId, notice: null });
    if (!templateId) {
      this.setState({ template: null, insideRows: [], outsideRows: [] });
      return;
    }
    this.setState({ isLoading: true });
    try {
      const productionDate = this.state.productionDate || this.today();
      const [template, nextLotStart] = await Promise.all([
        this.service.getTemplate(Number(templateId)),
        this.fetchNextLotStart(templateId, productionDate),
      ]);
      const lotStart = Math.max(nextLotStart, MarkingRows.templateLotStart(template.inside));
      const stickerDefaults = template.sticker.defaults;
      this.setState({
        template,
        stickerSides: String(stickerDefaults.sideCount),
        stickerFormat: stickerDefaults.format,
        stickerType: stickerDefaults.stickerType,
        stickerFsc: stickerDefaults.stickerFsc,
        stickerOther: stickerDefaults.stickerOther,
        lotCount: "1",
        lotStart,
        productionDate,
        insideRows: [MarkingRows.emptyRow(template.inside, lotStart)],
        outsideRows: template.outside.length ? [MarkingRows.emptyRow(template.outside, lotStart)] : [],
        printOutsideGroups: {},
      });
    } catch (error) {
      this.setState({ notice: { type: "error", text: this.errorMessage(error, MESSAGES.loadFailed) } });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  setLotCount = (lotCount: string) => this.setState({ lotCount: MarkingRows.digitsOnly(lotCount) });

  setProductionDate = (productionDate: string) => {
    this.setState({ productionDate });
    if (this.state.templateId && productionDate) {
      void this.refreshLotStart(this.state.templateId, productionDate);
    }
  };

  dismissNotice = () => this.setState({ notice: null });
  closeExportModal = () => this.setState({ isExportModalOpen: false });

  setPrintSection = (section: PrintSection, enabled: boolean) => {
    this.setState({
      printSections: { ...this.state.printSections, [section]: enabled },
    });
  };

  setPrintOutsideGroup = (groupKey: string, enabled: boolean) => {
    this.setState({
      printOutsideGroups: { ...this.state.printOutsideGroups, [groupKey]: enabled },
    });
  };

  openExportModal = () => {
    const validationError = MarkingSubmission.validate(this.state);
    if (validationError) {
      this.setState({ notice: { type: "error", text: validationError } });
      return;
    }
    this.setState({ isExportModalOpen: true, notice: null });
  };

  /** Falls back to 0 when the lookup fails, so the template's own lot start wins. */
  private async fetchNextLotStart(templateId: string, productionDate: string) {
    try {
      return await this.service.getNextLotStart(Number(templateId), productionDate);
    } catch {
      return 0;
    }
  }

  private async loadLotStart(templateId: string, productionDate: string, template?: TemplateField[] | null) {
    const nextLotStart = await this.fetchNextLotStart(templateId, productionDate);
    return Math.max(nextLotStart, MarkingRows.templateLotStart(template));
  }

  private async refreshLotStart(templateId: string, productionDate: string) {
    const previousLotStart = this.state.lotStart;
    const lotStart = await this.loadLotStart(templateId, productionDate, this.state.template?.inside);
    this.setState({
      lotStart,
      insideRows: MarkingRows.withCounterDefaults(this.state.insideRows, this.state.template?.inside ?? [], lotStart, previousLotStart),
      outsideRows: MarkingRows.withCounterDefaults(this.state.outsideRows, this.state.template?.outside ?? [], lotStart, previousLotStart),
    });
  }

  private sectionFields(section: Section) {
    return section === "inside" ? this.state.template?.inside : this.state.template?.outside;
  }

  updateRow = (section: Section, rowIndex: number, key: string, value: string) => {
    const stateKey = section === "inside" ? "insideRows" : "outsideRows";
    const fields = this.sectionFields(section);
    const normalizedValue = MarkingRows.normalizeInput(fields, key, value);
    const rows = this.state[stateKey].map((row, index) =>
      index === rowIndex ? { ...row, [key]: normalizedValue } : row,
    );
    this.setState({
      [stateKey]: rows,
      ...(MarkingRows.isLotCounterKey(fields, key) && Number.isInteger(Number(normalizedValue)) && Number(normalizedValue) > 0
        ? { lotStart: Number(normalizedValue) }
        : {}),
    });
  };

  async save(actionType: SaveMarkingPayload["actionType"] = "save", allowLotOverlap = false) {
    const validationError = MarkingSubmission.validate(this.state);
    if (validationError) {
      this.setState({ notice: { type: "error", text: validationError } });
      return null;
    }
    this.setState({ isSaving: true });
    try {
      const payload = {
        ...MarkingSubmission.buildPayload(this.state, actionType),
        ...(allowLotOverlap && { allowLotOverlap: true }),
      };
      const result = await this.service.saveMarking(payload);
      this.setState({
        notice: { type: "success", text: `บันทึกรายการ #${result.id} แล้ว` },
      });
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.body.code === "LOT_OVERLAP") {
        // Repeating a lot can be intentional, so ask instead of failing.
        this.setState({
          isExportModalOpen: false,
          lotOverlap: { message: error.message },
        });
        return null;
      }
      this.setState({ notice: { type: "error", text: this.errorMessage(error, MESSAGES.saveFailed) } });
      return null;
    } finally {
      this.setState({ isSaving: false });
    }
  }

  saveAndExport = async (allowLotOverlap = false) => {
    if (!Object.values(this.state.printSections).some(Boolean)) {
      this.setState({ notice: { type: "error", text: "กรุณาเลือกสติ๊กเกอร์ที่ต้องการปริ้นอย่างน้อย 1 แบบ" } });
      return;
    }
    const result = await this.save("print", allowLotOverlap);
    if (!result) return;
    this.setState({ isExportModalOpen: false, isPrintSheetActive: true });
    this.printer.print(() => this.setState({ isPrintSheetActive: false }));
  };

  /** The user says the repeated lot is intended, so save and print it as it is. */
  confirmLotOverlap = async () => {
    this.setState({ lotOverlap: null });
    await this.saveAndExport(true);
  };

  /** Dismisses the warning so the user can correct the lot number. */
  closeLotOverlap = () => this.setState({ lotOverlap: null });

  private errorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }
}

export const markingStore = new MarkingController(markingApiService, sessionApiService, printService);
