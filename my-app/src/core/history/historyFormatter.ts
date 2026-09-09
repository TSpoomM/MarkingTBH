import type { MarkingContent, MarkingHistoryFieldMeta, MarkingHistoryItem } from "@/src/core/models/marking";
import type { HistoryPageState, TemplateHistoryItem } from "@/src/core/models/history";
import { PREVIEW_MODE_LABELS, PREVIEW_MODE_ORDER } from "@/src/core/stickers/stickerPreview";

export default class HistoryFormatter {
  static filteredItems(
    items: MarkingHistoryItem[],
    templateQuery: string,
    employeeQuery: string,
    action: "all" | MarkingHistoryItem["actionType"],
    date: string,
  ) {
    const normalizedTemplate = templateQuery.trim().toLowerCase();
    const normalizedEmployee = employeeQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesAction = action === "all" || item.actionType === action;
      const matchesDate = !date || item.productionDate === date || item.createdDate.startsWith(date);
      const matchesTemplate = !normalizedTemplate || (item.customerName || "").toLowerCase().includes(normalizedTemplate);
      const matchesEmployee = !normalizedEmployee || (item.employeeName || "").toLowerCase().includes(normalizedEmployee);
      return matchesAction && matchesDate && matchesTemplate && matchesEmployee;
    });
  }

  static filteredTemplateItems(templateItems: TemplateHistoryItem[], templateQuery: string, date: string) {
    const normalizedTemplate = templateQuery.trim().toLowerCase();
    return templateItems.filter((item) => {
      const matchesTemplate = !normalizedTemplate || item.name.toLowerCase().includes(normalizedTemplate);
      const matchesDate = !date || item.createdAt.startsWith(date) || item.updatedAt.startsWith(date);
      return matchesTemplate && matchesDate;
    });
  }

  /** How many filters are currently narrowing the list - drives the "clear" button. */
  static activeFilterCount(state: HistoryPageState) {
    const isTemplateMode = state.mode === "templates";
    return [
      state.templateQuery,
      isTemplateMode ? "" : state.employeeQuery,
      !isTemplateMode && state.action !== "all" ? state.action : "",
      state.date,
    ].filter(Boolean).length;
  }

  static uniqueValues(items: MarkingHistoryItem[], pick: (item: MarkingHistoryItem) => string) {
    return Array.from(new Set(items.map(pick).filter(Boolean))).sort((a, b) => a.localeCompare(b, "th"));
  }

  static uniqueTemplateValues(templateItems: TemplateHistoryItem[]) {
    return Array.from(new Set(templateItems.map((item) => item.name).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "th"),
    );
  }

  static formatDateTime(value: string) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  static actionLabel(actionType: MarkingHistoryItem["actionType"]) {
    if (actionType === "print") return "พิมพ์/PDF";
    if (actionType === "save") return "บันทึก";
    return "ข้อมูลเก่า";
  }

  /** Which sticker sections were ticked when this record was printed - "-" for a plain save
   * or for records saved before print_sections started being recorded. */
  static printedSections(row: MarkingHistoryItem) {
    if (row.actionType !== "print" || !row.printSections) return "-";
    const labels = PREVIEW_MODE_ORDER
      .filter((section) => row.printSections?.[section])
      .map((section) => PREVIEW_MODE_LABELS[section]);
    return labels.length ? labels.join(", ") : "-";
  }

  private static isStickerDetailKey(key: string) {
    return new Set([
      "action_type",
      "production_date",
      "lot_start",
      "lot_end",
      "lot_count",
      "sticker_format",
      "sticker_type",
      "sticker_fsc",
      "sticker_other",
      "total_lot",
      "sticker_sides",
    ]).has(key);
  }

  private static legacyCombinedSectionEntry(key: string, row: MarkingContent) {
    const match = key.match(/^(lotNo|palletNo)_(\d+)$/i);
    if (!match) return undefined;
    const prefix = match[1];
    const label = prefix.toLowerCase() === "palletno" ? "PALLET NO." : "LOT NO.";
    const values = Object.entries(row)
      .filter(([itemKey, value]) => (
        new RegExp(`^${prefix}_\\d+$`, "i").test(itemKey) &&
        String(value ?? "").trim() !== ""
      ))
      .sort(([left], [right]) => {
        const leftIndex = Number(left.split("_").pop() ?? 0);
        const rightIndex = Number(right.split("_").pop() ?? 0);
        return leftIndex - rightIndex;
      })
      .map(([, value]) => String(value).trim());
    return values.length ? [label, values.join(" ")] as const : undefined;
  }

  private static segmentGroupKey(key: string) {
    const legacyMatch = key.match(/^(lotNo|palletNo)_\d+$/i);
    if (legacyMatch) return legacyMatch[1];
    const generatedMatch = key.match(/^(.+)_\d{10,}_[a-z0-9]{6}$/i);
    if (generatedMatch) return generatedMatch[1];
    const match = key.match(/^(.+)_(?:section_\d+|\d+)$/i);
    return match?.[1];
  }

  private static segmentGroupLabel(groupKey: string, keys: string[]) {
    const legacyLabel = this.legacyCombinedSectionEntry(keys[0], Object.fromEntries(keys.map((key) => [key, key])))?.[0];
    return legacyLabel ?? groupKey;
  }

  private static entryGroupKey(
    key: string,
    filledKeys: string[],
    fieldMeta: Record<string, MarkingHistoryFieldMeta>,
  ) {
    if (fieldMeta[key]) return fieldMeta[key].parentKey;
    const generatedGroupKey = this.segmentGroupKey(key);
    if (generatedGroupKey) return generatedGroupKey;
    return filledKeys.some((itemKey) => this.segmentGroupKey(itemKey) === key) ? key : undefined;
  }

  private static entryLabel(
    key: string,
    groupKey: string | undefined,
    groupKeys: string[],
    fieldMeta: Record<string, MarkingHistoryFieldMeta>,
  ) {
    if (groupKey) {
      const meta = fieldMeta[groupKey] ?? groupKeys.map((itemKey) => fieldMeta[itemKey]).find(Boolean);
      return meta?.parentLabel ?? this.segmentGroupLabel(groupKey, groupKeys);
    }
    return fieldMeta[key]?.label ?? key;
  }

  /** Splits outside-frame rows back into their per-table groups (mirrors StickerFactory.outsideGroups()
   * on the live print path), so a template with multiple outside tables doesn't collapse into one. */
  static outsideGroups(rows: MarkingContent[], fieldMeta: Record<string, MarkingHistoryFieldMeta> = {}) {
    const groupOrders = new Map<string, number>();
    Object.values(fieldMeta).forEach((meta) => {
      if (meta.group && !groupOrders.has(meta.group)) groupOrders.set(meta.group, meta.groupOrder ?? 0);
    });
    if (groupOrders.size === 0) return [{ name: undefined as string | undefined, rows }];

    const orderedNames = Array.from(groupOrders.entries())
      .sort(([, left], [, right]) => left - right)
      .map(([name]) => name);

    return orderedNames.map((name) => ({
      name,
      rows: rows.map((row) => {
        const filtered: MarkingContent = {};
        Object.entries(row).forEach(([key, value]) => {
          const keyGroup = fieldMeta[key]?.group ?? orderedNames[0];
          if (keyGroup === name) filtered[key] = value;
        });
        return filtered;
      }),
    }));
  }

  static filledEntries(row: MarkingContent, fieldMeta: Record<string, MarkingHistoryFieldMeta> = {}) {
    const filled = Object.entries(row).filter(([key, value]) =>
      !this.isStickerDetailKey(key) && String(value ?? "").trim() !== "",
    );
    const filledKeys = filled.map(([key]) => key);
    const groupCounts = filled.reduce<Record<string, number>>((counts, [key]) => {
      const groupKey = this.entryGroupKey(key, filledKeys, fieldMeta);
      if (!groupKey) return counts;
      return { ...counts, [groupKey]: (counts[groupKey] ?? 0) + 1 };
    }, {});
    const usedGroupKeys = new Set<string>();

    return filled
      .flatMap(([key, value]) => {
        const groupKey = this.entryGroupKey(key, filledKeys, fieldMeta);
        const meta = fieldMeta[key];
        if (!groupKey || (groupCounts[groupKey] < 2 && (!meta || meta.parentKey === key))) {
          return [{ id: key, label: this.entryLabel(key, undefined, [], fieldMeta), value }];
        }
        if (usedGroupKeys.has(groupKey)) return [];
        usedGroupKeys.add(groupKey);
        const groupKeys = filled
          .map(([itemKey]) => itemKey)
          .filter((itemKey) => this.entryGroupKey(itemKey, filledKeys, fieldMeta) === groupKey)
          .sort((left, right) => (fieldMeta[left]?.order ?? 0) - (fieldMeta[right]?.order ?? 0));
        const values = groupKeys.map((itemKey) => String(row[itemKey]).trim()).filter(Boolean);
        return [{ id: groupKey, label: this.entryLabel(key, groupKey, groupKeys, fieldMeta), value: values.join(" ") }];
      })
      .slice(0, 24);
  }
}
