import { Component } from "react";
import { GripVertical } from "lucide-react";
import cn from "@/src/core/ui/cn";
import { DRAG_HANDLE, FIELD_WRAP_DRAGGING, TABLE_HEAD } from "@/src/core/ui/fieldEditor";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import Select from "@/src/components/ui/Select";
import type { StickerGroupLayout } from "@/src/core/models/template";
import type { FieldTableHeaderProps } from "@/src/core/models/manage-template";

/** Header row shown above the first field of each outside-frame table. */
export default class FieldTableHeader extends Component<FieldTableHeaderProps> {
  render() {
    const { field, tableOrder, isDragging, onDragStart, onDragEnd, onDragOver, onRename, onChangeLayout, onRemove } = this.props;

    return (
      <div
        data-table-head
        className={cn(TABLE_HEAD, isDragging && FIELD_WRAP_DRAGGING)}
        onDragOver={onDragOver}
        onDrop={(event) => event.preventDefault()}
      >
        <span
          className={DRAG_HANDLE}
          draggable
          onDragStart={(event) => onDragStart(event, event.currentTarget.closest("[data-table-head]"))}
          onDragEnd={onDragEnd}
          title="ลากเพื่อย้าย Table"
        >
          <GripVertical size={16} />
        </span>
        <Input
          bare
          value={field.stickerGroup ?? `นอกกรอบ ${tableOrder + 1}`}
          onChange={(event) => onRename(event.target.value)}
        />
        <Select
          bare
          aria-label="รูปแบบ Table"
          value={field.stickerGroupLayout === "8x2" || field.stickerGroupLayout === "4x2" ? "8x2" : "2x2"}
          onChange={(event) => onChangeLayout(event.target.value as StickerGroupLayout)}
        >
          <option value="2x2">2 × 2</option>
          <option value="8x2">8 × 2</option>
        </Select>
        <Button type="button" onClick={onRemove}>
          ลบ Table
        </Button>
      </div>
    );
  }
}
