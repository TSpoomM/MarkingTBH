import type { MarkingContent } from "@/src/core/models/marking";
import type { CounterType, TemplateField } from "@/src/core/models/template";

type Fields = TemplateField[] | null | undefined;
type CounterOverrides = { counterType?: CounterType; counterPad4?: boolean };

/**
 * Pure rules for the rows a user fills in on the marking page: what a fresh row holds,
 * how counter defaults follow the lot start, and how typed values are normalized.
 * MarkingController used to carry all of this as private methods.
 */
export default class MarkingRows {
  static digitsOnly(value: string) {
    return value.replace(/\D/g, "");
  }

  private static numericDefault(value: unknown) {
    const number = Number(String(value ?? "").trim());
    return Number.isInteger(number) && number > 0 ? number : 0;
  }

  private static counterType(field: Pick<TemplateField, "key" | "label">, segment?: { counterType?: CounterType }) {
    if (segment?.counterType) return segment.counterType;
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return key.includes("pallet") || label.includes("pallet") ? "pallet" : "lot";
  }

  private static counterSeed(type: CounterType, lotStart: number) {
    return type === "lot" ? lotStart || 1 : 1;
  }

  private static counterDefault(
    field: Pick<TemplateField, "key" | "label" | "counterPad4" | "defaultValue">,
    lotStart: number,
    segment?: CounterOverrides,
  ) {
    const type = this.counterType(field, segment);
    const value = this.counterSeed(type, lotStart);
    const pad4 = segment?.counterPad4 ?? field.counterPad4 ?? false;
    const defaultValue = String(field.defaultValue ?? "").trim();
    const defaultWidth = /^\d+$/.test(defaultValue) ? defaultValue.length : 0;
    const width = Math.max(pad4 ? 4 : 0, defaultWidth);
    return width ? String(value).padStart(width, "0") : String(value);
  }

  private static fieldDefault(field: TemplateField) {
    const value = String(field.locked ? field.defaultValue ?? field.label : field.defaultValue ?? "");
    return field.type === "date" || field.uppercase === false ? value : value.toUpperCase();
  }

  /** First lot number the template asks for: its lot counter's default value, or 1. */
  static templateLotStart(template?: Pick<TemplateField, "key" | "label" | "isCounter" | "counterType" | "defaultValue" | "segments">[] | null) {
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

  static emptyRow(fields: TemplateField[], lotStart: number): MarkingContent {
    return Object.fromEntries(fields.flatMap((field) =>
      field.segments?.length
        ? field.segments.map((segment) => [segment.key, segment.isCounter ? this.counterDefault(field, lotStart, segment) : ""])
        : [[field.key, field.isCounter ? this.counterDefault(field, lotStart, { counterType: field.counterType, counterPad4: field.counterPad4 }) : this.fieldDefault(field)]],
    ));
  }

  /** Moves counter cells still holding the old default onto the new lot start; edited cells are left alone. */
  static withCounterDefaults(
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

  private static syncFieldCounterDefault(
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

  private static findField(fields: Fields, key: string) {
    return fields?.find((item) =>
      item.key === key || item.segments?.some((segment) => segment.key === key),
    );
  }

  private static isDateKey(fields: Fields, key: string) {
    const field = this.findField(fields, key);
    if (!field) return false;
    if (field.key === key) return field.type === "date";
    return field.segments?.some((segment) => segment.key === key && segment.type === "date") ?? false;
  }

  private static shouldUppercase(fields: Fields, key: string) {
    if (this.isDateKey(fields, key)) return false;
    const field = this.findField(fields, key);
    return field?.uppercase ?? true;
  }

  /** The fixed text of a locked field, or undefined when the field can be edited. */
  static lockedValue(fields: Fields, key: string) {
    const field = fields?.find((item) => item.key === key);
    if (!field?.locked) return undefined;
    const value = String(field.defaultValue ?? field.label);
    return field.type === "date" || field.uppercase === false ? value : value.toUpperCase();
  }

  static withLockedDefaults(fields: Fields, rows: MarkingContent[]) {
    const lockedFields = fields?.filter((field) => field.locked && !field.segments?.length) ?? [];
    if (!lockedFields.length) return rows;
    return rows.map((row) => ({
      ...row,
      ...Object.fromEntries(lockedFields.map((field) => [field.key, this.lockedValue(fields, field.key) ?? ""])),
    }));
  }

  static isLotCounterKey(fields: Fields, key: string) {
    return fields?.some((field) =>
      field.key === key
        ? field.isCounter && this.counterType(field, { counterType: field.counterType }) === "lot"
        : field.segments?.some((segment) =>
          segment.key === key &&
          segment.isCounter &&
          this.counterType(field, segment) === "lot",
        ),
    ) ?? key.toLowerCase().includes("lot");
  }

  private static isCounterKey(fields: Fields, key: string) {
    return fields?.some((field) =>
      field.key === key
        ? field.isCounter
        : field.segments?.some((segment) => segment.key === key && segment.isCounter),
    ) ?? false;
  }

  /** What a cell should hold after the user typed `value`: locked text, digits for counters, upper-case unless opted out. */
  static normalizeInput(fields: Fields, key: string, value: string) {
    const lockedValue = this.lockedValue(fields, key);
    const inputValue = this.isCounterKey(fields, key) ? this.digitsOnly(value) : value;
    return lockedValue ?? (this.shouldUppercase(fields, key) ? inputValue.toUpperCase() : inputValue);
  }
}
