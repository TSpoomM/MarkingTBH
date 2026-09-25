import { Component } from "react";
import { Printer } from "lucide-react";
import Button from "@/src/components/ui/Button";
import Modal from "@/src/components/ui/Modal";
import type { LotOverlapModalProps } from "@/src/core/models/marking";

/** Warns that these lot numbers were already printed and asks whether to print them again. */
export default class LotOverlapModal extends Component<LotOverlapModalProps> {
  render() {
    const { overlap, isSaving, onClose, onConfirm } = this.props;

    return (
      <Modal
        open={overlap !== null}
        title="เลข LOT ซ้ำ"
        subtitle={overlap?.message}
        className="!w-[min(520px,calc(100vw-32px))]"
        onClose={onClose}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              ยกเลิก
            </Button>
            <Button type="button" variant="alert" loading={isSaving} loadingText="กำลังบันทึก..." onClick={onConfirm}>
              <Printer size={16} aria-hidden="true" />
              ยืนยัน พิมพ์ต่อ
            </Button>
          </>
        )}
      >
        <div className="bg-white p-5 text-sm font-semibold leading-6 text-[#24352d]">
          ยืนยันจะพิมพ์ต่อหรือไม่
        </div>
      </Modal>
    );
  }
}
