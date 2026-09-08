"use client";

import { Component, type ChangeEvent } from "react";
import Autocomplete from "@/src/components/ui/Autocomplete";
import Button from "@/src/components/ui/Button";
import CalendarInput from "@/src/components/ui/CalendarInput";
import Select from "@/src/components/ui/Select";
import cn from "@/src/core/ui/cn";
import { PANEL } from "@/src/core/ui/surfaces";
import type { HistoryFilterPanelProps, HistoryPageState } from "@/src/core/models/history";

const FILTER_GRID =
  "relative z-[4] grid items-end gap-3.5 p-[18px] " +
  "grid-cols-[minmax(180px,.75fr)_minmax(220px,1.1fr)_minmax(220px,1.1fr)_minmax(150px,.7fr)_minmax(160px,.7fr)_auto] " +
  "max-bp1100:grid-cols-2 max-bp700:grid-cols-1";

export default class HistoryFilterPanel extends Component<HistoryFilterPanelProps> {
  render() {
    const {
      templateOptions, employeeOptions, templateQuery, employeeQuery, action, date, activeFilterCount,
      onTemplateQueryChange, onEmployeeQueryChange, onActionChange, onDateChange, onClearFilters,
    } = this.props;

    return (
      <section className={cn(PANEL, FILTER_GRID)}>
        <div className="grid min-h-[76px] content-center gap-[5px] self-center pr-2 max-bp1100:col-span-full max-bp1100:min-h-0">
          <strong className="text-lg font-extrabold leading-tight text-[#10231d]">ค้นหารายการ</strong>
          <span className="text-[14px] font-semibold leading-[1.35] text-[#61736b]">
            กรองจากTemplate ผู้บันทึก การทำรายการ หรือวันที่
          </span>
        </div>
        <Autocomplete
          size="lg"
          label="Template"
          options={templateOptions}
          value={templateQuery}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onTemplateQueryChange(event.target.value)}
          placeholder="พิมพ์เพื่อเลือกTemplate"
        />
        <Autocomplete
          size="lg"
          label="ผู้บันทึก"
          options={employeeOptions}
          value={employeeQuery}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onEmployeeQueryChange(event.target.value)}
          placeholder="พิมพ์เพื่อเลือกผู้บันทึก"
        />
        <Select
          size="lg"
          label="การทำรายการ"
          value={action}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onActionChange(event.target.value as HistoryPageState["action"])}
        >
          <option value="all">ทั้งหมด</option>
          <option value="print">พิมพ์/PDF</option>
          <option value="save">บันทึก</option>
          <option value="unknown">ข้อมูลเก่า</option>
        </Select>
        <CalendarInput
          size="lg"
          label="วันที่"
          value={date}
          onChange={onDateChange}
        />
        <div className="grid grid-rows-[auto_52px_minmax(17px,auto)] self-stretch max-bp1100:col-span-full max-bp1100:justify-end max-bp700:justify-stretch">
          <Button
            type="button"
            className="row-start-2 h-[52px] min-h-[52px] rounded-lg border border-[#c5d6cf] bg-[#f7faf8] px-4 text-sm whitespace-nowrap text-[#315446] max-bp700:w-full"
            onClick={onClearFilters}
            disabled={activeFilterCount === 0}
          >
            ล้าง Filter
          </Button>
        </div>
      </section>
    );
  }
}
