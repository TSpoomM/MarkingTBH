import { Component } from "react";
import Button from "./Button";

export interface AlertProps {
  type: "error" | "success";
  message: string;
  onClose?: () => void;
}

export default class Alert extends Component<AlertProps> {
  render() {
    const { type, message, onClose } = this.props;
    return (
      <div className={`notice ${type}`} role={type === "error" ? "alert" : "status"}>
        <span>{message}</span>
        {onClose && <Button onClick={onClose} aria-label="ปิดข้อความ">×</Button>}
      </div>
    );
  }
}
