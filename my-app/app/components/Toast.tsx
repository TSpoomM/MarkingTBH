import { Component } from "react";
import Button from "./Button";
import { type AlertProps } from "./Alert";

export default class Toast extends Component<AlertProps> {
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
