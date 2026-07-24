import { Component, type ReactNode } from "react";
import Button from "./Button";

export interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

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
            <Button onClick={onClose} aria-label="ปิด">×</Button>
          </header>
          {children}
          {footer && <footer>{footer}</footer>}
        </section>
      </div>
    );
  }
}
