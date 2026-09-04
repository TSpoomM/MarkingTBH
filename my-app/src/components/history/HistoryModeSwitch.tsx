"use client";

import Button from "../ui/Button";
import HistoryComponent from "./HistoryComponent";

export default class HistoryModeSwitch extends HistoryComponent {
  render() {
    return (
      <section className="history-mode-switch" aria-label="เลือกโหมดประวัติ">
        <Button
          type="button"
          className={this.state.mode === "logs" ? "active" : ""}
          onClick={() => this.actions.setMode("logs")}
        >
          Logs
        </Button>
        <Button
          type="button"
          className={this.state.mode === "templates" ? "active" : ""}
          onClick={() => this.actions.setMode("templates")}
        >
          Templates
        </Button>
      </section>
    );
  }
}
