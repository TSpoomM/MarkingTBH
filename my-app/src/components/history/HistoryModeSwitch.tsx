"use client";

import { Component } from "react";
import Button from "../ui/Button";
import cn from "@/src/core/ui/cn";
import type { HistoryModeSwitchProps } from "@/src/core/models/history";

/** Active/inactive are mutually exclusive on purpose - see the same !important cascade-order
 * pitfall fixed in core/ui/calendar.ts (CAL_DAY_SELECTED vs CAL_DAY_DEFAULT). */
const SWITCH_BTN = "!min-h-[38px] !min-w-[112px] cursor-pointer !rounded-[7px] text-sm font-extrabold";
const SWITCH_BTN_INACTIVE = "!border-transparent !bg-transparent !text-[#52645c] hover:!bg-[#f2f8f5] hover:!text-primary-dark";
const SWITCH_BTN_ACTIVE = "!border-primary-dark !bg-primary-dark !text-white hover:!border-primary-dark hover:!bg-primary-dark hover:!text-white";

export default class HistoryModeSwitch extends Component<HistoryModeSwitchProps> {
  render() {
    const { mode, onChangeMode } = this.props;
    return (
      <section
        aria-label="เลือกโหมดประวัติ"
        className="inline-flex w-fit rounded-lg border border-[#c8d8d0] bg-white p-1 shadow-[0_8px_20px_rgba(23,35,31,.05)]"
      >
        <Button
          type="button"
          className={cn(SWITCH_BTN, mode === "logs" ? SWITCH_BTN_ACTIVE : SWITCH_BTN_INACTIVE)}
          onClick={() => onChangeMode("logs")}
        >
          Print
        </Button>
        <Button
          type="button"
          className={cn(SWITCH_BTN, mode === "templates" ? SWITCH_BTN_ACTIVE : SWITCH_BTN_INACTIVE)}
          onClick={() => onChangeMode("templates")}
        >
          Templates
        </Button>
      </section>
    );
  }
}
