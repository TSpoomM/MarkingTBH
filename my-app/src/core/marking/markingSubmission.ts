import { MESSAGES } from "@/src/core/models/constants";
import type { MarkingState, SaveMarkingPayload } from "@/src/core/models/marking";
import StickerFactory from "@/src/core/stickers/stickerFactory";
import MarkingRows from "./markingRows";

/** Decides whether the marking form may be saved and builds the request that saves it. */
export default class MarkingSubmission {
  /** Returns the message to show the user, or "" when the form is complete. */
  static validate(state: MarkingState): string {
    const { templateId, template, insideRows, outsideRows } = state;
    if (!templateId) return MESSAGES.selectTemplate;
    const stickerFields = template?.sticker.enabledFields ?? [];
    if (!state.productionDate) return "กรุณาเลือก Production Date";
    if (!Number.isInteger(Number(state.lotCount)) || Number(state.lotCount) < 1) return "กรุณากรอกจำนวน Lot";
    if (!state.stickerSides) return "กรุณาเลือก Side";
    if (!state.stickerFormat) return "กรุณาเลือก Format";
    if ((stickerFields.includes("type") || StickerFactory.needsStickerType(template?.outside ?? [])) && !state.stickerType) return "กรุณาเลือกเกรด";
    if ((stickerFields.includes("other") || StickerFactory.needsStickerOther(template?.outside ?? [])) && !state.stickerOther) return "กรุณาเลือก Other";
    const applies = (field: Parameters<typeof StickerFactory.matchesCondition>[0]) =>
      StickerFactory.matchesCondition(field, state.stickerType, state.stickerOther);
    for (const [index, row] of insideRows.entries()) {
      const missing = template?.inside.find((field) =>
        field.required &&
        applies(field) &&
        (field.segments?.length
          ? field.segments.some((segment) => !segment.isCounter && !row[segment.key]?.trim())
          : !row[field.key]?.trim()),
      );
      if (missing) return `Inside แถว ${index + 1}: กรุณากรอก ${missing.label}`;
    }
    for (const [index, row] of outsideRows.entries()) {
      const missing = template?.outside.find((field) =>
        field.required &&
        applies(field) &&
        !row[field.key]?.trim(),
      );
      if (missing) return `Outside แถว ${index + 1}: กรุณากรอก ${missing.label}`;
    }
    return "";
  }

  static buildPayload(state: MarkingState, actionType: SaveMarkingPayload["actionType"] = "save"): SaveMarkingPayload {
    const insideRows = MarkingRows.withLockedDefaults(state.template?.inside, state.insideRows);
    const outsideRows = MarkingRows.withLockedDefaults(state.template?.outside, state.outsideRows);
    return {
      templateId: Number(state.templateId),
      totalLot: Number(state.totalLot || 0),
      stickerSides: Number(state.stickerSides || 1),
      lotCount: Number(state.lotCount || 1),
      lotStart: state.lotStart,
      productionDate: state.productionDate,
      actionType,
      contentInside: insideRows.map((row) => ({
        ...row,
        production_date: state.productionDate,
        lot_count: state.lotCount,
        lot_start: String(state.lotStart),
        lot_end: String(state.lotStart + Number(state.lotCount || 1) - 1),
        ...(state.stickerFormat && { sticker_format: state.stickerFormat }),
        ...(state.stickerType && { sticker_type: state.stickerType }),
        ...(state.stickerType === "TNR" && { sticker_fsc: state.stickerFsc ? "YES" : "NO" }),
        ...(state.stickerOther && { sticker_other: state.stickerOther }),
      })),
      contentOutside: outsideRows,
      ...(actionType === "print" && { printSections: state.printSections }),
    };
  }
}
