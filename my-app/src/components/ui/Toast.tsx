import { Component } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import Button from "./Button";
import cn from "@/src/core/ui/cn";
import type { AlertProps } from "@/src/core/models/ui";

const TONE = {
  success: { box: "border-[#2f9461] bg-[#f3fbf6]", mark: "bg-[#dcf4e6] text-[#17603f]", title: "สำเร็จ", Glyph: CircleCheck },
  error: { box: "border-[#c63d47] bg-[#fff6f6]", mark: "bg-[#fde7e7] text-[#943039]", title: "แจ้งเตือน", Glyph: CircleAlert },
} as const;

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
    const tone = TONE[type];
    const Glyph = tone.Glyph;
    return (
      <div
        role={type === "error" ? "alert" : "status"}
        className={cn(
          "fixed top-[104px] right-[clamp(14px,3vw,28px)] z-[120] w-[min(460px,calc(100vw-28px))]",
          "grid grid-cols-[34px_minmax(0,1fr)_auto] items-start gap-3 rounded-lg border-2 bg-white p-4",
          "shadow-[0_22px_60px_rgba(20,33,28,.22),0_0_0_1px_rgba(20,33,28,.04)]",
          "max-bp560:inset-x-2.5 max-bp560:top-[86px] max-bp560:w-auto max-bp560:grid-cols-[30px_minmax(0,1fr)_auto] max-bp560:p-3",
          tone.box,
        )}
      >
        <div
          aria-hidden="true"
          className={cn("grid size-[34px] place-items-center rounded-lg font-black max-bp560:size-[30px]", tone.mark)}
        >
          <Glyph size={20} />
        </div>
        <div className="grid min-w-0 gap-[3px]">
          <strong className="text-sm font-extrabold leading-tight text-[#101a16]">{tone.title}</strong>
          <span className="text-sm leading-[1.45] break-words text-[#26352f]">{message}</span>
        </div>
        {onClose && (
          <Button variant="icon" className="-mt-0.5 text-[#63736d]" onClick={onClose} aria-label="ปิดข้อความ">
            <X size={18} />
          </Button>
        )}
      </div>
    );
  }
}
