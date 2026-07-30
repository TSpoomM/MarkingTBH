"use client";

import { Component } from "react";
import type { MarkingContent } from "@/app/types/marking";
import EmptyState from "./EmptyState";
import { SectionTitle } from "./FilterPanel";
import Card from "@/app/components/Card";
import Input from "@/app/components/Input";
import MarkingComponent from "./MarkingComponent";
import { STICKER_FORMAT_PALLETS } from "@/app/types/constants";
import { TemplateField, type StickerLayouts } from "@/app/types/customer";

type StickerKind = "insideFrame" | "outsideFrame" | "customerName";

interface StickerItem {
  kind: StickerKind;
  title: string;
  customerName: string;
  lot: number;
  pallet: number;
  side: number;
  productionDate: string;
  details: Array<{ label: string; value: string }>;
}

const stickerTitles: Record<StickerKind, string> = {
  insideFrame: "ในกรอบ",
  outsideFrame: "นอกกรอบ",
  customerName: "ชื่อ Customer",
};

const chunk = <T,>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );

const counterValue = (field: TemplateField, lot: number, pallet: number) => {
  const key = field.key.toLowerCase();
  const label = field.label.toLowerCase();
  if (key.includes("lot") || label.includes("lot")) return String(lot);
  if (key.includes("pallet") || label.includes("pallet")) return String(pallet);
  return "";
};

const previewCounterValue = (field: TemplateField, lotStart: number) => {
  const key = field.key.toLowerCase();
  const label = field.label.toLowerCase();
  if (key.includes("lot") || label.includes("lot")) return String(lotStart || 1);
  if (key.includes("pallet") || label.includes("pallet")) return "1";
  return "";
};

const fieldValues = (fields: TemplateField[], row: MarkingContent | undefined, lot: number, pallet: number) =>
  fields
    .flatMap((field) => {
      if (field.segments?.length) {
        return field.segments
          .filter((segment) => segment.showOnSticker !== false)
          .sort((a, b) => (a.stickerOrder ?? 0) - (b.stickerOrder ?? 0))
          .flatMap((segment) => {
            const value = segment.isCounter ? counterValue(field, lot, pallet) : row?.[segment.key];
            return value ? [{ label: `${field.label} - ${segment.label}`, value, order: segment.stickerOrder ?? 0 }] : [];
          });
      }
      if (field.showOnSticker === false) return [];
      const value = row?.[field.key];
      return value ? [{ label: field.label, value, order: field.stickerOrder ?? 0 }] : [];
    })
    .sort((a, b) => a.order - b.order)
    .map(({ label, value }) => ({ label, value }));

function buildStickerItems({
  customerName,
  format,
  sideCount,
  lotCount,
  lotStart,
  productionDate,
  layouts,
  insideFields,
  outsideFields,
  insideRow,
  outsideRow,
}: {
  customerName: string;
  format: string;
  sideCount: number;
  lotCount: number;
  lotStart: number;
  productionDate: string;
  layouts: StickerLayouts | undefined;
  insideFields: TemplateField[];
  outsideFields: TemplateField[];
  insideRow: MarkingContent | undefined;
  outsideRow: MarkingContent | undefined;
}) {
  const palletsByLot = STICKER_FORMAT_PALLETS[format as keyof typeof STICKER_FORMAT_PALLETS];
  if (!palletsByLot || sideCount <= 0 || lotCount <= 0 || !layouts) return [];

  const items: StickerItem[] = [];

  const addLayoutItems = (kind: StickerKind, detailsForSticker: (lot: number, pallet: number) => StickerItem["details"]) => {
    Array.from({ length: lotCount }, (_, lotIndex) => {
      const palletCount = palletsByLot[lotIndex % palletsByLot.length];
      for (let pallet = 1; pallet <= palletCount; pallet += 1) {
        for (let side = 1; side <= sideCount; side += 1) {
          items.push({
            kind,
            title: stickerTitles[kind],
            customerName,
            lot: lotStart + lotIndex,
            pallet,
            side,
            productionDate,
            details: detailsForSticker(lotStart + lotIndex, pallet),
          });
        }
      }
    });
  };

  if (layouts.insideFrame) {
    addLayoutItems("insideFrame", (lot, pallet) => fieldValues(insideFields, insideRow, lot, pallet));
  }
  if (layouts.outsideFrame) {
    addLayoutItems("outsideFrame", (lot, pallet) => fieldValues(outsideFields, outsideRow, lot, pallet));
  }
  if (layouts.customerName) {
    addLayoutItems("customerName", () => []);
  }

  return items;
}

