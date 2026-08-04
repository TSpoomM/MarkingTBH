import { Component } from "react";
import Button from "./Button";
import type { ModalProps } from "@/app/types/ui";

export default class Modal extends Component<ModalProps> {
  render() {
    const { open, title, subtitle, children, footer, onClose } = this.props;
    if (!open) return null;
    return (
      <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
        <section
          className="template-modal"
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
  }
}
