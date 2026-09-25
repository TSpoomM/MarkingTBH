import type { MarkingContent } from "@/src/core/models/marking";
import type { TemplateField } from "@/src/core/models/template";

/** A destination value must come from tb_destination; this is the one rule the form, the save check and the server share. */
export default class DestinationRules {
  /** Segmented and date fields are never a destination picker, even when they are labelled "Destination". */
  static isDestinationField(field: Pick<TemplateField, "key" | "label" | "type" | "segments">) {
    if (field.segments?.length || field.type === "date") return false;
    const key = field.key.trim().toLowerCase();
    const label = field.label.trim().toLowerCase();
    return key === "destination" || label === "destination";
  }

  /** The option written the way the list has it (they are stored upper-case), or null when the text is not in the list. */
  static match(options: string[], value: string) {
    const wanted = value.trim().toLowerCase();
    if (!wanted) return null;
    return options.find((option) => option.trim().toLowerCase() === wanted) ?? null;
  }

  /** The first filled-in destination cell whose text is not in the list, as "row N: label"; null when all are fine. */
  static findInvalid(fields: TemplateField[] | undefined, rows: MarkingContent[], options: string[]) {
    const destinationFields = (fields ?? []).filter((field) => this.isDestinationField(field));
    for (const [rowIndex, row] of rows.entries()) {
      for (const field of destinationFields) {
        const value = row[field.key]?.trim();
        if (value && !this.match(options, value)) return { rowNumber: rowIndex + 1, label: field.label, value };
      }
    }
    return null;
  }

  /** The message for a value found by findInvalid, shared by the form and the server. */
  static describe(section: "Inside" | "Outside", invalid: NonNullable<ReturnType<typeof DestinationRules.findInvalid>>) {
    return `${section}: ${invalid.label} "${invalid.value}" ไม่มีในรายการ กรุณาเลือกจากรายการ`;
  }

  /** Copies the rows with each destination written exactly as the list has it, so "moji" is saved as "MOJI". */
  static canonicalRows(fields: TemplateField[] | undefined, rows: MarkingContent[], options: string[]) {
    const destinationFields = (fields ?? []).filter((field) => this.isDestinationField(field));
    if (!destinationFields.length) return rows;
    return rows.map((row) => {
      const next = { ...row };
      destinationFields.forEach((field) => {
        const matched = this.match(options, row[field.key] ?? "");
        if (matched) next[field.key] = matched;
      });
      return next;
    });
  }
}
