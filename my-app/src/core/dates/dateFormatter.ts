import type { DateFormat, DatePart, DateSeparator } from "@/src/core/models/template";

export const DATE_PART_OPTIONS: Array<{ value: DatePart; label: string }> = [
  { value: "dd", label: "วัน" },
  { value: "mm", label: "เดือนตัวเลข" },
  { value: "mmm", label: "เดือนย่อ ENG" },
  { value: "yyyy", label: "ปี" },
];

export const DATE_SEPARATOR_OPTIONS: Array<{ value: DateSeparator; label: string }> = [
  { value: "-", label: "- ขีดกลาง" },
  { value: "/", label: "/ สแลช" },
  { value: ".", label: ". จุด" },
];

export const MONTH_ABBREVIATIONS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

interface DateFormatConfig {
  parts: [DatePart, DatePart, DatePart];
  separator: DateSeparator;
}

export default class DateFormatter {
  static defaultFormat(): DateFormat {
    return "yyyy-mm-dd";
  }

  static buildFormat(parts: [DatePart, DatePart, DatePart], separator: DateSeparator): DateFormat {
    return parts.join(separator);
  }

  static normalizeFormat(format: DateFormat | undefined): DateFormat {
    return this.buildFormat(this.parseFormat(format).parts, this.parseFormat(format).separator);
  }

  static parseFormat(format: DateFormat | undefined): DateFormatConfig {
    const rawFormat = (format ?? this.defaultFormat()).trim().toLowerCase();
    const separator = this.findSeparator(rawFormat);
    const parts = rawFormat.split(separator).filter(Boolean);
    if (parts.length !== 3 || !this.hasValidParts(parts)) {
      return { parts: ["yyyy", "mm", "dd"], separator: "-" };
    }
    return { parts: parts as [DatePart, DatePart, DatePart], separator };
  }

  static ensureUniquePart(parts: [DatePart, DatePart, DatePart], index: number, nextPart: DatePart): [DatePart, DatePart, DatePart] {
    const nextParts: [DatePart, DatePart, DatePart] = [...parts];
    const oldPart = nextParts[index];
    const monthParts = new Set<DatePart>(["mm", "mmm"]);
    const samePartIndex = nextParts.findIndex((part, partIndex) => {
      if (partIndex === index) return false;
      if (monthParts.has(part) && monthParts.has(nextPart)) return true;
      return part === nextPart;
    });
    nextParts[index] = nextPart;
    if (samePartIndex >= 0) nextParts[samePartIndex] = oldPart;
    return nextParts;
  }

  static formatDateInputValue(value: string, format: DateFormat | undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const [year, month, day] = value.split("-");
    const values: Record<DatePart, string> = {
      dd: day,
      mm: month,
      mmm: MONTH_ABBREVIATIONS[Number(month) - 1] ?? month,
      yyyy: year,
    };
    const config = this.parseFormat(format);
    return config.parts.map((part) => values[part]).join(config.separator);
  }

  static toDateInputValue(value: string | undefined, format: DateFormat | undefined) {
    const text = (value ?? "").trim().toUpperCase();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

    const formattedValue = this.parseByFormat(text, format);
    if (formattedValue) return formattedValue;

    return this.parseCommonDate(text);
  }

  private static parseByFormat(value: string, format: DateFormat | undefined) {
    const config = this.parseFormat(format);
    const separator = this.escapeRegExp(config.separator);
    const groups = config.parts.map((part) => {
      if (part === "yyyy") return "(\\d{4})";
      if (part === "mmm") return "([A-Z]{3})";
      return "(\\d{2})";
    });
    const match = value.match(new RegExp(`^${groups.join(separator)}$`));
    if (!match) return "";

    const values: Partial<Record<DatePart, string>> = {};
    config.parts.forEach((part, index) => {
      values[part] = match[index + 1];
    });
    const month = values.mm ?? this.monthNumber(values.mmm ?? "");
    return values.yyyy && month && values.dd ? `${values.yyyy}-${month}-${values.dd}` : "";
  }

  private static parseCommonDate(value: string) {
    const textMonthPatterns: Array<{ pattern: RegExp; order: [DatePart, DatePart, DatePart] }> = [
      { pattern: /^(\d{4})[-/.]([A-Z]{3})[-/.](\d{2})$/, order: ["yyyy", "mmm", "dd"] },
      { pattern: /^(\d{2})[-/.]([A-Z]{3})[-/.](\d{4})$/, order: ["dd", "mmm", "yyyy"] },
      { pattern: /^([A-Z]{3})[-/.](\d{2})[-/.](\d{4})$/, order: ["mmm", "dd", "yyyy"] },
    ];
    for (const item of textMonthPatterns) {
      const match = value.match(item.pattern);
      if (!match) continue;
      const values = this.valuesFromMatch(item.order, match);
      const month = this.monthNumber(values.mmm ?? "");
      return values.yyyy && month && values.dd ? `${values.yyyy}-${month}-${values.dd}` : "";
    }

    const numericMatch = value.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
    if (!numericMatch) return "";
    const [, first, second, year] = numericMatch;
    return `${year}-${second}-${first}`;
  }

  private static valuesFromMatch(order: [DatePart, DatePart, DatePart], match: RegExpMatchArray) {
    return order.reduce<Partial<Record<DatePart, string>>>((values, part, index) => ({
      ...values,
      [part]: match[index + 1],
    }), {});
  }

  private static monthNumber(monthName: string) {
    const index = MONTH_ABBREVIATIONS.indexOf(monthName);
    return index >= 0 ? String(index + 1).padStart(2, "0") : "";
  }

  private static findSeparator(format: string): DateSeparator {
    if (format.includes("/")) return "/";
    if (format.includes(".")) return ".";
    return "-";
  }

  private static hasValidParts(parts: string[]): parts is DatePart[] {
    const dateParts = new Set(parts);
    const hasDay = dateParts.has("dd");
    const hasYear = dateParts.has("yyyy");
    const monthCount = parts.filter((part) => part === "mm" || part === "mmm").length;
    return hasDay && hasYear && monthCount === 1 && dateParts.size === 3;
  }

  private static escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
