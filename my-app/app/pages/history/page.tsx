"use client";

import { Component, type ChangeEvent } from "react";
import Autocomplete from "@/app/components/Autocomplete";
import Button from "@/app/components/Button";
import Input from "@/app/components/Input";
import Modal from "@/app/components/Modal";
import Navbar from "@/app/components/Navbar";
import Select from "@/app/components/Select";
import Toast from "@/app/components/Toast";
import type { ApiEnvelope } from "@/app/types/api";
import type { HistoryPageState, TemplateHistoryItem } from "@/app/types/history";
import type { MarkingContent, MarkingHistoryFieldMeta, MarkingHistoryItem } from "@/app/types/marking";

export default class HistoryPage extends Component<Record<string, never>, HistoryPageState> {
  private isActive = false;

  state: HistoryPageState = {
    mode: "logs",
    items: [],
    templateItems: [],
    isLoading: true,
    isTemplateLoading: false,
    notice: "",
    templateQuery: "",
    employeeQuery: "",
    action: "all",
    date: "",
    openId: null,
  };

  componentDidMount() {
    this.isActive = true;
    void this.loadHistory();
  }

  componentWillUnmount() {
    this.isActive = false;
  }

  private async loadHistory() {
    this.setState({ isLoading: true });
    try {
      const response = await fetch("/api/markings?limit=200");
      const body = (await response.json()) as ApiEnvelope<MarkingHistoryItem[]>;
      if (!response.ok) throw new Error(body.message ?? "โหลด history ไม่สำเร็จ");
      if (!this.isActive) return;
      this.setState({ items: body.data ?? [], notice: "" });
    } catch (error) {
      if (!this.isActive) return;
      this.setState({
        notice: error instanceof Error ? error.message : "โหลด history ไม่สำเร็จ",
      });
    } finally {
      if (this.isActive) this.setState({ isLoading: false });
    }
  }

  private async loadTemplateHistory() {
    this.setState({ isTemplateLoading: true });
    try {
      const response = await fetch("/api/templates?history=1");
      const body = (await response.json()) as ApiEnvelope<TemplateHistoryItem[]>;
      if (!response.ok) throw new Error(body.message ?? "โหลดประวัติ Template ไม่สำเร็จ");
      if (!this.isActive) return;
      this.setState({ templateItems: body.data ?? [], notice: "" });
    } catch (error) {
      if (!this.isActive) return;
      this.setState({
        notice: error instanceof Error ? error.message : "โหลดประวัติ Template ไม่สำเร็จ",
      });
    } finally {
      if (this.isActive) this.setState({ isTemplateLoading: false });
    }
  }

  private setMode = (mode: HistoryPageState["mode"]) => {
    this.setState({ mode, openId: null });
    if (mode === "templates" && !this.state.templateItems.length && !this.state.isTemplateLoading) {
      void this.loadTemplateHistory();
    }
  };

