import type { MarkingContent } from "@/src/core/models/marking";
import { STICKER_FORMAT_PALLETS } from "@/src/core/models/constants";
import type { CounterType, LegacyStickerGroupLayout, StickerGroupLayout, TemplateField } from "@/src/core/models/template";
import type {
  OutsideStickerGroup,
  StickerBuildOptions,
  StickerItem,
  StickerKind,
} from "@/src/core/models/marking-sticker";

export default class StickerFactory {
  static normalizeGroupLayout(layout?: LegacyStickerGroupLayout): StickerGroupLayout {
    return layout === "8x2" || layout === "4x2" ? "8x2" : "2x2";
  }

  static isVerticalGroupLayout(layout?: LegacyStickerGroupLayout) {
    return this.normalizeGroupLayout(layout) === "8x2";
  }

  static chunk<T>(items: T[], size: number) {
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
      items.slice(index * size, index * size + size),
    );
  }

  static previewCounterValue(field: TemplateField, lotStart: number, segment?: { counterType?: CounterType; counterPad4?: boolean }) {
    const value = this.counterValue(field, lotStart || 1, 1, 1, lotStart || 1, segment);
    return value;
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
    if (field.counterType) return field.counterType;
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return key.includes("pallet") || label.includes("pallet") ? "pallet" : "lot";
  }

  private static counterPad4(field: TemplateField, segment?: { counterPad4?: boolean }) {
    return segment?.counterPad4 ?? field.counterPad4 ?? false;
  }

  private static counterValue(
    field: TemplateField,
    lot: number,
    pallet: number,
    sequence: number,
    lotStart: number,
    segment?: { counterType?: CounterType; counterPad4?: boolean },
    seed?: number,
  ) {
    const type = this.counterType(field, segment);
    const value = type === "pallet"
      ? (seed ?? 1) + pallet - 1
      : type === "sequence"
        ? (seed ?? 1) + sequence - 1
        : (seed ?? lotStart) + lot - lotStart;
    return this.counterPad4(field, segment) ? String(value).padStart(4, "0") : String(value);
  }

  private static counterSeed(row: MarkingContent | undefined, key: string) {
    const seed = row?.[key]?.trim();
    return seed && /^\d+$/.test(seed) ? Number(seed) : undefined;
  }

  private static counterDisplayValue(
    field: TemplateField,
    row: MarkingContent | undefined,
    lot: number,
    pallet: number,
    sequence: number,
    lotStart: number,
    segment: { key: string; counterType?: CounterType; counterPad4?: boolean },
  ) {
    const seed = this.counterSeed(row, segment.key);
    const value = this.counterValue(field, lot, pallet, sequence, lotStart, segment, seed);
    return value;
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
    sequence: number,
    lotStart: number,
  ) {
    return fields.flatMap((field) => {
      if (field.segments?.length) {
        const selectedSegments = field.segments
          .filter((segment) => segment.showOnSticker !== false)
          .sort((a, b) => (a.stickerOrder ?? 0) - (b.stickerOrder ?? 0));
        const values = selectedSegments.flatMap((segment) => {
          const value = segment.isCounter
            ? this.counterDisplayValue(field, row, lot, pallet, sequence, lotStart, segment)
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
      if (field.isCounter) {
        const value = this.counterDisplayValue(field, row, lot, pallet, sequence, lotStart, {
          key: field.key,
          counterType: field.counterType,
          counterPad4: field.counterPad4,
        });
        return value ? [{ label: field.label, values: [{ value }], order: field.stickerOrder ?? 0, fontScale: field.fontScale, hideLabel: field.hideLabel }] : [];
      }
      const value = this.fieldValue(field, row?.[field.key]);
      return value ? [{ label: field.label, values: [{ value }], order: field.stickerOrder ?? 0, fontScale: field.fontScale, hideLabel: field.hideLabel }] : [];
    })
      .sort((a, b) => a.order - b.order)
      .map(({ label, values, order, fontScale, hideLabel }) => ({ label, values, order, fontScale, hideLabel }));
  }

  // 8x2 cells are too short for multiple rows, so every field on the table is folded
  // onto one line here instead of being shrunk row-by-row (which used to overflow).
  private static mergeDetailsToSingleRow(details: StickerItem["details"]): StickerItem["details"] {
    if (details.length <= 1) return details;
    const values = details.flatMap((detail, index) => [
      ...(index > 0 ? [{ value: "    " }] : []),
      ...(detail.hideLabel ? [] : [{ value: `${detail.label}: ` }]),
      ...detail.values,
    ]);
    return values.length ? [{ label: "", values, order: 0, hideLabel: true }] : [];
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
      const group = groups.get(groupKey) ?? { name, order, layout: this.normalizeGroupLayout(field.stickerGroupLayout), fields: [] };
      group.order = Math.min(group.order, field.stickerGroupOrder ?? index);
      group.fields.push({
        ...field,
        label: inferred.groupName ? inferred.fieldLabel : field.label,
      });
      groups.set(groupKey, group);
    });
    return Array.from(groups.values()).sort((a, b) => a.order - b.order);
  }

  static outsideGroupKey(group: Pick<OutsideStickerGroup, "name" | "order">) {
    return `${group.order}:${group.name}`;
  }

  static build(options: StickerBuildOptions) {
    const {
      customerName, format, sideCount, lotCount, lotStart, productionDate, stickerType, stickerFsc,
      insideFields, outsideFields, insideRow, outsideRow,
    } = options;
    const palletsByLot = STICKER_FORMAT_PALLETS[format as keyof typeof STICKER_FORMAT_PALLETS];
    if (!palletsByLot || sideCount <= 0 || lotCount <= 0) return [];
    const effectiveLayouts = {
      insideFrame: options.layouts?.insideFrame !== false,
      outsideFrame: options.layouts?.outsideFrame !== false && outsideFields.length > 0,
      customerName: options.layouts?.customerName !== false && !!customerName.trim(),
      fscLogo: stickerType === "TNR" && stickerFsc,
    };
    const items: StickerItem[] = [];

    const buildLayoutItems = (
      kind: StickerKind,
      detailsForSticker: (lot: number, pallet: number, sequence: number) => StickerItem["details"],
      group?: string,
      groupLayout?: StickerGroupLayout,
      groupOrder?: number,
    ) => {
      const generated: StickerItem[] = [];
      let sequenceBase = 0;
      Array.from({ length: lotCount }, (_, lotIndex) => {
        const palletCount = palletsByLot[lotIndex % palletsByLot.length];
        for (let pallet = 1; pallet <= palletCount; pallet += 1) {
          const sequence = sequenceBase + pallet;
          for (let side = 1; side <= sideCount; side += 1) {
            generated.push({
              kind,
              customerName,
              lot: lotStart + lotIndex,
              pallet,
              side,
              productionDate,
              stickerType,
              details: detailsForSticker(lotStart + lotIndex, pallet, sequence),
              group,
              groupLayout,
              groupOrder,
            });
          }
        }
        sequenceBase += palletCount;
      });
      return generated;
    };

    const addLayoutItems = (
      kind: StickerKind,
      detailsForSticker: (lot: number, pallet: number, sequence: number) => StickerItem["details"],
      group?: string,
      groupLayout?: StickerGroupLayout,
      groupOrder?: number,
    ) => {
      items.push(...buildLayoutItems(kind, detailsForSticker, group, groupLayout, groupOrder));
    };

    if (effectiveLayouts.insideFrame) {
      addLayoutItems("insideFrame", (lot, pallet, sequence) => this.fieldValues(insideFields, insideRow, lot, pallet, sequence, lotStart));
    }
    if (effectiveLayouts.outsideFrame) {
      this.outsideGroups(outsideFields).forEach((group) => {
        const isVertical = this.isVerticalGroupLayout(group.layout);
        addLayoutItems(
          "outsideFrame",
          (lot, pallet, sequence) => {
            const details = this.fieldValues(group.fields, outsideRow, lot, pallet, sequence, lotStart);
            return isVertical ? this.mergeDetailsToSingleRow(details) : details;
          },
          group.name,
          group.layout,
          group.order,
        );
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
