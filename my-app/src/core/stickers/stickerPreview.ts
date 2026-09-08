import type { StickerItem, StickerKind } from "@/src/core/models/marking-sticker";

export const PREVIEW_MODE_LABELS: Record<StickerKind, string> = {
  insideFrame: "ในกรอบ",
  outsideFrame: "นอกกรอบ",
  customerName: "ชื่อ Template",
  fscLogo: "โลโก้ FSC",
};

export const PREVIEW_MODE_ORDER: StickerKind[] = ["insideFrame", "outsideFrame", "customerName", "fscLogo"];

export interface OutsideItemGroup {
  key: string;
  name: string;
  items: StickerItem[];
}

/**
 * Selectors behind the two Preview Sticker modals (marking page and manage-template page).
 * Both used to carry private copies of this logic.
 */
export default class StickerPreview {
  private static signature(item: StickerItem, includeGroupOrder: boolean) {
    return [
      item.kind,
      item.group ?? "",
      ...(includeGroupOrder ? [item.groupOrder ?? ""] : []),
      item.details
        .map((detail) => `${detail.label}:${detail.values.map((value) => value.label ?? "").join("|")}`)
        .join(";"),
    ].join("|");
  }

  /**
   * Keeps one sticker per distinct content signature - a print run repeats the same
   * layout many times and the preview only needs to show each distinct one.
   */
  static unique(items: StickerItem[], options?: { includeGroupOrder?: boolean }) {
    const seen = new Set<string>();
    return items.filter((item) => {
      const signature = this.signature(item, options?.includeGroupOrder === true);
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }

  static modes(items: StickerItem[]) {
    const kinds = new Set(items.map((item) => item.kind));
    return PREVIEW_MODE_ORDER.filter((kind) => kinds.has(kind));
  }

  static firstMode(items: StickerItem[]): StickerKind {
    return this.modes(items)[0] ?? "insideFrame";
  }

  /** Distinct outside group names, in the order the items appear. */
  static outsideGroupNames(items: StickerItem[]) {
    const names: string[] = [];
    items.forEach((item) => {
      const name = item.group ?? "";
      if (!name || names.includes(name)) return;
      names.push(name);
    });
    return names;
  }

  /** Outside groups keyed by order + name, each carrying its own items. */
  static outsideItemGroups(items: StickerItem[]) {
    const groups: OutsideItemGroup[] = [];
    items.forEach((item) => {
      const name = item.group?.trim() || "นอกกรอบ";
      const key = `${item.groupOrder ?? 0}:${name}`;
      const group = groups.find((entry) => entry.key === key);
      if (group) group.items.push(item);
      else groups.push({ key, name, items: [item] });
    });
    return groups;
  }
}
