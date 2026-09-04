"use client";

import { Component, createRef } from "react";
import DateFormatter, { MONTH_ABBREVIATIONS } from "@/src/core/dates/dateFormatter";
import type { DateFormat } from "@/src/core/models/template";
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
    const cells = Array.from({ length: firstDay + days }, (_, index) => index < firstDay ? 0 : index - firstDay + 1);

    return cells.map((day, index) => {
      if (!day) return <span className="calendar-day empty" key={`empty-${index}`} />;
      const value = this.isoValue(viewYear, viewMonth, day);
      return (
        <Button
          type="button"
          className={[
            "calendar-day",
            value === selectedValue ? "selected" : "",
            value === todayValue ? "today" : "",
          ].filter(Boolean).join(" ")}
          onClick={() => this.selectDate(day)}
          key={value}
        >
          {day}
        </Button>
      );
    });
  }

  render() {
    const { value, disabled, placeholder, label, hint, required } = this.props;
    const control = (
      <span className={`calendar-input-shell ${disabled ? "disabled" : ""}`} ref={this.shellRef}>
        <Button
          className={`app-control calendar-display-input ${value ? "" : "placeholder"}`.trim()}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={this.state.open}
          onClick={this.toggleOpen}
        >
          <span>{value || placeholder || "เลือกวันที่"}</span>
        </Button>
        <span className="calendar-icon" aria-hidden="true" />
        {this.state.open && (
          <div
            className={`calendar-popover ${this.state.openUpward ? "calendar-popover-up" : ""}`.trim()}
            role="dialog"
            aria-label={placeholder ?? "เลือกวันที่"}
          >
            <div className="calendar-popover-head">
              <Button type="button" onClick={() => this.moveMonth(-1)} aria-label="เดือนก่อนหน้า">‹</Button>
              <strong>{MONTH_ABBREVIATIONS[this.state.viewMonth]} {this.state.viewYear}</strong>
              <Button type="button" onClick={() => this.moveMonth(1)} aria-label="เดือนถัดไป">›</Button>
            </div>
            <div className="calendar-weekdays">
              {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="calendar-days">
              {this.renderDays()}
            </div>
            <div className="calendar-popover-actions">
              <Button type="button" onClick={() => this.clearDate()}>ล้าง</Button>
              <Button type="button" onClick={() => this.selectToday()}>วันนี้</Button>
            </div>
          </div>
        )}
      </span>
    );
    if (!label) return control;
    return (
      <label className="field">
        <span>{label}{required && <em>*</em>}</span>
        {control}
        <small className="field-hint" aria-hidden={!hint}>{hint || " "}</small>
      </label>
    );
  }
}
