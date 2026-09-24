import { Component } from "react";
import { Trash2 } from "lucide-react";
import Button from "@/src/components/ui/Button";
import Modal from "@/src/components/ui/Modal";
import type { AdminDeleteModalProps } from "@/src/core/models/admin";

export default class AdminDeleteModal extends Component<AdminDeleteModalProps> {
  render() {
    const { target, deleting, onClose, onConfirm } = this.props;

    return (
      <Modal
        open={target !== null}
        title="ยืนยันการลบ"
        subtitle={target ? `ต้องการลบสิทธิ์ admin ของ ${target.name} ใช่ไหม` : undefined}
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
          การลบนี้จะถอดสิทธิ์ admin ทันที
        </div>
      </Modal>
    );
  }
}
