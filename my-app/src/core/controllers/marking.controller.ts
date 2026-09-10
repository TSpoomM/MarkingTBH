import Store from "@/src/core/store/store";
import { INITIAL_MARKING_STATE, MESSAGES } from "@/src/core/models/constants";
import { markingApiService, MarkingApiService } from "@/src/core/services/marking-api.service";
import { sessionApiService, SessionApiService } from "@/src/core/services/session-api.service";
import { printService, PrintService } from "@/src/core/services/print.service";
import StickerFactory from "@/src/core/stickers/stickerFactory";
import StickerDebugReporter from "@/src/core/stickers/stickerDebugReporter";
import type {
  MarkingContent,
  MarkingState,
  PrintSection,
  SaveMarkingPayload,
} from "@/src/core/models/marking";
import type { CounterType, TemplateField } from "@/src/core/models/template";

type Section = "inside" | "outside";

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
    const [isAdmin, templates] = await Promise.allSettled([
      this.session.isAdmin(),
      this.service.getTemplates(),
    ]);
    this.setState({
      isAdmin: isAdmin.status === "fulfilled" && isAdmin.value,
      templates: templates.status === "fulfilled" ? this.sortedTemplates(templates.value) : [],
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
      const template = await this.service.getTemplate(Number(templateId));
      const lotStart = await this.loadLotStart(templateId, productionDate, template.inside);
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
        insideRows: [this.emptyRow(template.inside, lotStart)],
        outsideRows: template.outside.length ? [this.emptyRow(template.outside, lotStart)] : [],
        printOutsideGroups: {},
      });
    } catch (error) {
      this.setState({ notice: { type: "error", text: this.errorMessage(error, MESSAGES.loadFailed) } });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  private digitsOnly(value: string) {
    return value.replace(/\D/g, "");
  }

  setLotCount = (lotCount: string) => this.setState({ lotCount: this.digitsOnly(lotCount) });

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
    const validationError = this.validate();
    if (validationError) {
      this.setState({ notice: { type: "error", text: validationError } });
      return;
    }
    this.setState({ isExportModalOpen: true, notice: null });
  };

  private numericDefault(value: unknown) {
    const number = Number(String(value ?? "").trim());
    return Number.isInteger(number) && number > 0 ? number : 0;
  }

  private templateLotStart(template?: Pick<TemplateField, "key" | "label" | "isCounter" | "counterType" | "defaultValue" | "segments">[] | null) {
    const lotCounter = template?.find((field) =>
      field.isCounter && this.counterType(field, { counterType: field.counterType }) === "lot",
    );
    if (lotCounter) return this.numericDefault(lotCounter.defaultValue) || 1;

    const segmentedLotCounter = template?.find((field) =>
      field.segments?.some((segment) =>
        segment.isCounter && this.counterType(field, segment) === "lot",
      ),
    );
    return this.numericDefault(segmentedLotCounter?.defaultValue) || 1;
  }

  private async loadLotStart(templateId: string, productionDate: string, template?: TemplateField[] | null) {
    const templateLotStart = this.templateLotStart(template);
    try {
      const nextLotStart = await this.service.getNextLotStart(Number(templateId), productionDate);
      return Math.max(nextLotStart, templateLotStart);
    } catch {
      return templateLotStart;
    }
  }

  private async refreshLotStart(templateId: string, productionDate: string) {
    const previousLotStart = this.state.lotStart;
    const lotStart = await this.loadLotStart(templateId, productionDate, this.state.template?.inside);
    this.setState({
      lotStart,
      insideRows: this.withCounterDefaults(this.state.insideRows, this.state.template?.inside ?? [], lotStart, previousLotStart),
      outsideRows: this.withCounterDefaults(this.state.outsideRows, this.state.template?.outside ?? [], lotStart, previousLotStart),
    });
  }

  private buildSavePayload(actionType: SaveMarkingPayload["actionType"] = "save"): SaveMarkingPayload {
    const insideRows = this.withLockedDefaults("inside", this.state.insideRows);
    const outsideRows = this.withLockedDefaults("outside", this.state.outsideRows);
    return {
      templateId: Number(this.state.templateId),
      totalLot: Number(this.state.totalLot || 0),
      stickerSides: Number(this.state.stickerSides || 1),
      lotCount: Number(this.state.lotCount || 1),
      lotStart: this.state.lotStart,
      productionDate: this.state.productionDate,
      actionType,
      contentInside: insideRows.map((row) => ({
        ...row,
        production_date: this.state.productionDate,
        lot_count: this.state.lotCount,
        lot_start: String(this.state.lotStart),
        lot_end: String(this.state.lotStart + Number(this.state.lotCount || 1) - 1),
        ...(this.state.stickerFormat && { sticker_format: this.state.stickerFormat }),
        ...(this.state.stickerType && { sticker_type: this.state.stickerType }),
        ...(this.state.stickerType === "TNR" && { sticker_fsc: this.state.stickerFsc ? "YES" : "NO" }),
        ...(this.state.stickerOther && { sticker_other: this.state.stickerOther }),
      })),
      contentOutside: outsideRows,
      ...(actionType === "print" && { printSections: this.state.printSections }),
    };
  }

  private matchesCondition(field: TemplateField) {
    return StickerFactory.matchesCondition(field, this.state.stickerType, this.state.stickerOther);
  }

  private shouldUppercase(section: Section, key: string) {
    if (section === "inside") return true;
    const fields = this.state.template?.outside ?? [];
    const field = fields.find((item) =>
      item.key === key || item.segments?.some((segment) => segment.key === key),
    );
    return field?.uppercase ?? true;
  }

  private sectionFields(section: Section) {
    return section === "inside" ? this.state.template?.inside : this.state.template?.outside;
  }

  private lockedValue(section: Section, key: string) {
    const field = this.sectionFields(section)?.find((item) => item.key === key);
    if (!field?.locked) return undefined;
    const value = String(field.defaultValue ?? field.label);
    return field.uppercase === false ? value : value.toUpperCase();
  }

  private withLockedDefaults(section: Section, rows: MarkingContent[]) {
    const lockedFields = this.sectionFields(section)?.filter((field) => field.locked && !field.segments?.length) ?? [];
    if (!lockedFields.length) return rows;
    return rows.map((row) => ({
      ...row,
      ...Object.fromEntries(lockedFields.map((field) => [field.key, this.lockedValue(section, field.key) ?? ""])),
    }));
  }

  private isLotCounterKey(section: Section, key: string) {
    return this.sectionFields(section)?.some((field) =>
      field.key === key
        ? field.isCounter && this.counterType(field, { counterType: field.counterType }) === "lot"
        : field.segments?.some((segment) =>
          segment.key === key &&
          segment.isCounter &&
          this.counterType(field, segment) === "lot",
        ),
    ) ?? key.toLowerCase().includes("lot");
  }

  private isCounterKey(section: Section, key: string) {
    return this.sectionFields(section)?.some((field) =>
      field.key === key
        ? field.isCounter
        : field.segments?.some((segment) => segment.key === key && segment.isCounter),
    ) ?? false;
  }

  updateRow = (section: Section, rowIndex: number, key: string, value: string) => {
    const stateKey = section === "inside" ? "insideRows" : "outsideRows";
    const lockedValue = this.lockedValue(section, key);
    const inputValue = this.isCounterKey(section, key) ? this.digitsOnly(value) : value;
    const normalizedValue = lockedValue ?? (this.shouldUppercase(section, key) ? inputValue.toUpperCase() : inputValue);
    const rows = this.state[stateKey].map((row, index) =>
      index === rowIndex ? { ...row, [key]: normalizedValue } : row,
    );
    this.setState({
      [stateKey]: rows,
      ...(this.isLotCounterKey(section, key) && Number.isInteger(Number(normalizedValue)) && Number(normalizedValue) > 0
        ? { lotStart: Number(normalizedValue) }
        : {}),
    });
  };

  private validate(): string {
    const { templateId, template, insideRows, outsideRows } = this.state;
    if (!templateId) return MESSAGES.selectTemplate;
    const stickerFields = template?.sticker.enabledFields ?? [];
    if (!this.state.productionDate) return "กรุณาเลือก Production Date";
    if (!Number.isInteger(Number(this.state.lotCount)) || Number(this.state.lotCount) < 1) return "กรุณากรอกจำนวน Lot";
    if (!this.state.stickerSides) return "กรุณาเลือก Side";
    if (!this.state.stickerFormat) return "กรุณาเลือก Format";
    if ((stickerFields.includes("type") || StickerFactory.needsStickerType(template?.outside ?? [])) && !this.state.stickerType) return "กรุณาเลือกเกรด";
    if ((stickerFields.includes("other") || StickerFactory.needsStickerOther(template?.outside ?? [])) && !this.state.stickerOther) return "กรุณาเลือก Other";
    for (const [index, row] of insideRows.entries()) {
      const missing = template?.inside.find((field) =>
        field.required &&
        this.matchesCondition(field) &&
        (field.segments?.length
          ? field.segments.some((segment) => !segment.isCounter && !row[segment.key]?.trim())
          : !row[field.key]?.trim()),
      );
      if (missing) return `Inside แถว ${index + 1}: กรุณากรอก ${missing.label}`;
    }
    for (const [index, row] of outsideRows.entries()) {
      const missing = template?.outside.find((field) =>
        field.required &&
        this.matchesCondition(field) &&
        !row[field.key]?.trim(),
      );
      if (missing) return `Outside แถว ${index + 1}: กรุณากรอก ${missing.label}`;
    }
    return "";
  }

  async save(actionType: SaveMarkingPayload["actionType"] = "save") {
    const validationError = this.validate();
    if (validationError) {
      this.setState({ notice: { type: "error", text: validationError } });
      return null;
    }
    this.setState({ isSaving: true });
    try {
      const payload = this.buildSavePayload(actionType);
      // StickerDebugReporter.log("save:start", { payload });
      // StickerDebugReporter.logFontMetrics("save:start");
      const result = await this.service.saveMarking(payload);
      // StickerDebugReporter.log("save:done", { payload, result });
      this.setState({
        notice: { type: "success", text: `บันทึกรายการ #${result.id} แล้ว` },
      });
      return result;
    } catch (error) {
      this.setState({ notice: { type: "error", text: this.errorMessage(error, MESSAGES.saveFailed) } });
      return null;
    } finally {
      this.setState({ isSaving: false });
    }
  }

  saveAndExport = async () => {
    if (!Object.values(this.state.printSections).some(Boolean)) {
      this.setState({ notice: { type: "error", text: "กรุณาเลือกสติ๊กเกอร์ที่ต้องการปริ้นอย่างน้อย 1 แบบ" } });
      return;
    }
    const result = await this.save("print");
    if (!result) return;
    this.setState({ isExportModalOpen: false, isPrintSheetActive: true });
    // StickerDebugReporter.log("export:print", {});
    // window.requestAnimationFrame(() => StickerDebugReporter.logFontMetrics("export:print"));
    this.printer.print(() => this.setState({ isPrintSheetActive: false }));
  };

  private errorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }

  private counterType(field: Pick<TemplateField, "key" | "label">, segment?: { counterType?: CounterType }) {
    if (segment?.counterType) return segment.counterType;
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return key.includes("pallet") || label.includes("pallet") ? "pallet" : "lot";
  }

  private counterSeed(type: CounterType, lotStart: number) {
    return type === "lot" ? lotStart || 1 : 1;
  }

  private counterDefault(
    field: Pick<TemplateField, "key" | "label" | "counterPad4">,
    lotStart: number,
    segment?: { counterType?: CounterType; counterPad4?: boolean },
  ) {
    const type = this.counterType(field, segment);
    const value = this.counterSeed(type, lotStart);
    const pad4 = segment?.counterPad4 ?? field.counterPad4 ?? false;
    return pad4 ? String(value).padStart(4, "0") : String(value);
  }

  private fieldDefault(field: TemplateField) {
    const value = String(field.locked ? field.defaultValue ?? field.label : field.defaultValue ?? "");
    return field.uppercase === false ? value : value.toUpperCase();
  }

  private emptyRow(fields: TemplateField[], lotStart = this.state.lotStart): MarkingContent {
    return Object.fromEntries(fields.flatMap((field) =>
      field.segments?.length
        ? field.segments.map((segment) => [segment.key, segment.isCounter ? this.counterDefault(field, lotStart, segment) : ""])
        : [[field.key, field.isCounter ? this.counterDefault(field, lotStart, { counterType: field.counterType, counterPad4: field.counterPad4 }) : this.fieldDefault(field)]],
    ));
  }

  private syncFieldCounterDefault(
    row: MarkingContent,
    field: TemplateField,
    lotStart: number,
    previousLotStart: number,
  ) {
    if (!field.isCounter) return;
    const previousDefault = this.counterDefault(field, previousLotStart, { counterType: field.counterType, counterPad4: field.counterPad4 });
    const previousRawDefault = String(this.counterSeed(this.counterType(field, { counterType: field.counterType }), previousLotStart));
    if (!row[field.key] || row[field.key] === previousDefault || row[field.key] === previousRawDefault) {
      row[field.key] = this.counterDefault(field, lotStart, { counterType: field.counterType, counterPad4: field.counterPad4 });
    }
  }

  private withCounterDefaults(
    rows: MarkingContent[],
    fields: TemplateField[],
    lotStart: number,
    previousLotStart: number,
  ) {
    return rows.map((row) => {
      const nextRow = { ...row };
      fields.forEach((field) => {
        if (!field.segments?.length) {
          this.syncFieldCounterDefault(nextRow, field, lotStart, previousLotStart);
          return;
        }
        field.segments?.forEach((segment) => {
          if (!segment.isCounter) return;
          const previousDefault = this.counterDefault(field, previousLotStart, segment);
          const previousRawDefault = String(this.counterSeed(this.counterType(field, segment), previousLotStart));
          if (!nextRow[segment.key] || nextRow[segment.key] === previousDefault || nextRow[segment.key] === previousRawDefault) {
            nextRow[segment.key] = this.counterDefault(field, lotStart, segment);
          }
        });
      });
      return nextRow;
    });
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }
}

export const markingStore = new MarkingController(markingApiService, sessionApiService, printService);
