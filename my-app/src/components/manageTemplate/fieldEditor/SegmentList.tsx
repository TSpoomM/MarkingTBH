import { Component } from "react";
import { GripVertical } from "lucide-react";
import cn from "@/src/core/ui/cn";
import {
  ADD_SEGMENT, COUNT_SEGMENT, COUNT_SEGMENT_ACTIVE, DRAG_HANDLE, DRAG_HANDLE_SEGMENT, FORMAT_PREVIEW,
  SEGMENTS_ROW, SEGMENTS_TITLE, SEGMENT_ACTIONS, SEGMENT_AFFIXES, SEGMENT_CARD, SEGMENT_CARD_DRAGGING,
  SEGMENT_HEAD, SEGMENT_HEAD_LEFT, SEGMENT_NAME,
} from "@/src/core/ui/fieldEditor";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import TemplateFieldUtils from "@/src/core/templates/templateFieldUtils";
import type { SegmentListProps } from "@/src/core/models/manage-template";

/** Editable list of the sections that make up a multi-section field. */
export default class SegmentList extends Component<SegmentListProps> {
  render() {
    const { field, fieldIndex, draggingSegmentKey, onChange, onOpenCounterPrompt, onDragStart, onDragEnd, onDragOver } = this.props;
    const segments = field.segments ?? [];

    return (
      <div className={SEGMENTS_ROW}>
        <div className={SEGMENTS_TITLE}>Section</div>
        <div className={FORMAT_PREVIEW}>
          <span>ตัวอย่างบนสติ๊กเกอร์</span>
          <strong>{TemplateFieldUtils.segmentPreview(field)}</strong>
        </div>
        {segments.map((segment, segmentIndex) => (
          <div
            data-segment-card
            className={cn(SEGMENT_CARD, draggingSegmentKey === `${field.key}:${segment.key}` && SEGMENT_CARD_DRAGGING)}
            key={`${field.key}-${segment.key}`}
            onDragOver={(event) => onDragOver(event, segmentIndex)}
            onDrop={(event) => event.preventDefault()}
          >
            <div className={SEGMENT_HEAD}>
              <div className={SEGMENT_HEAD_LEFT}>
                <span
                  className={cn(DRAG_HANDLE, DRAG_HANDLE_SEGMENT)}
                  draggable
                  onDragStart={(event) => onDragStart(
                    event, segmentIndex, segment.key,
                    event.currentTarget.closest("[data-segment-card]"),
                  )}
                  onDragEnd={onDragEnd}
                  title="ลากเพื่อย้าย Section"
                >
                  <GripVertical size={16} />
                </span>
                <strong>Section {segmentIndex + 1}</strong>
              </div>
              {segment.isCounter && <span>นับ</span>}
            </div>
            <label className={SEGMENT_NAME}>
              <span>ชื่อ Section</span>
              <Input
                bare
                value={segment.label}
                onChange={(event) => onChange({
                  segments: segments.map((item, itemIndex) =>
                    itemIndex === segmentIndex ? { ...item, label: event.target.value.toUpperCase() } : item,
                  ),
                })}
              />
            </label>
            <div className={SEGMENT_AFFIXES}>
              <label>
                <span>ก่อน Section</span>
                <Input
                  bare
                  value={segment.prefix ?? ""}
                  onChange={(event) => onChange({
                    displayFormat: undefined,
                    segments: segments.map((item, itemIndex) =>
                      itemIndex === segmentIndex ? { ...item, prefix: event.target.value } : item,
                    ),
                  })}
                  placeholder="เช่น ("
                />
              </label>
              <label>
                <span>หลัง Section</span>
                <Input
                  bare
                  value={segment.suffix ?? ""}
                  onChange={(event) => onChange({
                    displayFormat: undefined,
                    segments: segments.map((item, itemIndex) =>
                      itemIndex === segmentIndex ? { ...item, suffix: event.target.value } : item,
                    ),
                  })}
                  placeholder="เช่น / หรือ )"
                />
              </label>
            </div>
            <div className={SEGMENT_ACTIONS} aria-label={`ตั้งค่า Section ${segmentIndex + 1}`}>
              <Button
                type="button"
                className={cn(COUNT_SEGMENT, segment.isCounter && COUNT_SEGMENT_ACTIVE)}
                onClick={() => onOpenCounterPrompt(segmentIndex)}
              >
                {segment.isCounter ? `นับ: ${TemplateFieldUtils.counterTypeLabel(segment.counterType ?? TemplateFieldUtils.inferCounterType(field))}` : "นับ"}
              </Button>
              <Button
                type="button"
                disabled={segments.length <= 1}
                onClick={() => {
                  const remaining = segments.filter((_, itemIndex) => itemIndex !== segmentIndex);
                  onChange({
                    segments: remaining.map((item) => ({
                      ...item,
                      type: item.isCounter ? "number" : item.type ?? "text",
                      counterType: item.isCounter
                        ? item.counterType ?? TemplateFieldUtils.inferCounterType(field)
                        : item.counterType,
                    })),
                  });
                }}
              >
                ลบ
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          className={ADD_SEGMENT}
          onClick={() => onChange({
            segments: [
              ...segments,
              {
                key: `${field.key}_${TemplateFieldUtils.uid()}`,
                label: `Section ${segments.length + 1}`,
                type: "text",
                showOnSticker: true,
                stickerOrder: (field.stickerOrder ?? fieldIndex) * 10 + segments.length,
                isCounter: false,
                counterType: TemplateFieldUtils.inferCounterType(field),
              },
            ],
          })}
        >
          +1
        </Button>
      </div>
    );
  }
}
