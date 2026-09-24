import { Component } from "react";
import { GripVertical, Lock } from "lucide-react";
import cn from "@/src/core/ui/cn";
import { LOCK_ICON } from "@/src/core/ui/table";
import {
  DRAG_HANDLE, EDITOR_NUMBER, FIELD_SUMMARY, SUMMARY_ACTIONS, SUMMARY_DELETE, SUMMARY_LABEL,
  SUMMARY_LABEL_EMPTY, SUMMARY_TOGGLE,
} from "@/src/core/ui/fieldEditor";
import Button from "@/src/components/ui/Button";
import type { FieldSummaryRowProps } from "@/src/core/models/manage-template";

/** One collapsed field row: drag handle, number, name and edit/delete actions. */
export default class FieldSummaryRow extends Component<FieldSummaryRowProps> {
  render() {
    const { field, fieldNumber, onEdit, onRemove, onDragStart, onDragEnd } = this.props;

    return (
      <div
        className={FIELD_SUMMARY}
        onClick={onEdit}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onEdit();
          }
        }}
      >
        <span
          className={DRAG_HANDLE}
          draggable
          onClick={(event) => event.stopPropagation()}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          title="ลากเพื่อย้ายตำแหน่ง Field"
        >
          <GripVertical size={16} />
        </span>
        <div className={EDITOR_NUMBER}>{fieldNumber}</div>
        <span className={cn(SUMMARY_LABEL, !field.label.trim() && SUMMARY_LABEL_EMPTY)}>
          {field.label.trim() || "(ยังไม่ตั้งชื่อ Field)"}
        </span>
        {field.locked && <Lock className={LOCK_ICON} size={15} aria-label="Locked" />}
        <div className={SUMMARY_ACTIONS}>
          <Button
            type="button"
            className={SUMMARY_TOGGLE}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            แก้ไข
          </Button>
          <Button
            type="button"
            className={SUMMARY_DELETE}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            ลบ
          </Button>
        </div>
      </div>
    );
  }
}
