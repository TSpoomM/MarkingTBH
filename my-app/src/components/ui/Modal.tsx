"use client";

import { Component } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";
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
      <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
        <section
          className={`template-modal ${className}`.trim()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shared-modal-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header>
            <div><h2 id="shared-modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
            <Button className="icon-button modal-close" onClick={onClose} aria-label="ปิด">×</Button>
          </header>
          {children}
          {footer && <footer>{footer}</footer>}
        </section>
      </div>
    );

    return createPortal(modal, document.body);
  }
}
