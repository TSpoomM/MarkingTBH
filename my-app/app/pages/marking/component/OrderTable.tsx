"use client";

import MarkingComponent from "./MarkingComponent";
import StickerFactory from "./StickerFactory";
import StickerPage from "./StickerPage";
import TableSection from "./TableSection";

export default class OrderTable extends MarkingComponent {
  render() {
    const customer = this.state.customers.find(
      (item) => String(item.id) === this.state.customerId,
    );
    const outsideFields = (this.state.template?.outside ?? []).filter((field) =>
      StickerFactory.matchesCondition(field, this.state.stickerType, this.state.stickerOther),
    );
    const outsideGroups = StickerFactory.outsideGroups(outsideFields);
    const customerName = this.state.printSections.customerName
      ? this.state.template?.customerName ?? customer?.name ?? ""
      : "";
    const stickerItems = StickerFactory.build({
      customerName,
      format: this.state.stickerFormat,
      sideCount: Number(this.state.stickerSides || 0),
      lotCount: Number(this.state.lotCount || 1),
      lotStart: this.state.lotStart,
      productionDate: this.state.productionDate,
      stickerType: this.state.stickerType,
      stickerFsc: this.state.stickerFsc,
      layouts: this.state.template?.sticker.layouts,
      insideFields: this.state.template?.inside ?? [],
      outsideFields,
      insideRow: this.state.insideRows[0],
      outsideRow: this.state.outsideRows[0],
    });
    const insideStickerPages = StickerFactory.chunk(
      stickerItems.filter((item) => item.kind === "insideFrame"),
      4,
    );
    const outsideStickerItems = outsideGroups.flatMap((group) =>
      stickerItems.filter((item) => item.kind === "outsideFrame" && item.group === group.name),
    );
    const outsideStickerPages = StickerFactory.chunk(outsideStickerItems, 4);
    const frameStickerPages = [
      ...(this.state.printSections.insideFrame ? insideStickerPages : []),
      ...(this.state.printSections.outsideFrame ? outsideStickerPages : []),
    ];
    const customerNameStickerPages = StickerFactory.chunk(
      stickerItems.filter((item) => item.kind === "customerName"),
      16,
    );
    const fscLogoStickerPages = this.state.printSections.fscLogo
      ? StickerFactory.chunk(stickerItems.filter((item) => item.kind === "fscLogo"), 4)
      : [];
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
              title="ในกรอบ"
              subtitle="กรอกข้อมูลสำหรับสติ๊กเกอร์ในกรอบ"
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
                number={String(groupIndex + 3)}
                title={`${StickerFactory.outsideGroupTitle(group.name)}`}
                subtitle={`กรอกข้อมูลสำหรับลูกค้า ${customer?.name ?? "ที่เลือก"}`}
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
                subtitle={`กรอกข้อมูลสำหรับลูกค้า ${customer?.name ?? "ที่เลือก"}`}
                fields={[]}
                rows={[]}
                lotStart={this.state.lotStart}
                onChange={(row, key, value) => this.actions.updateRow("outside", row, key, value)}
                emptyText="ลูกค้ารายนี้ยังไม่ได้ตั้งค่าสติ๊กเกอร์นอกกรอบ"
              />
            )}
          </div>
        </div>

        <div className="print-sheet">
          {frameStickerPages.map((page, index) => (
            <StickerPage items={page} key={`frame-${index}`} layout="frame" />
          ))}
          {customerNameStickerPages.map((page, index) => (
            <StickerPage items={page} key={`customer-${index}`} layout="customerName" />
          ))}
          {fscLogoStickerPages.map((page, index) => (
            <StickerPage items={page} key={`fsc-${index}`} layout="fsc" />
          ))}
        </div>

      </>
    );
  }
}