export default class OrderTable extends MarkingComponent {
  render() {
    const customer = this.state.customers.find(
      (item) => String(item.id) === this.state.customerId,
    );
    const outsideFields = (this.state.template?.outside ?? []).filter((field) =>
      !field.condition || field.condition.stickerType === this.state.stickerType,
    );
    const stickerItems = buildStickerItems({
      customerName: this.state.template?.customerName ?? customer?.name ?? "",
      format: this.state.stickerFormat,
      sideCount: Number(this.state.stickerSides || 0),
      lotCount: Number(this.state.lotCount || 1),
      lotStart: this.state.lotStart,
      productionDate: this.state.productionDate,
      layouts: this.state.template?.sticker.layouts,
      insideFields: this.state.template?.inside ?? [],
      outsideFields,
      insideRow: this.state.insideRows[0],
      outsideRow: this.state.outsideRows[0],
    });
    const frameStickerPages = chunk(
      stickerItems.filter((item) => item.kind !== "customerName"),
      4,
    );
    const customerNameStickerPages = chunk(
      stickerItems.filter((item) => item.kind === "customerName"),
      32,
    );

    return (
      <>
        <div className="container table-layout">
          <TableSection
            number="2"
            title="ข้อมูลภายในกล่อง (Inside)"
            subtitle="Template มาตรฐานสำหรับข้อมูลภายในกล่อง"
              fields={this.state.template?.inside ?? []}
              rows={this.state.insideRows}
              lotStart={this.state.lotStart}
              onChange={(row, key, value) => this.actions.updateRow("inside", row, key, value)}
          />
          {this.state.template && (outsideFields.length > 0 || this.state.isAdmin) && (
            <TableSection
              number="3"
              title="ข้อมูลภายนอกกล่อง (Outside)"
              subtitle={`Template เฉพาะของ ${customer?.name ?? "ลูกค้าที่เลือก"}`}
              fields={outsideFields}
              rows={this.state.outsideRows}
              lotStart={this.state.lotStart}
              onChange={(row, key, value) => this.actions.updateRow("outside", row, key, value)}
              emptyText="ลูกค้ารายนี้ไม่มี Outside Template"
            />
          )}
        </div>

        <div className="print-sheet">
          {frameStickerPages.map((page, index) => (
            <StickerPage items={page} key={`frame-${index}`} layout="frame" />
          ))}
          {customerNameStickerPages.map((page, index) => (
            <StickerPage items={page} key={`customer-${index}`} layout="customerName" />
          ))}
        </div>

      </>
    );
  }
}

interface TableSectionProps {
  number: string;
  title: string;
  subtitle: string;
  fields: TemplateField[];
  rows: MarkingContent[];
  lotStart: number;
  onChange: (row: number, key: string, value: string) => void;
  emptyText?: string;
}

class TableSection extends Component<TableSectionProps> {
  render() {
    const { number, title, subtitle, fields, rows, lotStart, onChange, emptyText } = this.props;
    return (
      <Card className="table-panel">
        <div className="table-heading">
          <SectionTitle number={number} title={title} subtitle={subtitle} />
        </div>
        {!fields.length ? (
          <EmptyState message={emptyText ?? "เลือกลูกค้าเพื่อโหลด Template"} />
        ) : (
          <div className="vertical-records">
            {rows.map((row, rowIndex) => (
              <article className="record-card" key={rowIndex}>
                <header><div><span>{String(rowIndex + 1).padStart(2, "0")}</span><b>ข้อมูลสติ๊กเกอร์</b></div></header>
                <div className="vertical-fields">
                  {fields.map((field) => (
                    <label key={field.key}>
                      <span>{field.label}{field.required && <em>*</em>}</span>
                      {field.segments?.length ? (
                        <div className="horizontal-segment-inputs">
                          {field.segments.map((segment) => (
                            <Input
                              key={segment.key}
                              bare
                              type={segment.isCounter ? "number" : "text"}
                              inputMode={segment.isCounter ? "numeric" : undefined}
                              min={segment.isCounter ? 1 : undefined}
                              step={segment.isCounter ? 1 : undefined}
                              value={segment.isCounter ? previewCounterValue(field, lotStart) : row[segment.key] ?? ""}
                              disabled={segment.isCounter}
                              onChange={(event) => onChange(rowIndex, segment.key, event.target.value)}
                              placeholder={segment.isCounter ? "+1" : segment.label}
                            />
                          ))}
                        </div>
                      ) : (
                        <Input
                          bare
                          type={field.type === "textarea" ? "text" : field.type}
                          value={row[field.key] ?? ""}
                          onChange={(event) => onChange(rowIndex, field.key, event.target.value)}
                          placeholder={field.placeholder ?? `กรอก ${field.label}`}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    );
  }
}

class StickerPage extends Component<{ items: StickerItem[]; layout: "frame" | "customerName" }> {
  render() {
    const { items, layout } = this.props;
    return (
      <section className={`sticker-page ${layout === "frame" ? "sticker-page-frame" : "sticker-page-customer"}`}>
        {items.map((item, index) => (
          <article className={`sticker-label ${item.kind}`} key={`${item.kind}-${item.lot}-${item.pallet}-${item.side}-${index}`}>
            <header>
              <strong>{item.kind === "customerName" ? item.customerName : item.title}</strong>
              {item.kind !== "customerName" && <span>{item.customerName}</span>}
            </header>
            {item.kind === "customerName" ? (
              <p>{item.customerName}</p>
            ) : (
              <>
                <dl>
                  {item.details.map((detail) => (
                    <div key={`${detail.label}-${detail.value}`}>
                      <dt>{detail.label}</dt>
                      <dd>{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </article>
        ))}
      </section>
    );
  }
}
