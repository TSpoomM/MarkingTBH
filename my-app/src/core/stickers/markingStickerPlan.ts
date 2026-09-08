import StickerFactory from "./stickerFactory";
import StickerPreview from "./stickerPreview";
import type { MarkingState, PrintSection, PrintSections } from "@/src/core/models/marking";
import type { StickerItem } from "@/src/core/models/marking-sticker";

export type FramePageLayout = "frame" | "frameVertical";

export interface FramePage {
  items: StickerItem[];
  layout: FramePageLayout;
}

export interface PrintPages {
  framePages: FramePage[];
  customerNamePages: StickerItem[][];
  fscLogoPages: StickerItem[][];
}

export interface PrintOption {
  key: string;
  section: PrintSection;
  title: string;
  description: string;
  outsideGroupKey?: string;
}

const STICKERS_PER_PAGE = {
  insideFrame: 4,
  outsideFrame: 4,
  outsideFrameVertical: 16,
  customerName: 16,
  fscLogo: 4,
} as const;

const PREVIEW_FALLBACK = {
  format: "555",
  sideCount: 1,
  productionDate: "xxx",
} as const;

type BuildOverrides = {
  format: string;
  sideCount: number;
  lotCount: number;
  productionDate: string;
};

/**
 * Derives everything the marking page prints or previews from MarkingState.
 * OrderTable and Pagination used to run these same derivations inside render().
 */
export default class MarkingStickerPlan {
  /** Outside fields whose condition matches the currently selected sticker values. */
  static outsideFields(state: MarkingState) {
    return (state.template?.outside ?? []).filter((field) =>
      StickerFactory.matchesCondition(field, state.stickerType, state.stickerOther),
    );
  }

  static outsideGroups(state: MarkingState) {
    return StickerFactory.outsideGroups(this.outsideFields(state));
  }

  private static build(state: MarkingState, overrides: BuildOverrides) {
    return StickerFactory.build({
      customerName: "",
      format: overrides.format,
      sideCount: overrides.sideCount,
      lotCount: overrides.lotCount,
      lotStart: state.lotStart,
      productionDate: overrides.productionDate,
      stickerType: state.stickerType,
      stickerFsc: state.stickerFsc,
      layouts: state.template?.sticker.layouts,
      insideFields: state.template?.inside ?? [],
      outsideFields: this.outsideFields(state),
      insideRow: state.insideRows[0],
      outsideRow: state.outsideRows[0],
    });
  }

  /** Stickers for the hidden print sheet - only built while a print run is active. */
  static printItems(state: MarkingState): StickerItem[] {
    if (!state.isPrintSheetActive) return [];
    return this.build(state, {
      format: state.stickerFormat,
      sideCount: Number(state.stickerSides || 0),
      lotCount: Number(state.lotCount || 1),
      productionDate: state.productionDate,
    });
  }

  static printPages(state: MarkingState): PrintPages {
    const items = this.printItems(state);
    const insideFramePages: FramePage[] = StickerFactory
      .chunk(items.filter((item) => item.kind === "insideFrame"), STICKERS_PER_PAGE.insideFrame)
      .map((pageItems) => ({ items: pageItems, layout: "frame" }));
    const outsideFramePages: FramePage[] = this.outsideGroups(state).flatMap((group) => {
      if (state.printOutsideGroups[StickerFactory.outsideGroupKey(group)] === false) return [];
      const groupItems = items.filter((item) =>
        item.kind === "outsideFrame" && item.group === group.name && item.groupOrder === group.order,
      );
      const isVertical = StickerFactory.isVerticalGroupLayout(group.layout);
      const perPage = isVertical ? STICKERS_PER_PAGE.outsideFrameVertical : STICKERS_PER_PAGE.outsideFrame;
      return StickerFactory.chunk(groupItems, perPage).map((pageItems): FramePage => ({
        items: pageItems,
        layout: isVertical ? "frameVertical" : "frame",
      }));
    });

    return {
      framePages: [
        ...(state.printSections.insideFrame ? insideFramePages : []),
        ...(state.printSections.outsideFrame ? outsideFramePages : []),
      ],
      customerNamePages: StickerFactory.chunk(
        items.filter((item) => item.kind === "customerName"),
        STICKERS_PER_PAGE.customerName,
      ),
      fscLogoPages: state.printSections.fscLogo
        ? StickerFactory.chunk(items.filter((item) => item.kind === "fscLogo"), STICKERS_PER_PAGE.fscLogo)
        : [],
    };
  }

  /** One sticker per distinct layout, built from placeholder values when nothing is filled in yet. */
  static previewItems(state: MarkingState) {
    const items = this.build(state, {
      format: state.stickerFormat || PREVIEW_FALLBACK.format,
      sideCount: Number(state.stickerSides || PREVIEW_FALLBACK.sideCount),
      lotCount: 1,
      productionDate: state.productionDate || PREVIEW_FALLBACK.productionDate,
    });
    return StickerPreview.unique(items, { includeGroupOrder: true });
  }

  static availableSections(state: MarkingState): PrintSections {
    return {
      insideFrame: !!state.template && state.template.sticker.layouts.insideFrame !== false,
      outsideFrame: state.template?.sticker.layouts.outsideFrame !== false && this.outsideGroups(state).length > 0,
      customerName: false,
      fscLogo: state.stickerType === "TNR" && state.stickerFsc,
    };
  }

  /** Checkboxes offered in the export modal - one per printable sticker layout. */
  static printOptions(state: MarkingState): PrintOption[] {
    const available = this.availableSections(state);
    return [
      ...(available.insideFrame
        ? [{ key: "insideFrame", section: "insideFrame" as const, title: "ในกรอบ", description: "สติ๊กเกอร์ในกรอบ" }]
        : []),
      ...(available.outsideFrame
        ? this.outsideGroups(state).map((group) => ({
          key: `outside-${StickerFactory.outsideGroupKey(group)}`,
          section: "outsideFrame" as const,
          title: group.name,
          description: "สติ๊กเกอร์นอกกรอบ",
          outsideGroupKey: StickerFactory.outsideGroupKey(group),
        }))
        : []),
      ...(available.fscLogo
        ? [{ key: "fscLogo", section: "fscLogo" as const, title: "FSC", description: "โลโก้ FSC" }]
        : []),
    ];
  }

  static isOptionSelected(state: MarkingState, option: PrintOption) {
    return (
      state.printSections[option.section] &&
      (!option.outsideGroupKey || state.printOutsideGroups[option.outsideGroupKey] !== false)
    );
  }

  static hasSelectedPrintSection(state: MarkingState, options: PrintOption[]) {
    return options.some((option) => this.isOptionSelected(state, option));
  }
}
