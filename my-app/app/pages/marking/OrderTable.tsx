"use client";

import { Component, createRef, type CSSProperties } from "react";
import Image from "next/image";
import type { MarkingContent } from "@/app/types/marking";
import EmptyState from "./EmptyState";
import { SectionTitle } from "./FilterPanel";
import Input from "@/app/components/Input";
import MarkingComponent from "./MarkingComponent";
import { STICKER_FORMAT_PALLETS } from "@/app/types/constants";
import { TemplateField } from "@/app/types/customer";
import type { CounterType } from "@/app/types/customer";
import type {
  OutsideStickerGroup,
  StickerBuildOptions,
  StickerItem,
  StickerKind,
  TableSectionProps,
} from "@/app/types/marking-sticker";

const matchesCondition = (field: TemplateField, stickerType: string, stickerOther: string) => (
  (!field.condition?.stickerType || field.condition.stickerType === stickerType) &&
  (!field.condition?.stickerOther || field.condition.stickerOther === stickerOther)
);

const conditionText = (field: TemplateField) => [
  field.condition?.stickerType && `Type = ${field.condition.stickerType}`,
  field.condition?.stickerOther && `Other = ${field.condition.stickerOther}`,
].filter(Boolean).join(", ");

class StickerFactory {
  static chunk<T>(items: T[], size: number) {
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
      items.slice(index * size, index * size + size),
    );
  }

  static previewCounterValue(field: TemplateField, lotStart: number) {
    return this.counterValue(field, lotStart || 1, 1);
  }

  private static counterType(field: TemplateField, segment?: { counterType?: CounterType }) {
    if (segment?.counterType) return segment.counterType;
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    return key.includes("pallet") || label.includes("pallet") ? "pallet" : "lot";
  }

  private static counterValue(field: TemplateField, lot: number, pallet: number, segment?: { counterType?: CounterType }) {
    return this.counterType(field, segment) === "pallet" ? String(pallet) : String(lot);
  }

  private static counterDisplayValue(
    field: TemplateField,
    row: MarkingContent | undefined,
    lot: number,
    pallet: number,
    segment: { key: string; counterType?: CounterType },
  ) {
    const value = this.counterValue(field, lot, pallet, segment);
    const seed = row?.[segment.key];
    return seed && /^\d+$/.test(seed) ? value.padStart(seed.length, "0") : value;
  }

  private static fieldValue(field: TemplateField, value: string | undefined) {
    if (!value) return "";
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    const needsKg = key === "gross" || key === "nett" || label === "gross" || label === "nett";
    return needsKg && !/\bkg\.?$/i.test(value.trim()) ? `${value} KG` : value;
  }

  private static fieldValues(
    fields: TemplateField[],
    row: MarkingContent | undefined,
    lot: number,
    pallet: number,
  ) {
    return fields.flatMap((field) => {
      if (field.segments?.length) {
        const selectedSegments = field.segments
          .filter((segment) => segment.showOnSticker !== false)
          .sort((a, b) => (a.stickerOrder ?? 0) - (b.stickerOrder ?? 0));
        const values = selectedSegments.flatMap((segment) => {
          const value = segment.isCounter
            ? this.counterDisplayValue(field, row, lot, pallet, segment)
            : row?.[segment.key];
          return value
            ? [{ label: segment.label, value }]
            : [];
        });
        return values.length
          ? [{ label: field.label, values, order: field.stickerOrder ?? Math.min(...selectedSegments.map((segment) => segment.stickerOrder ?? 0)) }]
          : [];
      }
      if (field.showOnSticker === false) return [];
      const value = this.fieldValue(field, row?.[field.key]);
      return value ? [{ label: field.label, values: [{ value }], order: field.stickerOrder ?? 0 }] : [];
    })
      .sort((a, b) => a.order - b.order)
      .map(({ label, values, order }) => ({ label, values, order }));
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
      const group = groups.get(groupKey) ?? { name, order, fields: [] };
      group.order = Math.min(group.order, field.stickerGroupOrder ?? index);
      group.fields.push({
        ...field,
        label: inferred.groupName ? inferred.fieldLabel : field.label,
      });
      groups.set(groupKey, group);
    });
    return Array.from(groups.values()).sort((a, b) => a.order - b.order);
  }

  static build(options: StickerBuildOptions) {
    const {
      customerName, format, sideCount, lotCount, lotStart, productionDate, stickerType,
      layouts, insideFields, outsideFields, insideRow, outsideRow,
    } = options;
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
              customerName,
              lot: lotStart + lotIndex,
              pallet,
              side,
              productionDate,
              stickerType,
              details: detailsForSticker(lotStart + lotIndex, pallet),
            });
          }
        }
      });
    };

    if (layouts.insideFrame) {
      addLayoutItems("insideFrame", (lot, pallet) => this.fieldValues(insideFields, insideRow, lot, pallet));
    }
    if (layouts.outsideFrame) {
      this.outsideGroups(outsideFields).forEach((group) => {
        addLayoutItems("outsideFrame", (lot, pallet) => this.fieldValues(group.fields, outsideRow, lot, pallet));
      });
    }
    if (layouts.customerName) addLayoutItems("customerName", () => []);

    return items;
  }
}

