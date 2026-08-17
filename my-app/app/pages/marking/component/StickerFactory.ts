import type { MarkingContent } from "@/app/types/marking";
import { STICKER_FORMAT_PALLETS } from "@/app/types/constants";
import { TemplateField } from "@/app/types/customer";
import type { CounterType } from "@/app/types/customer";
import type {
  OutsideStickerGroup,
  StickerBuildOptions,
  StickerItem,
  StickerKind,
} from "@/app/types/marking-sticker";

export default class StickerFactory {
  static readonly DEFAULT_COUNTER_DIGITS = 4;

  static chunk<T>(items: T[], size: number) {
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
      items.slice(index * size, index * size + size),
    );
  }

  static previewCounterValue(field: TemplateField, lotStart: number) {
    const value = this.counterValue(field, lotStart || 1, 1);
    return this.counterType(field) === "lot" ? value.padStart(this.DEFAULT_COUNTER_DIGITS, "0") : value;
  }

  static matchesCondition(field: TemplateField, stickerType: string, stickerOther: string) {
    return (
      (!field.condition?.stickerType || (!!stickerType && field.condition.stickerType === stickerType)) &&
      (!field.condition?.stickerOther || (!!stickerOther && field.condition.stickerOther === stickerOther))
    );
  }

  static needsStickerType(fields: TemplateField[]) {
    return fields.some((field) => !!field.condition?.stickerType);
  }

  static needsStickerOther(fields: TemplateField[]) {
    return fields.some((field) => !!field.condition?.stickerOther);
  }

  static outsideGroupTitle(name: string) {
    const boxMatch = name.match(/^box\s*(\d+)$/i);
    return boxMatch ? `นอกกรอบ ${boxMatch[1]}` : name;
  }

  private static counterType(field: TemplateField, segment?: { counterType?: CounterType }) {
    if (segment?.counterType) return segment.counterType;
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return key.includes("pallet") || label.includes("pallet") ? "pallet" : "lot";
  }

  private static counterValue(field: TemplateField, lot: number, pallet: number, segment?: { counterType?: CounterType }) {
    return this.counterType(field, segment) === "pallet" ? String(pallet) : String(lot);
  }

  private static counterDisplayValue(
    field: TemplateField,
    row: MarkingContent | undefined,
    lot: number,
    pallet: number,
    segment: { key: string; counterType?: CounterType },
  ) {
    const value = this.counterValue(field, lot, pallet, segment);
    if (this.counterType(field, segment) !== "lot") return value;
    const seed = row?.[segment.key];
    const digits = seed && /^\d+$/.test(seed) ? Math.max(seed.length, this.DEFAULT_COUNTER_DIGITS) : this.DEFAULT_COUNTER_DIGITS;
    return value.padStart(digits, "0");
  }

  private static fieldValue(field: TemplateField, value: string | undefined) {
    if (!value) return "";
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    const needsKg = key === "gross" || key === "nett" || label === "gross" || label === "nett";
    return needsKg && !/\bkg\.?$/i.test(value.trim()) ? `${value} KG` : value;
  }

  private static formatSegmentValues(
    format: string | undefined,
    segments: Array<{ key: string; label: string; value: string; prefix?: string; suffix?: string }>,
  ) {
    const trimmedFormat = format?.trim();
    if (!trimmedFormat) {
      const hasAffixes = segments.some((segment) => segment.prefix || segment.suffix);
      if (!hasAffixes) return segments.map(({ label, value }) => ({ label, value }));
      const rendered = segments.map((segment) => `${segment.prefix ?? ""}${segment.value}${segment.suffix ?? ""}`).join("");
      return rendered.trim()
        ? [{ value: rendered }]
        : [];
    }

    const rendered = segments.reduce((text, segment, index) => (
      text
        .replaceAll(`{${index + 1}}`, segment.value)
        .replaceAll(`{${segment.key}}`, segment.value)
        .replaceAll(`{${segment.label}}`, segment.value)
    ), trimmedFormat).replace(/\{[^}]+\}/g, "");

    return rendered.trim()
      ? [{ value: rendered }]
      : [];
  }

  private static fieldValues(
    fields: TemplateField[],
    row: MarkingContent | undefined,
    lot: number,
    pallet: number,
  ) {
    return fields.flatMap((field) => {
      if (field.segments?.length) {
        const selectedSegments = field.segments
          .filter((segment) => segment.showOnSticker !== false)
          .sort((a, b) => (a.stickerOrder ?? 0) - (b.stickerOrder ?? 0));
        const values = selectedSegments.flatMap((segment) => {
          const value = segment.isCounter
            ? this.counterDisplayValue(field, row, lot, pallet, segment)
            : row?.[segment.key];
          return value
            ? [{ key: segment.key, label: segment.label, value, prefix: segment.prefix, suffix: segment.suffix }]
            : [];
        });
        const renderedValues = this.formatSegmentValues(field.displayFormat, values);
        return values.length
          ? [{ label: field.label, values: renderedValues, order: field.stickerOrder ?? Math.min(...selectedSegments.map((segment) => segment.stickerOrder ?? 0)), fontScale: field.fontScale, hideLabel: field.hideLabel }]
          : [];
      }
      if (field.showOnSticker === false) return [];
      const value = this.fieldValue(field, row?.[field.key]);
      return value ? [{ label: field.label, values: [{ value }], order: field.stickerOrder ?? 0, fontScale: field.fontScale, hideLabel: field.hideLabel }] : [];
    })
      .sort((a, b) => a.order - b.order)
      .map(({ label, values, order, fontScale, hideLabel }) => ({ label, values, order, fontScale, hideLabel }));
  }

  private static splitOutsideLabel(label: string) {
    const delimiter = label.includes(" — ") ? " — " : label.includes(" â€” ") ? " â€” " : "";
    if (!delimiter) return { groupName: "", fieldLabel: label };
    const [groupName, ...fieldLabelParts] = label.split(delimiter);
    return {
      groupName: groupName.trim(),
      fieldLabel: (fieldLabelParts.join(delimiter).trim() || label),
    };
  }

  static outsideGroups(fields: TemplateField[]) {
    const groups = new Map<string, OutsideStickerGroup>();
    fields.forEach((field, index) => {
      const inferred = this.splitOutsideLabel(field.label);
      const name = field.stickerGroup?.trim() || inferred.groupName || "นอกกรอบ";
      const order = field.stickerGroupOrder ?? index;
      const groupKey = field.stickerGroupOrder === undefined ? name : `${order}:${name}`;
      const group = groups.get(groupKey) ?? { name, order, fields: [] };
      group.order = Math.min(group.order, field.stickerGroupOrder ?? index);
      group.fields.push({
        ...field,
        label: inferred.groupName ? inferred.fieldLabel : field.label,
      });
      groups.set(groupKey, group);
    });
    return Array.from(groups.values()).sort((a, b) => a.order - b.order);
  }

  static build(options: StickerBuildOptions) {
    const {
      customerName, format, sideCount, lotCount, lotStart, productionDate, stickerType, stickerFsc,
      insideFields, outsideFields, insideRow, outsideRow,
    } = options;
    const palletsByLot = STICKER_FORMAT_PALLETS[format as keyof typeof STICKER_FORMAT_PALLETS];
    if (!palletsByLot || sideCount <= 0 || lotCount <= 0) return [];
    const effectiveLayouts = {
      insideFrame: true,
      outsideFrame: outsideFields.length > 0,
      customerName: !!customerName.trim(),
      fscLogo: stickerType === "TNR" && stickerFsc,
    };
    const items: StickerItem[] = [];

    const buildLayoutItems = (
      kind: StickerKind,
      detailsForSticker: (lot: number, pallet: number) => StickerItem["details"],
      group?: string,
    ) => {
      const generated: StickerItem[] = [];
      Array.from({ length: lotCount }, (_, lotIndex) => {
        const palletCount = palletsByLot[lotIndex % palletsByLot.length];
        for (let pallet = 1; pallet <= palletCount; pallet += 1) {
          for (let side = 1; side <= sideCount; side += 1) {
            generated.push({
              kind,
              customerName,
              lot: lotStart + lotIndex,
              pallet,
              side,
              productionDate,
              stickerType,
              details: detailsForSticker(lotStart + lotIndex, pallet),
              group,
            });
          }
        }
      });
      return generated;
    };

    const addLayoutItems = (
      kind: StickerKind,
      detailsForSticker: (lot: number, pallet: number) => StickerItem["details"],
      group?: string,
    ) => {
      items.push(...buildLayoutItems(kind, detailsForSticker, group));
    };

    if (effectiveLayouts.insideFrame) {
      addLayoutItems("insideFrame", (lot, pallet) => this.fieldValues(insideFields, insideRow, lot, pallet));
    }
    if (effectiveLayouts.outsideFrame) {
      this.outsideGroups(outsideFields).forEach((group) => {
        addLayoutItems("outsideFrame", (lot, pallet) => this.fieldValues(group.fields, outsideRow, lot, pallet), group.name);
      });
    }
    if (effectiveLayouts.customerName) addLayoutItems("customerName", () => []);
    if (effectiveLayouts.fscLogo) {
      this.chunk(buildLayoutItems("fscLogo", () => []), 3).forEach((group) => {
        items.push({ ...group[0], logoCount: group.length });
      });
    }

    return items;
  }
}
