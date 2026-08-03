"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import Navbar from "@/app/components/Navbar";
import type { MarkingContent, MarkingHistoryItem } from "@/app/types/marking";

type ApiEnvelope<T> = { data?: T; message?: string };

function formatDateTime(value: string) {
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

function actionLabel(actionType: MarkingHistoryItem["actionType"]) {
  if (actionType === "print") return "Print/PDF";
  if (actionType === "save") return "Save";
  return "ข้อมูลเก่า";
}

function detailText(row: MarkingHistoryItem) {
  const parts = [
    row.productionDate && `Production ${row.productionDate}`,
    row.lotStart && row.lotEnd && `LOT ${row.lotStart}-${row.lotEnd}`,
    row.stickerFormat && `Format ${row.stickerFormat}`,
    row.stickerType && `Type ${row.stickerType}`,
    row.stickerOther && row.stickerOther,
  ].filter(Boolean);
  return parts.join(" / ") || "-";
}

function renderContentRows(title: string, rows: MarkingContent[]) {
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

export default function HistoryPage() {
  const [items, setItems] = useState<MarkingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [date, setDate] = useState("");
  const [openId, setOpenId] = useState<string | number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/markings?limit=200")
      .then(async (response) => {
        const body = (await response.json()) as ApiEnvelope<MarkingHistoryItem[]>;
        if (!response.ok) throw new Error(body.message ?? "โหลด history ไม่สำเร็จ");
        return body.data ?? [];
      })
      .then((data) => {
        if (!active) return;
        setItems(data);
        setNotice("");
      })
      .catch((error) => {
        if (!active) return;
        setNotice(error instanceof Error ? error.message : "โหลด history ไม่สำเร็จ");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesAction = action === "all" || item.actionType === action;
      const matchesDate = !date || item.productionDate === date || item.createdDate.startsWith(date);
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
  }, [action, date, items, query]);

  return (
    <>
      <Navbar
        badge="TBH"
        title="History"
        subtitle="ตรวจสอบรายการที่บันทึกและ Print/PDF"
        action={<div className="header-actions"><Link className="back-link" href="/">กลับหน้าหลัก</Link></div>}
      />
      <main className="history-wrap">
        {notice && <div className="form-notice error">{notice}</div>}

        <section className="panel history-filter">
          <label className="field">
            <span>ค้นหา</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่อผู้บันทึก, สาขา, ลูกค้า, LOT" />
          </label>
          <label className="field">
            <span>Action</span>
            <select value={action} onChange={(event) => setAction(event.target.value)}>
              <option value="all">ทั้งหมด</option>
              <option value="print">Print/PDF</option>
              <option value="save">Save</option>
              <option value="unknown">ข้อมูลเก่า</option>
            </select>
          </label>
          <label className="field">
            <span>วันที่</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
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

          {isLoading ? (
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
                    const isOpen = openId === item.id;
                    return (
                      <Fragment key={item.id}>
                        <tr>
                          <td>{formatDateTime(item.createdDate)}</td>
                          <td>{item.employeeName || "-"}</td>
                          <td>{item.employeeLocation || "-"}</td>
                          <td>{item.customerName || `Customer #${item.customerId}`}</td>
                          <td><span className={`history-badge ${item.actionType}`}>{actionLabel(item.actionType)}</span></td>
                          <td>{detailText(item)}</td>
                          <td>
                            <button className="history-toggle" onClick={() => setOpenId(isOpen ? null : item.id)}>
                              {isOpen ? "ซ่อน" : "ดู"}
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={7}>
                              <div className="history-details">
                                {renderContentRows("Inside", item.inside)}
                                {renderContentRows("Outside", item.outside)}
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
