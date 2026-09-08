"use client";

import { Component } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import Button from "./Button";
import cn from "@/src/core/ui/cn";
import type { ModalProps } from "@/src/core/models/ui";

type ModalState = {
  mounted: boolean;
};

export default class Modal extends Component<ModalProps, ModalState> {
  state: ModalState = {
    mounted: false,
  };

  componentDidMount() {
    this.setState({ mounted: true });
  }

  render() {
    const { open, title, subtitle, children, className = "", footer, onClose } = this.props;
    if (!open || !this.state.mounted) return null;

    const modal = (
      <div
        role="presentation"
        onMouseDown={onClose}
        className="fixed inset-0 z-[2000] grid place-items-center bg-[#17271f99] p-5"
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="shared-modal-title"
          onMouseDown={(event) => event.stopPropagation()}
          className={cn(
            "m-auto flex w-[min(1050px,calc(100vw-32px))] max-h-[calc(100vh-32px)] flex-col",
            "overflow-hidden rounded-lg border border-[#b9c9be] bg-[#edf2ed]",
            "shadow-[0_18px_48px_rgba(20,33,28,.12)]",
            "max-bp700:max-h-[calc(100vh-24px)] max-bp700:w-[calc(100vw-24px)]",
            className,
          )}
        >
          <header className="grid min-h-[76px] grid-cols-[minmax(0,1fr)_38px] items-center gap-4 border-b border-b-[#c1cec5] bg-[#f8fbf9] px-5 py-3.5">
            <div className="min-w-0">
              <h2 id="shared-modal-title" className="m-0 text-[26px] font-black leading-tight text-[#10231d]">{title}</h2>
              {subtitle && <p className="m-0 mt-[6px] max-w-[760px] text-[13px] leading-[1.45] text-[#61736b]">{subtitle}</p>}
            </div>
            <Button
              variant="icon"
              className="!size-[38px] !rounded-lg !border-[#b9cfc5] !bg-white !p-0 !text-[#405049] shadow-none hover:!border-primary hover:!bg-primary-soft hover:!text-primary-dark"
              onClick={onClose}
              aria-label="ปิด"
            >
              <X size={22} strokeWidth={2.4} />
            </Button>
          </header>
          {children}
          {footer && (
            <footer className="flex min-h-[68px] items-center justify-end gap-2.5 border-t border-t-[#c1cec5] bg-[#f8fbf9] px-5 py-3">
              {footer}
            </footer>
          )}
        </section>
      </div>
    );

    return createPortal(modal, document.body);
  }
}
