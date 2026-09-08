import { Component } from "react";
import { X } from "lucide-react";
import Button from "./Button";
import cn from "@/src/core/ui/cn";
import type { AlertProps } from "@/src/core/models/ui";

const TONE = {
  error: "border-[#f0caca] bg-[#fff1f1] text-[#8f2f36]",
  success: "border-[#bee2cb] bg-[#edf8f1] text-[#17603f]",
} as const;

export default class Alert extends Component<AlertProps> {
  render() {
    const { type, message, onClose } = this.props;
    return (
      <div
        role={type === "error" ? "alert" : "status"}
        className={cn(
          "flex min-h-[46px] items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-bold leading-[1.4]",
          "shadow-[0_8px_24px_rgba(23,35,31,.06)]",
          TONE[type],
        )}
      >
        <span className="min-w-0">{message}</span>
        {onClose && (
          <Button variant="icon" className="ml-auto shrink-0" onClick={onClose} aria-label="ปิดข้อความ">
            <X size={18} />
          </Button>
        )}
      </div>
    );
  }
}
