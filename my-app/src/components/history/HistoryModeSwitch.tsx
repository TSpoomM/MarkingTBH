"use client";

import { Component } from "react";
import Button from "../ui/Button";
import cn from "@/src/core/ui/cn";
import type { HistoryModeSwitchProps } from "@/src/core/models/history";

const SWITCH_BTN =
  "min-h-[38px] min-w-[112px] cursor-pointer rounded-[7px] border border-transparent bg-transparent text-sm font-extrabold text-[#52645c]";
const SWITCH_BTN_ACTIVE = "border-primary-dark bg-primary-dark text-white hover:border-primary-dark hover:bg-primary-dark hover:text-white";

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
          className={cn(SWITCH_BTN, mode === "logs" && SWITCH_BTN_ACTIVE)}
          onClick={() => onChangeMode("logs")}
        >
          Logs
        </Button>
        <Button
          type="button"
          className={cn(SWITCH_BTN, mode === "templates" && SWITCH_BTN_ACTIVE)}
          onClick={() => onChangeMode("templates")}
        >
          Templates
        </Button>
      </section>
    );
  }
}
