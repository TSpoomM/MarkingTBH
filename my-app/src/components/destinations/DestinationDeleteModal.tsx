import { Component } from "react";
import { Trash2 } from "lucide-react";
import Button from "@/src/components/ui/Button";
import Modal from "@/src/components/ui/Modal";
import type { DestinationDeleteModalProps } from "@/src/core/models/destination";

export default class DestinationDeleteModal extends Component<DestinationDeleteModalProps> {
  render() {
    const { target, deleting, onClose, onConfirm } = this.props;

    return (
      <Modal
        open={target !== null}
        title="ยืนยันการลบ"
        subtitle={target ? `ต้องการลบ destination "${target.value}" ใช่ไหม` : undefined}
        className="!w-[min(520px,calc(100vw-32px))]"
        onClose={onClose}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={onClose} disabled={deleting}>
              ยกเลิก
            </Button>
            <Button type="button" variant="alert" loading={deleting} loadingText="กำลังลบ..." onClick={onConfirm}>
              <Trash2 size={16} aria-hidden="true" />
              ลบ
            </Button>
          </>
        )}
      >
        <div className="bg-white p-5 text-sm font-semibold leading-6 text-[#24352d]">
          รายการนี้จะหายจาก autocomplete ของ DESTINATION ทันที
        </div>
      </Modal>
    );
  }
}
