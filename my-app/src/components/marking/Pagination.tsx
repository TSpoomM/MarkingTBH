"use client";

import { Component } from "react";
import { Check, Download } from "lucide-react";
import Button from "@/src/components/ui/Button";
import Modal from "@/src/components/ui/Modal";
import { ACTION_BAR, ACTION_BAR_BUTTONS } from "@/src/core/ui/surfaces";
import { MODAL_ACTIONS } from "@/src/core/ui/fieldEditor";
import StickerPreviewButton from "./StickerPreviewButton";
import type { PaginationProps } from "@/src/core/models/marking-sticker";

export default class Pagination extends Component<PaginationProps> {
  render() {
    const {
      previewItems, printOptions, canExport, isSaving, isExportModalOpen,
      onOpenExportModal, onCloseExportModal, onToggleOption, onExport,
    } = this.props;
    const hasSelectedPrintSection = printOptions.some((option) => option.selected);

    return (
      <>
        <div className={ACTION_BAR}>
          <div className={ACTION_BAR_BUTTONS}>
            <StickerPreviewButton items={previewItems} />
            <Button
              variant="primary"
              onClick={onOpenExportModal}
              disabled={isSaving || !canExport}
              loading={isSaving}
              loadingText="กำลังส่งออก..."
            >
              <Download size={16} />
              ส่งออก PDF
            </Button>
          </div>
        </div>
        <Modal
          open={isExportModalOpen}
          title="เลือกสติ๊กเกอร์ที่จะปริ้น"
          subtitle="เลือกได้มากกว่า 1 แบบ แล้วระบบจะบันทึกและเปิดหน้าพิมพ์ PDF"
          onClose={onCloseExportModal}
          footer={(
            <div className={MODAL_ACTIONS}>
              <Button type="button" variant="secondary" size="lg" onClick={onCloseExportModal}>
                ยกเลิก
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onExport}
                disabled={!hasSelectedPrintSection}
                loading={isSaving}
                loadingText="กำลังส่งออก..."
              >
                <Download size={16} />
                ปริ้นรายการที่เลือก
              </Button>
            </div>
          )}
        >
          <div className="border-t border-t-[#d5e0d8] bg-[#f7faf7] p-[22px]">
            <div className="grid grid-cols-2 gap-3 max-bp700:grid-cols-1">
              {printOptions.map((option) => (
                <label
                  key={option.key}
                  className="group grid min-h-[92px] cursor-pointer grid-cols-[24px_minmax(0,1fr)] items-start gap-3 rounded-lg border border-[#c6d5cb] bg-white p-[14px] text-[#24352d] transition-[border-color,background,box-shadow] duration-150 ease-out hover:border-[#82a58f] hover:bg-[#f9fcfa] hover:shadow-[0_8px_18px_rgba(37,50,44,.06)] has-checked:border-primary has-checked:bg-[#edf7f1]"
                >
                  <input
                    type="checkbox"
                    className="pointer-events-none absolute opacity-0"
                    checked={option.selected}
                    onChange={(event) => onToggleOption(option, event.target.checked)}
                  />
                  <span
                    aria-hidden="true"
                    className="mt-px grid size-6 place-items-center rounded-md border-2 border-[#9eb3a5] bg-white text-transparent group-has-checked:border-primary group-has-checked:bg-primary group-has-checked:text-white"
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span>
                    <b className="block text-[18px] font-black leading-tight">{option.title}</b>
                    <small className="mt-1.5 block text-[14px] font-bold leading-[1.45] text-[#65746d]">{option.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </Modal >
      </>
    );
  }
}