const stickerLabelStyle = (item: StickerItem): CSSProperties => {
  if (item.kind === "customerName") return {};

  const countPressure = Math.max(0, item.details.length - 5) * 1.1;
  const fontSize = Math.max(22, 30 - countPressure);
  const gap = Math.max(1.4, Math.min(4.5, fontSize / 6));
  const longestLabelLength = Math.max(...item.details.map((detail) => detail.label.length), 0);
  const labelColumnMm = Math.min(58, Math.max(34, longestLabelLength * 4));

  return {
    "--sticker-font": `${fontSize}px`,
    "--sticker-label-font": `${fontSize}px`,
    "--sticker-gap": `${gap}mm`,
    "--sticker-label-column": `${labelColumnMm}mm`,
  } as CSSProperties;
};

class AutoFitStickerRow extends Component<{ detail: StickerItem["details"][number] }, { fontSize: number }> {
  private readonly defaultFontSize = 30;
  private readonly minFontSize = 4;
  private readonly ref = createRef<HTMLDivElement>();
  private resizeObserver: ResizeObserver | undefined;

  state = { fontSize: this.defaultFontSize };

  componentDidMount() {
    this.fit();
    window.addEventListener("beforeprint", this.fitNow);
    if (typeof ResizeObserver !== "undefined" && this.ref.current) {
      this.resizeObserver = new ResizeObserver(() => this.fit());
      this.resizeObserver.observe(this.ref.current);
      if (this.ref.current.parentElement) {
        this.resizeObserver.observe(this.ref.current.parentElement);
      }
    }
  }

  componentDidUpdate(previousProps: { detail: StickerItem["details"][number] }) {
    if (previousProps.detail !== this.props.detail) this.fit();
  }

  componentWillUnmount() {
    window.removeEventListener("beforeprint", this.fitNow);
    this.resizeObserver?.disconnect();
  }

  private fitNow = () => {
    const element = this.ref.current;
    if (!element) return;
    const inheritedFontSize = Number.parseFloat(getComputedStyle(element).getPropertyValue("--sticker-font"));
    const baseFontSize = Number.isFinite(inheritedFontSize) ? inheritedFontSize : this.defaultFontSize;
    element.style.fontSize = `${baseFontSize}px`;
    const availableWidth = element.clientWidth;
    const requiredWidth = element.scrollWidth;
    const nextFontSize = requiredWidth > availableWidth && availableWidth > 0
      ? Math.max(this.minFontSize, Math.floor(baseFontSize * (availableWidth / requiredWidth)))
      : baseFontSize;
    element.style.fontSize = `${nextFontSize}px`;
    if (nextFontSize !== this.state.fontSize) this.setState({ fontSize: nextFontSize });
  };

