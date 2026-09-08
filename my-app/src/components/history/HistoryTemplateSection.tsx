"use client";

import { Component } from "react";
import HistoryFormatter from "@/src/core/history/historyFormatter";
import type { HistoryTemplateSectionProps } from "@/src/core/models/history";
import { HISTORY_BOX_TITLE, HISTORY_TEMPLATE_CARD, HISTORY_TEMPLATE_GRID } from "@/src/core/ui/history";
import cn from "@/src/core/ui/cn";

export default class HistoryTemplateSection extends Component<HistoryTemplateSectionProps> {
  render() {
    const { title, rows, fieldMeta = {} } = this.props;
    const filledRows = rows
      .map((row, index) => ({ index, entries: HistoryFormatter.filledEntries(row, fieldMeta) }))
      .filter((row) => row.entries.length > 0);

    return (
      <section className={cn("grid gap-3", HISTORY_BOX_TITLE)}>
        <h3>{title}</h3>
        {filledRows.length === 0 ? (
          <p>ไม่มีข้อมูลที่กรอก</p>
        ) : (
          <div className={HISTORY_TEMPLATE_GRID}>
            {filledRows.map((row) => (
              <article className={HISTORY_TEMPLATE_CARD} key={`${title}-${row.index}`}>
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
