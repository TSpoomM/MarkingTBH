"use client";

import { Component } from "react";
import HistoryFormatter from "@/src/core/history/historyFormatter";
import type { MarkingContent, MarkingHistoryFieldMeta } from "@/src/core/models/marking";

type Props = Readonly<{
  title: string;
  rows: MarkingContent[];
  fieldMeta?: Record<string, MarkingHistoryFieldMeta>;
}>;

export default class HistoryTemplateSection extends Component<Props> {
  render() {
    const { title, rows, fieldMeta = {} } = this.props;
    const filledRows = rows
      .map((row, index) => ({ index, entries: HistoryFormatter.filledEntries(row, fieldMeta) }))
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
}