  private fit = () => window.requestAnimationFrame(this.fitNow);

  render() {
    const { detail } = this.props;
    return (
      <div
        className="sticker-detail-row"
        ref={this.ref}
        style={{ "--sticker-row-font": `${this.state.fontSize}px` } as CSSProperties}
      >
        <dt>{detail.label}</dt>
        <dd className="sticker-detail-colon">:</dd>
        <dd className="sticker-detail-values">
          {detail.values.map((value, valueIndex) => (
            <span key={`${value.label ?? "value"}-${value.value}-${valueIndex}`}>
              {value.value}
            </span>
          ))}
        </dd>
      </div>
    );
  }
}

export default class OrderTable extends MarkingComponent {
  private previewItems(items: StickerItem[]) {
    const seen = new Set<string>();
    return items.filter((item) => {
      const signature = [
        item.kind,
        item.details.map((detail) => `${detail.label}:${detail.values.map((value) => value.label ?? "").join("|")}`).join(";"),
      ].join("|");
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }

  render() {
    const customer = this.state.customers.find(
      (item) => String(item.id) === this.state.customerId,
    );
    const outsideFields = (this.state.template?.outside ?? []).filter((field) =>
      matchesCondition(field, this.state.stickerType, this.state.stickerOther),
    );
    const outsideGroups = StickerFactory.outsideGroups(outsideFields);
    const stickerItems = StickerFactory.build({
      customerName: this.state.template?.customerName ?? customer?.name ?? "",
      format: this.state.stickerFormat,
      sideCount: Number(this.state.stickerSides || 0),
      lotCount: Number(this.state.lotCount || 1),
      lotStart: this.state.lotStart,
      productionDate: this.state.productionDate,
      stickerType: this.state.stickerType,
      layouts: this.state.template?.sticker.layouts,
      insideFields: this.state.template?.inside ?? [],
      outsideFields,
      insideRow: this.state.insideRows[0],
      outsideRow: this.state.outsideRows[0],
    });
    const frameStickerPages = StickerFactory.chunk(
      stickerItems.filter((item) => item.kind !== "customerName"),
      4,
    );
    const customerNameStickerPages = StickerFactory.chunk(
      stickerItems.filter((item) => item.kind === "customerName"),
      32,
    );
    const previewItems = this.previewItems(stickerItems);

    return (
      <>
        <div className="container table-layout">
          <div className="table-column table-column-inside">
            <div className="table-column-label">
              <span>สติ๊กเกอร์</span>
              <strong>ในกรอบ</strong>
            </div>
            <TableSection
              number="2"
              title="ข้อมูลสำหรับสติ๊กเกอร์ในกรอบ"
              subtitle="รายละเอียดหลักที่พิมพ์บนฉลากภายในกล่อง"
              fields={this.state.template?.inside ?? []}
              rows={this.state.insideRows}
              lotStart={this.state.lotStart}
              onChange={(row, key, value) => this.actions.updateRow("inside", row, key, value)}
            />
          </div>
          <div className="table-column table-column-outside">
            <div className="table-column-label">
              <span>สติ๊กเกอร์</span>
              <strong>นอกกรอบ</strong>
            </div>
            {this.state.template && outsideGroups.map((group, groupIndex) => (
              <TableSection
                key={`${group.name}-${groupIndex}`}
                number={groupIndex === 0 ? "3" : `3.${groupIndex + 1}`}
                title={`${group.name} (สติ๊กเกอร์นอกกรอบ)`}
                subtitle={`ช่องข้อมูลเฉพาะสำหรับลูกค้า ${customer?.name ?? "ที่เลือก"}`}
                fields={group.fields}
                rows={this.state.outsideRows}
                lotStart={this.state.lotStart}
                onChange={(row, key, value) => this.actions.updateRow("outside", row, key, value)}
              />
            ))}
            {this.state.template && outsideGroups.length === 0 && this.state.isAdmin && (
              <TableSection
                number="3"
                title="ข้อมูลสำหรับสติ๊กเกอร์นอกกรอบ"
                subtitle={`ช่องข้อมูลเฉพาะสำหรับลูกค้า ${customer?.name ?? "ที่เลือก"}`}
                fields={[]}
                rows={[]}
                lotStart={this.state.lotStart}
                onChange={(row, key, value) => this.actions.updateRow("outside", row, key, value)}
                emptyText="ลูกค้ารายนี้ยังไม่ได้ตั้งค่าสติ๊กเกอร์นอกกรอบ"
              />
            )}
          </div>
        </div>

        {previewItems.length > 0 && (
          <div className="container pdf-preview">
            {previewItems.map((item, index) => (
              <StickerLabel item={item} key={`preview-${item.kind}-${index}`} style={stickerLabelStyle(item)} />
            ))}
          </div>
        )}

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

class TableSection extends Component<TableSectionProps> {
  render() {
    const { number, title, subtitle, fields, rows, lotStart, onChange, emptyText } = this.props;
    return (
      <section className="table-panel">
        <div className="table-heading">
          <SectionTitle number={number} title={title} subtitle={subtitle} />
          <div className="table-meta">
            <span>{fields.length} ช่องข้อมูล</span>
            <span>{rows.length} ชุดข้อมูล</span>
          </div>
        </div>
        {!fields.length ? (
          <EmptyState message={emptyText ?? "เลือกลูกค้าเพื่อโหลดรูปแบบช่องข้อมูล"} />
        ) : (
          <div className="vertical-records">
            {rows.map((row, rowIndex) => (
              <article className="record-card" key={rowIndex}>
                <header><div><span>{String(rowIndex + 1).padStart(2, "0")}</span><b>ชุดข้อมูลสำหรับพิมพ์</b></div></header>
                <div className="vertical-fields">
                  {fields.map((field) => (
                    <label key={field.key}>
                      <span>
                        {field.label}
                        {field.required && <em>*</em>}
                        {field.required && conditionText(field) && <small>บังคับเมื่อ {conditionText(field)}</small>}
                      </span>
                      {field.segments?.length ? (
                        <div className="horizontal-segment-inputs">
                          {field.segments.map((segment, segmentIndex) => (
                            <Input
                              key={`${field.key}-${segment.key}-${segmentIndex}`}
                              bare
                              type="text"
                              inputMode={segment.isCounter ? "numeric" : undefined}
                              value={row[segment.key] ?? (segment.isCounter ? StickerFactory.previewCounterValue(field, lotStart) : "")}
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
      </section>
    );
  }
}

class StickerPage extends Component<{ items: StickerItem[]; layout: "frame" | "customerName"; preview?: boolean }> {
  render() {
    const { items, layout, preview = false } = this.props;
    return (
      <section className={`sticker-page ${layout === "frame" ? "sticker-page-frame" : "sticker-page-customer"} ${preview ? "sticker-page-preview" : ""}`}>
        {items.map((item, index) => (
          <StickerLabel item={item} key={`${item.kind}-${item.lot}-${item.pallet}-${item.side}-${index}`} style={stickerLabelStyle(item)} />
        ))}
      </section>
    );
  }
}

class StickerLabel extends Component<{ item: StickerItem; style?: CSSProperties }> {
  render() {
    const { item, style } = this.props;
    return (
      <article className={`sticker-label ${item.kind}`} style={style}>
        {item.kind === "customerName" ? (
          <p>{item.customerName}</p>
        ) : (
          <>
            {item.stickerType === "FCS" && (
              <Image className="sticker-fcs-logo" src="/favicon.ico" alt="FCS logo mockup" width={64} height={64} unoptimized />
            )}
            <dl className="sticker-details">
              {item.details.map((detail) => (
                <AutoFitStickerRow
                  detail={detail}
                  key={`${detail.label}-${detail.values.map((value) => value.value).join("-")}`}
                />
              ))}
            </dl>
          </>
        )}
      </article>
    );
  }
}
