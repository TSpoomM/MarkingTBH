import { Component } from "react";
import Button from "./Button";
import type { AlertProps } from "@/app/types/ui";

export default class Toast extends Component<AlertProps> {
  private timer: ReturnType<typeof setTimeout> | undefined;

  componentDidMount() {
    this.scheduleClose();
  }

  componentDidUpdate(previousProps: AlertProps) {
    if (
      previousProps.message !== this.props.message ||
      previousProps.type !== this.props.type ||
      previousProps.durationMs !== this.props.durationMs ||
      previousProps.onClose !== this.props.onClose
    ) {
      this.clearTimer();
      this.scheduleClose();
    }
  }

  componentWillUnmount() {
    this.clearTimer();
  }

  private clearTimer() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  private scheduleClose() {
    const { onClose, durationMs = 4200 } = this.props;
    if (!onClose || durationMs <= 0) return;
    this.timer = setTimeout(onClose, durationMs);
  }

  render() {
    const { type, message, onClose } = this.props;
    return (
      <div className={`app-toast ${type}`} role={type === "error" ? "alert" : "status"}>
        <div className="toast-mark" aria-hidden="true">{type === "error" ? "!" : "✓"}</div>
        <div className="toast-copy">
          <strong>{type === "error" ? "แจ้งเตือน" : "สำเร็จ"}</strong>
          <span>{message}</span>
        </div>
        {onClose && <Button className="icon-button toast-close" onClick={onClose} aria-label="ปิดข้อความ">×</Button>}
      </div>
    );
  }
}
