import { Component } from "react";
import SectionTitle from "@/src/components/ui/SectionTitle";
import { TABLE_HEADING_FLUSH } from "@/src/core/ui/surfaces";
import type { HistoryPanelHeadingProps } from "@/src/core/models/history";

/** History panel heading; HistoryLogsPanel and HistoryTemplatesPanel used to duplicate this markup */
export default class HistoryPanelHeading extends Component<HistoryPanelHeadingProps> {
  render() {
    const { title, subtitle, visibleCount } = this.props;
    return (
      <div className={TABLE_HEADING_FLUSH}>
        <SectionTitle number={visibleCount} title={title} subtitle={subtitle} compact />
        <div className="ml-auto grid justify-items-end gap-[3px] text-right">
          <span className="text-xs font-extrabold leading-tight text-[#61736b]">รายการทั้งหมด</span>
          <strong className="text-[30px] font-black leading-none text-[#10231d]">{visibleCount}</strong>
        </div>
      </div>
    );
  }
}
