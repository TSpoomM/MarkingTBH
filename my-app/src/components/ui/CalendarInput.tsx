"use client";

import { Component, createRef } from "react";
import DateFormatter, { MONTH_ABBREVIATIONS } from "@/src/core/dates/dateFormatter";
import type { DateFormat } from "@/src/core/models/template";
import type { ControlSize } from "@/src/core/ui/fields";
import Field from "./Field";
import cn from "@/src/core/ui/cn";
import {
  CAL_ACTION, CAL_ACTIONS, CAL_BTN, CAL_DAY, CAL_DAYS, CAL_DAY_EMPTY, CAL_DAY_SELECTED, CAL_DAY_TODAY,
  CAL_DISPLAY, CAL_DISPLAY_DISABLED, CAL_DISPLAY_PLACEHOLDER, CAL_DISPLAY_SIZE, CAL_GRID, CAL_HEAD,
  CAL_ICON, CAL_NAV,
  CAL_POPOVER, CAL_POPOVER_UP, CAL_SHELL, CAL_WEEKDAY, CAL_WEEKDAYS,
} from "@/src/core/ui/calendar";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";


interface CalendarInputProps {
  value: string;
  dateFormat?: DateFormat;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  hint?: string;
  required?: boolean;
  size?: ControlSize;
  /** Applied to the wrapper, for context-specific spacing such as the vertical table on the marking page */
  className?: string;
  displayVariant?: "calendar" | "input";
  displayClassName?: string;
}

interface CalendarInputState {
  open: boolean;
  openUpward: boolean;
  viewYear: number;
  viewMonth: number;
}