  private setTemplateQuery = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ templateQuery: event.target.value });
  };

  private setEmployeeQuery = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ employeeQuery: event.target.value });
  };

  private setAction = (event: ChangeEvent<HTMLSelectElement>) => {
    this.setState({ action: event.target.value as HistoryPageState["action"] });
  };

  private setDate = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ date: event.target.value });
  };

  private clearFilters = () => {
    this.setState({
      templateQuery: "",
      employeeQuery: "",
      action: "all",
      date: "",
      openId: null,
    });
  };

  private openDetail = (id: string | number) => {
    this.setState({ openId: id });
  };

  private closeDetail = () => {
    this.setState({ openId: null });
  };

  private dismissNotice = () => {
    this.setState({ notice: "" });
  };

  private filteredItems() {
    const normalizedTemplate = this.state.templateQuery.trim().toLowerCase();
    const normalizedEmployee = this.state.employeeQuery.trim().toLowerCase();
    return this.state.items.filter((item) => {
      const matchesAction = this.state.action === "all" || item.actionType === this.state.action;
      const matchesDate = !this.state.date || item.productionDate === this.state.date || item.createdDate.startsWith(this.state.date);
      const matchesTemplate = !normalizedTemplate || (item.customerName || "").toLowerCase().includes(normalizedTemplate);
      const matchesEmployee = !normalizedEmployee || (item.employeeName || "").toLowerCase().includes(normalizedEmployee);
      return matchesAction && matchesDate && matchesTemplate && matchesEmployee;
    });
  }

  private filteredTemplateItems() {
    const normalizedTemplate = this.state.templateQuery.trim().toLowerCase();
    return this.state.templateItems.filter((item) => {
      const matchesTemplate = !normalizedTemplate || item.name.toLowerCase().includes(normalizedTemplate);
      const matchesDate = !this.state.date || item.createdAt.startsWith(this.state.date) || item.updatedAt.startsWith(this.state.date);
      return matchesTemplate && matchesDate;
    });
  }

  private uniqueValues(pick: (item: MarkingHistoryItem) => string) {
    return Array.from(new Set(this.state.items.map(pick).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "th")
    );
  }

  private uniqueTemplateValues() {
    return Array.from(new Set(this.state.templateItems.map((item) => item.name).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "th")
    );
  }

  private formatDateTime(value: string) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private actionLabel(actionType: MarkingHistoryItem["actionType"]) {
    if (actionType === "print") return "พิมพ์/PDF";
    if (actionType === "save") return "บันทึก";
    return "ข้อมูลเก่า";
  }

  private detailText(row: MarkingHistoryItem) {
    const parts = [
      row.productionDate && `Production ${row.productionDate}`,
      row.lotStart && row.lotEnd && `LOT ${row.lotStart}-${row.lotEnd}`,
      row.stickerFormat && `Format ${row.stickerFormat}`,
      row.stickerType && `เกรด ${row.stickerType}`,
      row.stickerOther && row.stickerOther,
    ].filter(Boolean);
    return parts.join(" / ") || "-";
  }

  private isStickerDetailKey(key: string) {
    return new Set([
      "action_type",
      "production_date",
      "lot_start",
      "lot_end",
      "lot_count",
      "sticker_format",
      "sticker_type",
      "sticker_fsc",
      "sticker_other",
      "total_lot",
      "sticker_sides",
    ]).has(key);
  }

  private legacyCombinedSectionEntry(key: string, row: MarkingContent) {
    const match = key.match(/^(lotNo|palletNo)_(\d+)$/i);
    if (!match) return undefined;
    const prefix = match[1];
    const label = prefix.toLowerCase() === "palletno" ? "PALLET NO." : "LOT NO.";
    const values = Object.entries(row)
      .filter(([itemKey, value]) => (
        new RegExp(`^${prefix}_\\d+$`, "i").test(itemKey) &&
        String(value ?? "").trim() !== ""
      ))
      .sort(([left], [right]) => {
        const leftIndex = Number(left.split("_").pop() ?? 0);
        const rightIndex = Number(right.split("_").pop() ?? 0);
        return leftIndex - rightIndex;
      })
      .map(([, value]) => String(value).trim());
    return values.length ? [label, values.join(" ")] as const : undefined;
  }

  private segmentGroupKey(key: string) {
    const legacyMatch = key.match(/^(lotNo|palletNo)_\d+$/i);
    if (legacyMatch) return legacyMatch[1];
    const generatedMatch = key.match(/^(.+)_\d{10,}_[a-z0-9]{6}$/i);
    if (generatedMatch) return generatedMatch[1];
    const match = key.match(/^(.+)_(?:section_\d+|\d+)$/i);
    return match?.[1];
  }

  private segmentGroupLabel(groupKey: string, keys: string[]) {
    const legacyLabel = this.legacyCombinedSectionEntry(keys[0], Object.fromEntries(keys.map((key) => [key, key])))?.[0];
    return legacyLabel ?? groupKey;
  }

  private entryGroupKey(
    key: string,
    filledKeys: string[],
    fieldMeta: Record<string, MarkingHistoryFieldMeta>,
  ) {
    if (fieldMeta[key]) return fieldMeta[key].parentKey;
    const generatedGroupKey = this.segmentGroupKey(key);
    if (generatedGroupKey) return generatedGroupKey;
    return filledKeys.some((itemKey) => this.segmentGroupKey(itemKey) === key) ? key : undefined;
  }

  private entryLabel(
    key: string,
    groupKey: string | undefined,
    groupKeys: string[],
    fieldMeta: Record<string, MarkingHistoryFieldMeta>,
  ) {
    if (groupKey) {
      const meta = fieldMeta[groupKey] ?? groupKeys.map((itemKey) => fieldMeta[itemKey]).find(Boolean);
      return meta?.parentLabel ?? this.segmentGroupLabel(groupKey, groupKeys);
    }
    return fieldMeta[key]?.label ?? key;
  }

  private filledEntries(row: MarkingContent, fieldMeta: Record<string, MarkingHistoryFieldMeta> = {}) {
    const filled = Object.entries(row).filter(([key, value]) =>
      !this.isStickerDetailKey(key) && String(value ?? "").trim() !== "",
    );
    const filledKeys = filled.map(([key]) => key);
    const groupCounts = filled.reduce<Record<string, number>>((counts, [key]) => {
      const groupKey = this.entryGroupKey(key, filledKeys, fieldMeta);
      if (!groupKey) return counts;
      return { ...counts, [groupKey]: (counts[groupKey] ?? 0) + 1 };
    }, {});
    const usedGroupKeys = new Set<string>();

    return filled
      .flatMap(([key, value]) => {
        const groupKey = this.entryGroupKey(key, filledKeys, fieldMeta);
        const meta = fieldMeta[key];
        if (!groupKey || (groupCounts[groupKey] < 2 && (!meta || meta.parentKey === key))) {
          return [{ id: key, label: this.entryLabel(key, undefined, [], fieldMeta), value }];
        }
        if (usedGroupKeys.has(groupKey)) return [];
        usedGroupKeys.add(groupKey);
        const groupKeys = filled
          .map(([itemKey]) => itemKey)
          .filter((itemKey) => this.entryGroupKey(itemKey, filledKeys, fieldMeta) === groupKey)
          .sort((left, right) => (fieldMeta[left]?.order ?? 0) - (fieldMeta[right]?.order ?? 0));
        const values = groupKeys.map((itemKey) => String(row[itemKey]).trim()).filter(Boolean);
        return [{ id: groupKey, label: this.entryLabel(key, groupKey, groupKeys, fieldMeta), value: values.join(" ") }];
      })
      .slice(0, 24);
  }

  private renderTemplateSection(
    title: string,
    rows: MarkingContent[],
    fieldMeta: Record<string, MarkingHistoryFieldMeta> = {},
  ) {
    const filledRows = rows
      .map((row, index) => ({ index, entries: this.filledEntries(row, fieldMeta) }))
      .filter((row) => row.entries.length > 0);

    return (
      <section className="history-template-section">
        <h3>{title}</h3>
        {filledRows.length === 0 ? (
          <p>ไม่มีข้อมูลที่กรอก</p>
        ) : (
          <div className="history-template-grid">
            {filledRows.map((row) => (
              <article className="history-template-card" key={`${title}-${row.index}`}>
                <header>
                  <strong>ชุดที่ {row.index + 1}</strong>
                  <span>{row.entries.length} Field</span>
                </header>
                <dl>
                  {row.entries.map((entry) => (
                    <div key={entry.id}>
                      <dt>{entry.label}</dt>
                      <dd>{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  private renderDetailModal(item: MarkingHistoryItem | undefined) {
    return (
      <Modal
        open={!!item}
        title={item?.customerName || "รายละเอียดประวัติ"}
        subtitle={item ? `${this.actionLabel(item.actionType)} · ${this.formatDateTime(item.createdDate)}` : undefined}
        onClose={this.closeDetail}
      >
        {item && (
          <div className="editor-body history-template-modal">
            <section className="history-template-summary">
              <div>
                <span>ผู้บันทึก</span>
                <strong>{item.employeeName || "-"}</strong>
              </div>
              <div>
                <span>สาขา</span>
                <strong>{item.employeeLocation || "-"}</strong>
              </div>
            </section>
            <section className="history-sticker-details">
              <h3>รายละเอียดสติ๊กเกอร์</h3>
              <dl>
                <div>
                  <dt>Production</dt>
                  <dd>{item.productionDate || "-"}</dd>
                </div>
                <div>
                  <dt>LOT</dt>
                  <dd>{item.lotStart && item.lotEnd ? `${item.lotStart}-${item.lotEnd}` : "-"}</dd>
                </div>
                <div>
                  <dt>จำนวน LOT</dt>
                  <dd>{item.lotCount || "-"}</dd>
                </div>
                <div>
                  <dt>จำนวนด้าน</dt>
                  <dd>{item.stickerSides || "-"}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{item.stickerFormat || "-"}</dd>
                </div>
                <div>
                  <dt>เกรด</dt>
                  <dd>{item.stickerType || "-"}</dd>
                </div>
                <div>
                  <dt>FSC</dt>
                  <dd>{item.stickerFsc === undefined ? "-" : item.stickerFsc ? "ใช่" : "ไม่ใช่"}</dd>
                </div>
                <div>
                  <dt>Other</dt>
                  <dd>{item.stickerOther || "-"}</dd>
                </div>
              </dl>
            </section>
            <section className="history-sticker-content">
              <h3>ข้อมูลในสติ๊กเกอร์</h3>
              {this.renderTemplateSection("ในกรอบ", item.inside, item.fieldMeta?.inside)}
              {this.renderTemplateSection("นอกกรอบ", item.outside, item.fieldMeta?.outside)}
            </section>
          </div>
        )}
      </Modal>
    );
  }

  render() {
    const filteredItems = this.filteredItems();
    const filteredTemplateItems = this.filteredTemplateItems();
    const isTemplateMode = this.state.mode === "templates";
    const visibleCount = isTemplateMode ? filteredTemplateItems.length : filteredItems.length;
    const totalCount = isTemplateMode ? this.state.templateItems.length : this.state.items.length;
    const activeFilters = [
      this.state.templateQuery,
      isTemplateMode ? "" : this.state.employeeQuery,
      !isTemplateMode && this.state.action !== "all" ? this.state.action : "",
      this.state.date,
    ].filter(Boolean).length;
    const selectedItem = this.state.openId
      ? this.state.items.find((item) => item.id === this.state.openId)
      : undefined;

    return (
      <>
        <Navbar
          badge="TBH"
          title="ประวัติ"
          subtitle="ตรวจสอบรายการที่บันทึกและพิมพ์/PDF"
          activeNav="history"
        />
        <main className="history-wrap">
          {this.state.notice && <Toast type="error" message={this.state.notice} onClose={this.dismissNotice} />}

          <section className="history-mode-switch" aria-label="เลือกโหมดประวัติ">
            <button
              type="button"
              className={this.state.mode === "logs" ? "active" : ""}
              onClick={() => this.setMode("logs")}
            >
              Logs
            </button>
            <button
              type="button"
              className={this.state.mode === "templates" ? "active" : ""}
              onClick={() => this.setMode("templates")}
            >
              Templates
            </button>
          </section>

          <section className="history-overview history-overview-single" aria-label="สรุปประวัติ">
            <div>
              <span>รายการทั้งหมด</span>
              <strong>{visibleCount}</strong>
              <small>จากทั้งหมด {totalCount} รายการ</small>
            </div>
          </section>

          <section className={`panel history-filter ${isTemplateMode ? "template-history-filter" : ""}`}>
            <div className="history-filter-title">
              <strong>ค้นหารายการ</strong>
              <span>กรองจากTemplate ผู้บันทึก การทำรายการ หรือวันที่</span>
            </div>
            <Autocomplete
              label="Template"
              options={isTemplateMode ? this.uniqueTemplateValues() : this.uniqueValues((item) => item.customerName)}
              value={this.state.templateQuery}
              onChange={this.setTemplateQuery}
              placeholder="พิมพ์เพื่อเลือกTemplate"
            />
            <Autocomplete
              label="ผู้บันทึก"
              options={this.uniqueValues((item) => item.employeeName)}
              value={this.state.employeeQuery}
              onChange={this.setEmployeeQuery}
              placeholder="พิมพ์เพื่อเลือกผู้บันทึก"
            />
            <Select label="การทำรายการ" value={this.state.action} onChange={this.setAction}>
              <option value="all">ทั้งหมด</option>
              <option value="print">พิมพ์/PDF</option>
              <option value="save">บันทึก</option>
              <option value="unknown">ข้อมูลเก่า</option>
            </Select>
            <Input label="วันที่" type="date" value={this.state.date} onChange={this.setDate} />
            <div className="history-filter-actions">
              <Button type="button" className="history-clear" onClick={this.clearFilters} disabled={activeFilters === 0}>
                ล้าง Filter
              </Button>
            </div>
          </section>

          <section className="panel history-panel">
            <div className="table-heading history-heading-with-total">
              <div className="section-title">
                <div>
                  <span>{visibleCount}</span>
                  <div>
                    <h2>ประวัติ Marking</h2>
                    <p>รายการล่าสุด</p>
                  </div>
                </div>
              </div>
              <div className="history-total-inline">
                <span>รายการทั้งหมด</span>
                <strong>{visibleCount}</strong>
                <small>จากทั้งหมด {totalCount} รายการ</small>
              </div>
            </div>

            {isTemplateMode ? (
              this.state.isTemplateLoading ? (
                <div className="history-empty">กำลังโหลด...</div>
              ) : filteredTemplateItems.length === 0 ? (
                <div className="history-empty">ไม่พบรายการ</div>
              ) : (
                <div className="history-table-wrap">
                  <table className="history-table history-template-list">
                    <thead>
                      <tr>
                        <th>Template</th>
                        <th>สร้างเมื่อ</th>
                        <th>แก้ไขล่าสุด</th>
                        <th>ผู้แก้ล่าสุด</th>
                        <th>Fields</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTemplateItems.map((item) => (
                        <tr className="history-row" key={item.id}>
                          <td>{item.name || `Template #${item.id}`}</td>
                          <td>{this.formatDateTime(item.createdAt)}</td>
                          <td>{this.formatDateTime(item.updatedAt)}</td>
                          <td>{item.updatedBy || "-"}</td>
                          <td>
                            <span className="history-field-count">
                              ในกรอบ {item.insideFieldCount} / นอกกรอบ {item.outsideFieldCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : this.state.isLoading ? (
              <div className="history-empty">กำลังโหลด...</div>
            ) : filteredItems.length === 0 ? (
              <div className="history-empty">ไม่พบรายการ</div>
            ) : (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>เวลา</th>
                      <th>ผู้บันทึก</th>
                      <th>สาขา</th>
                      <th>ลูกค้า</th>
                      <th>การทำรายการ</th>
                      <th>รายละเอียด</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr className="history-row" key={item.id}>
                        <td>{this.formatDateTime(item.createdDate)}</td>
                        <td>{item.employeeName || "-"}</td>
                        <td>{item.employeeLocation || "-"}</td>
                        <td>{item.customerName || `Template #${item.templateId}`}</td>
                        <td><span className={`history-badge ${item.actionType}`}>{this.actionLabel(item.actionType)}</span></td>
                        <td>{this.detailText(item)}</td>
                        <td>
                          <Button className="history-toggle" onClick={() => this.openDetail(item.id)}>
                            ดู
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
        {this.renderDetailModal(selectedItem)}
      </>
    );
  }
}
