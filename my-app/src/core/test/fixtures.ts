import type { StickerLayouts, TemplateDetail, TemplateField } from "@/src/core/models/template";
import type { MarkingState } from "@/src/core/models/marking";

/** A minimal valid TemplateField; tests override only what they care about. */
export function field(overrides: Partial<TemplateField> = {}): TemplateField {
  return { key: "f", label: "F", type: "text", required: true, ...overrides };
}

export const ALL_LAYOUTS: StickerLayouts = {
  insideFrame: true,
  outsideFrame: true,
  customerName: false,
  fscLogo: false,
};

export function templateDetail(overrides: Partial<TemplateDetail> = {}): TemplateDetail {
  return {
    id: 1,
    customerName: "ACME",
    templateId: 1,
    sticker: {
      enabledFields: ["side", "format", "type", "other"],
      layouts: { ...ALL_LAYOUTS },
      defaults: { sideCount: 1, format: "555", stickerType: "NON TNR", stickerOther: "Dome", stickerFsc: false },
    },
    inside: [],
    outside: [],
    ...overrides,
  };
}

export function markingState(overrides: Partial<MarkingState> = {}): MarkingState {
  return {
    templates: [],
    destinationOptions: [],
    templateId: "1",
    template: templateDetail(),
    totalLot: "1",
    stickerSides: "1",
    stickerFormat: "555",
    stickerType: "NON TNR",
    stickerFsc: false,
    stickerOther: "Dome",
    printSections: { insideFrame: true, outsideFrame: true, customerName: false, fscLogo: false },
    printOutsideGroups: {},
    lotCount: "1",
    lotStart: 1,
    productionDate: "2026-09-02",
    insideRows: [{}],
    outsideRows: [{}],
    isAdmin: false,
    isLoading: false,
    isSaving: false,
    isExportModalOpen: false,
    isPrintSheetActive: true,
    lotOverlap: null,
    notice: null,
    ...overrides,
  };
}