const POPOVER_HEIGHT_ESTIMATE = 420;

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default class CalendarInput extends Component<CalendarInputProps, CalendarInputState> {
  private shellRef = createRef<HTMLSpanElement>();

  constructor(props: CalendarInputProps) {
    super(props);
    const current = this.currentDate();
    this.state = {
      open: false,
      openUpward: false,
      viewYear: current.year,
      viewMonth: current.month,
    };
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.handleDocumentMouseDown);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleDocumentMouseDown);
  }

  componentDidUpdate(previousProps: CalendarInputProps) {
    if (previousProps.value === this.props.value) return;
    const current = this.currentDate();
    this.setState({ viewYear: current.year, viewMonth: current.month });
  }

  private toggleOpen = () => {
    if (this.state.open) {
      this.setState({ open: false });
      return;
    }
    const shell = this.shellRef.current;
    let openUpward = false;
    if (shell) {
      const rect = shell.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      openUpward = spaceBelow < POPOVER_HEIGHT_ESTIMATE && spaceAbove > spaceBelow;
    }
    this.setState({ open: true, openUpward });
  };

  private handleDocumentMouseDown = (event: MouseEvent) => {
    if (!this.state.open) return;
    const shell = this.shellRef.current;
    if (shell && event.target instanceof Node && shell.contains(event.target)) return;
    this.setState({ open: false });
  };

  private currentDate() {
    const dateValue = DateFormatter.toDateInputValue(this.props.value, this.props.dateFormat);
    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const today = new Date();
    if (!match) return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
    return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) };
  }

  private selectedIsoValue() {
    return DateFormatter.toDateInputValue(this.props.value, this.props.dateFormat);
  }

  private isoValue(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  private daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  private moveMonth(offset: number) {
    const next = new Date(this.state.viewYear, this.state.viewMonth + offset, 1);
    this.setState({ viewYear: next.getFullYear(), viewMonth: next.getMonth() });
  }

  private selectDate(day: number) {
    const value = this.isoValue(this.state.viewYear, this.state.viewMonth, day);
    this.props.onChange(DateFormatter.formatDateInputValue(value, this.props.dateFormat));
    this.setState({ open: false });
  }

  private selectToday() {
    const today = new Date();
    const value = this.isoValue(today.getFullYear(), today.getMonth(), today.getDate());
    this.props.onChange(DateFormatter.formatDateInputValue(value, this.props.dateFormat));
    this.setState({ open: false, viewYear: today.getFullYear(), viewMonth: today.getMonth() });
  }

  private clearDate() {
    this.props.onChange("");
    this.setState({ open: false });
  }

  private renderDays() {
    const { viewYear, viewMonth } = this.state;
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const days = this.daysInMonth(viewYear, viewMonth);
    const selectedValue = this.selectedIsoValue();
    const today = new Date();
    const todayValue = this.isoValue(today.getFullYear(), today.getMonth(), today.getDate());
    const cells = Array.from({ length: 42 }, (_, index) => {
      const day = index - firstDay + 1;
      return day > 0 && day <= days ? day : 0;
    });

    return cells.map((day, index) => {
      if (!day) return <span className={cn(CAL_BTN, CAL_DAY, CAL_DAY_EMPTY)} key={`empty-${index}`} />;
      const value = this.isoValue(viewYear, viewMonth, day);
      return (
        <Button
          variant="ghost"
          type="button"
          className={cn(
            CAL_BTN,
            CAL_DAY,
            value === todayValue && CAL_DAY_TODAY,
            value === selectedValue && CAL_DAY_SELECTED,
          )}
          onClick={() => this.selectDate(day)}
          key={value}
        >
          {day}
        </Button>
      );
    });
  }

  render() {
    const {
      value, disabled, placeholder, label, hint, required, size = "md", className = "",
      displayVariant = "calendar", displayClassName = "",
    } = this.props;
    const displayClasses = displayVariant === "input"
      ? displayClassName
      : cn(CAL_DISPLAY, CAL_DISPLAY_SIZE[size], !value && CAL_DISPLAY_PLACEHOLDER, disabled && CAL_DISPLAY_DISABLED, displayClassName);
    const control = (
      <span className={cn("group/cal", CAL_SHELL, className)} ref={this.shellRef}>
        <button
          className={displayClasses}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={this.state.open}
          onClick={this.toggleOpen}
        >
          <span>{value || placeholder || "เลือกวันที่"}</span>
        </button>
        <CalendarDays className={CAL_ICON} size={20} aria-hidden="true" />
        {this.state.open && (
          <div
            className={cn(CAL_POPOVER, this.state.openUpward && CAL_POPOVER_UP)}
            role="dialog"
            aria-label={placeholder ?? "เลือกวันที่"}
          >
            <div className={CAL_HEAD}>
              <Button type="button" variant="ghost" wrapContent={false} className={cn(CAL_BTN, CAL_NAV)} onClick={() => this.moveMonth(-1)} aria-label="เดือนก่อนหน้า"><ChevronLeft size={20} /></Button>
              <strong className="text-center">{MONTH_ABBREVIATIONS[this.state.viewMonth]} {this.state.viewYear}</strong>
              <Button type="button" variant="ghost" wrapContent={false} className={cn(CAL_BTN, CAL_NAV)} onClick={() => this.moveMonth(1)} aria-label="เดือนถัดไป"><ChevronRight size={20} /></Button>
            </div>
            <div className={cn(CAL_GRID, CAL_WEEKDAYS)}>
              {WEEKDAYS.map((day) => <span className={CAL_WEEKDAY} key={day}>{day}</span>)}
            </div>
            <div className={cn(CAL_GRID, CAL_DAYS)}>
              {this.renderDays()}
            </div>
            <div className={CAL_ACTIONS}>
              <Button type="button" variant="ghost" className={cn(CAL_BTN, CAL_ACTION)} onClick={() => this.clearDate()}>ล้าง</Button>
              <Button type="button" variant="ghost" className={cn(CAL_BTN, CAL_ACTION)} onClick={() => this.selectToday()}>วันนี้</Button>
            </div>
          </div>
        )}
      </span>
    );
    return <Field label={label} hint={hint} required={required} size={size}>{control}</Field>;
  }
}
