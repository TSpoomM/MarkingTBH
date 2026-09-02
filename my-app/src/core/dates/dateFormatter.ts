import type { DateFormat } from "@/src/core/models/template";

export const DATE_FORMAT_OPTIONS: Array<{ value: DateFormat; label: string }> = [
  { value: "yyyy-mm-dd", label: "ปี-เดือน-วัน (2026-09-02)" },
  { value: "dd/mm/yyyy", label: "วัน/เดือน/ปี (02/09/2026)" },
  { value: "mm/dd/yyyy", label: "เดือน/วัน/ปี (09/02/2026)" },
  { value: "dd-mm-yyyy", label: "วัน-เดือน-ปี (02-09-2026)" },
  { value: "mm-dd-yyyy", label: "เดือน-วัน-ปี (09-02-2026)" },
];

export default class DateFormatter {
  static defaultFormat(): DateFormat {
    return "yyyy-mm-dd";
  }

  static formatDateInputValue(value: string, format: DateFormat | undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const [year, month, day] = value.split("-");
    switch (format ?? this.defaultFormat()) {
      case "dd/mm/yyyy":
        return `${day}/${month}/${year}`;
      case "mm/dd/yyyy":
        return `${month}/${day}/${year}`;
      case "dd-mm-yyyy":
        return `${day}-${month}-${year}`;
      case "mm-dd-yyyy":
        return `${month}-${day}-${year}`;
      case "yyyy-mm-dd":
      default:
        return value;
    }
  }

  static toDateInputValue(value: string | undefined, format: DateFormat | undefined) {
    const text = (value ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

    const slashMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashMatch) {
      const [, first, second, year] = slashMatch;
      return (format ?? this.defaultFormat()) === "mm/dd/yyyy"
        ? `${year}-${first}-${second}`
        : `${year}-${second}-${first}`;
    }

    const dashMatch = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dashMatch) {
      const [, first, second, year] = dashMatch;
      return (format ?? this.defaultFormat()) === "mm-dd-yyyy"
        ? `${year}-${first}-${second}`
        : `${year}-${second}-${first}`;
    }

    return "";
  }
}
