"use client";

import { Component } from "react";
import { LayersPlus } from "lucide-react";
import { CONTAINER } from "@/src/core/ui/surfaces";
import cn from "@/src/core/ui/cn";
import { PRINT_EMPTY, TABLE_COLUMN, TABLE_COLUMN_LABEL } from "@/src/core/ui/table";
import StickerPage from "./StickerPage";
import TableSection from "./TableSection";
import type { OrderTableProps } from "@/src/core/models/marking-sticker";

export default class OrderTable extends Component<OrderTableProps> {
  render() {
    const {
      template, insideRows, outsideRows, outsideGroups, lotStart, isAdmin,
      framePages, customerNamePages, fscLogoPages, onChangeRow,
    } = this.props;

    return (
      <>
        {template ? (
          <div className={cn(CONTAINER, "mb-[118px] grid grid-cols-[minmax(0,1fr)] items-start gap-7 max-bp700:mb-[190px]")}>
            <div className={cn(TABLE_COLUMN, "border-t-primary")}>
              <div className={TABLE_COLUMN_LABEL}>
                <span>สติ๊กเกอร์</span>
                <strong>ในกรอบ</strong>
              </div>
              <TableSection
                number="2"
                title="ในกรอบ"
                subtitle="กรอกข้อมูลสำหรับสติ๊กเกอร์ในกรอบ"
                fields={template.inside}
                rows={insideRows}
                lotStart={lotStart}
                onChange={(row, key, value) => onChangeRow("inside", row, key, value)}
              />
            </div>
            <div className={cn(TABLE_COLUMN, "border-t-[#b45309]")}>
              <div className={TABLE_COLUMN_LABEL}>
                <span>สติ๊กเกอร์</span>
                <strong>นอกกรอบ</strong>
              </div>
              {outsideGroups.map((group, groupIndex) => (
                <TableSection
                  key={`${group.name}-${groupIndex}`}
                  number={String(groupIndex + 3)}
                  title={group.name}
                  subtitle={`กรอกข้อมูลสำหรับ ${group.name}`}
                  fields={group.fields}
                  rows={outsideRows}
                  lotStart={lotStart}
                  onChange={(row, key, value) => onChangeRow("outside", row, key, value)}
                />
              ))}
              {outsideGroups.length === 0 && isAdmin && (
                <TableSection
                  number="3"
                  title="ข้อมูลสำหรับสติ๊กเกอร์นอกกรอบ"
                  subtitle="กรอกข้อมูลสำหรับสติ๊กเกอร์นอกกรอบ"
                  fields={[]}
                  rows={[]}
                  lotStart={lotStart}
                  onChange={(row, key, value) => onChangeRow("outside", row, key, value)}
                  emptyText="ลูกค้ารายนี้ยังไม่ได้ตั้งค่าสติ๊กเกอร์นอกกรอบ"
                />
              )}
            </div>
          </div>
        ) : (
          <div className={cn(CONTAINER, PRINT_EMPTY)}>
            <LayersPlus className="item-center justify-center" strokeWidth={"1px"} size={"100px"} />
            <strong>โปรดเลือก template ก่อนสั่งพิมพ์</strong>
          </div>
        )}

        <div className="print-sheet">
          {framePages.map((page, index) => (
            <StickerPage items={page.items} key={`frame-${index}`} layout={page.layout} />
          ))}
          {customerNamePages.map((page, index) => (
            <StickerPage items={page} key={`template-${index}`} layout="customerName" />
          ))}
          {fscLogoPages.map((page, index) => (
            <StickerPage items={page} key={`fsc-${index}`} layout="fsc" />
          ))}
        </div>

      </>
    );
  }
}
