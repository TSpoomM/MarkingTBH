"use client";

import { Component } from "react";
import { TriangleAlert } from "lucide-react";
import Button from "@/src/components/ui/Button";
import Modal from "@/src/components/ui/Modal";

interface TemplateDuplicatePromptProps {
  duplicateName: string | undefined;
  saving: boolean;
  onDismiss: () => void;
  onReplace: () => void;
}

export default class TemplateDuplicatePrompt extends Component<TemplateDuplicatePromptProps> {
  render() {
    const { duplicateName, saving, onDismiss, onReplace } = this.props;
    return (
      <Modal
        open={duplicateName !== undefined}
        title="มี template นี้อยู่แล้ว"
        subtitle={``}
        onClose={onDismiss}
        footer={(
          <div className="flex w-full justify-end gap-2.5 max-bp700:grid max-bp700:grid-cols-1">
            <Button type="button" variant="secondary" size="lg" onClick={onDismiss}>
              เปลี่ยนชื่อ
            </Button>
            <Button
              type="button"
              variant="primary" size="lg"
              onClick={onReplace}
              loading={saving}
              loadingText="กำลังแทนที่..."
            >
              แทนที่ Template เดิม
            </Button>
          </div>
        )}
      >
        <div className="m-0 grid grid-cols-[48px_minmax(0,1fr)] gap-[18px] border-t border-t-[#d5e0d8] bg-[#f7faf7] p-[26px] max-bp700:grid-cols-1 max-bp700:p-[18px]">
          <div aria-hidden="true" className="grid size-12 place-items-center rounded-lg border border-[#e3bc73] bg-[#fff5dd] text-[#9a6215]"><TriangleAlert size={24} /></div>
          <div className="grid min-w-0 gap-[9px]">
            <span className="w-fit rounded-full border border-[#e2c389] bg-[#fff8e8] px-[9px] py-[5px] text-[14px] font-extrabold text-[#8a5b18]">พบชื่อซ้ำในระบบ</span>
            <strong className="text-[26px] font-black leading-tight break-words text-[#182820]">{duplicateName ?? ""}</strong>
            <div className="mt-[3px] grid gap-1 rounded-lg border border-[#c9d8ce] bg-[#edf4ef] px-3.5 py-3 text-base leading-[1.55] text-[#40534a]">
              <b className="font-black text-primary-dark">แนะนำ:</b>
              <span>เลือก “เปลี่ยนชื่อ” ถ้านี่เป็น Template คนละราย หรือ คนละ template</span>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
