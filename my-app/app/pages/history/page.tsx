"use client";

import Link from "next/link";
import { Component, Fragment, type ChangeEvent } from "react";
import Navbar from "@/app/components/Navbar";
import Toast from "@/app/components/Toast";
import type { MarkingContent, MarkingHistoryItem } from "@/app/types/marking";
import type { ApiEnvelope } from "@/app/types/api";
import type { HistoryPageState } from "@/app/types/history";

export default class HistoryPage extends Component<Record<string, never>, HistoryPageState> {
  private isActive = false;

  state: HistoryPageState = {
    items: [],
    isLoading: true,
    notice: "",
    query: "",
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

  private setQuery = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ query: event.target.value });
  };

  private setAction = (event: ChangeEvent<HTMLSelectElement>) => {
    this.setState({ action: event.target.value as HistoryPageState["action"] });
  };

  private setDate = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ date: event.target.value });
  };

  private toggleOpen = (id: string | number) => {
    this.setState((current) => ({ openId: current.openId === id ? null : id }));
  };

  private dismissNotice = () => {
    this.setState({ notice: "" });
  };

  private filteredItems() {
    const normalizedQuery = this.state.query.trim().toLowerCase();
    return this.state.items.filter((item) => {
      const matchesAction = this.state.action === "all" || item.actionType === this.state.action;
      const matchesDate = !this.state.date || item.productionDate === this.state.date || item.createdDate.startsWith(this.state.date);
      const haystack = [
        item.employeeName,
        item.employeeId,
        item.employeeLocation,
        item.customerName,
        item.productionDate,
        item.lotStart,
        item.lotEnd,
        item.stickerFormat,
        item.stickerType,
        item.stickerOther,
      ].join(" ").toLowerCase();
      return matchesAction && matchesDate && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
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
    if (actionType === "print") return "Print/PDF";
    if (actionType === "save") return "Save";
    return "ข้อมูลเก่า";
  }

  private detailText(row: MarkingHistoryItem) {
    const parts = [
      row.productionDate && `Production ${row.productionDate}`,
      row.lotStart && row.lotEnd && `LOT ${row.lotStart}-${row.lotEnd}`,
      row.stickerFormat && `Format ${row.stickerFormat}`,
      row.stickerType && `Type ${row.stickerType}`,
      row.stickerOther && row.stickerOther,
    ].filter(Boolean);
    return parts.join(" / ") || "-";
  }

  private renderContentRows(title: string, rows: MarkingContent[]) {
    const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
      .filter((key) => key !== "action_type")
      .slice(0, 10);

    return (
      <div className="history-detail-block">
        <h3>{title}</h3>
        {rows.length === 0 || keys.length === 0 ? (
          <p>ไม่มีข้อมูล</p>
        ) : (
          <div className="history-detail-table-wrap">
            <table className="history-detail-table">
              <thead>
                <tr>{keys.map((key) => <th key={key}>{key}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    {keys.map((key) => <td key={key}>{row[key] || "-"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  render() {
    const filteredItems = this.filteredItems();

    return (
      <>
        <Navbar
          badge="TBH"
          title="History"
          subtitle="ตรวจสอบรายการที่บันทึกและ Print/PDF"
          action={<div className="header-actions"><Link className="back-link" href="/">กลับหน้าหลัก</Link></div>}
        />
        <main className="history-wrap">
          {this.state.notice && <Toast type="error" message={this.state.notice} onClose={this.dismissNotice} />}

          <section className="panel history-filter">
            <label className="field">
              <span>ค้นหา</span>
              <input value={this.state.query} onChange={this.setQuery} placeholder="ชื่อผู้บันทึก, สาขา, ลูกค้า, LOT" />
            </label>
            <label className="field">
              <span>Action</span>
              <select value={this.state.action} onChange={this.setAction}>
                <option value="all">ทั้งหมด</option>
                <option value="print">Print/PDF</option>
                <option value="save">Save</option>
                <option value="unknown">ข้อมูลเก่า</option>
              </select>
            </label>
            <label className="field">
              <span>วันที่</span>
              <input type="date" value={this.state.date} onChange={this.setDate} />
            </label>
          </section>

          <section className="panel history-panel">
            <div className="table-heading">
              <div className="section-title">
                <div>
                  <span>{filteredItems.length}</span>
                  <div>
                    <h2>Marking history</h2>
                    <p>รายการล่าสุดจาก log_marking</p>
                  </div>
                </div>
              </div>
            </div>

            {this.state.isLoading ? (
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
                      <th>Action</th>
                      <th>รายละเอียด</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const isOpen = this.state.openId === item.id;
                      return (
                        <Fragment key={item.id}>
                          <tr>
                            <td>{this.formatDateTime(item.createdDate)}</td>
                            <td>{item.employeeName || "-"}</td>
                            <td>{item.employeeLocation || "-"}</td>
                            <td>{item.customerName || `Customer #${item.customerId}`}</td>
                            <td><span className={`history-badge ${item.actionType}`}>{this.actionLabel(item.actionType)}</span></td>
                            <td>{this.detailText(item)}</td>
                            <td>
                              <button className="history-toggle" onClick={() => this.toggleOpen(item.id)}>
                                {isOpen ? "ซ่อน" : "ดู"}
                              </button>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr>
                              <td colSpan={7}>
                                <div className="history-details">
                                  {this.renderContentRows("Inside", item.inside)}
                                  {this.renderContentRows("Outside", item.outside)}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </>
    );
  }
}
