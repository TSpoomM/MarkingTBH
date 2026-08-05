import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

export interface AlertProps {
  type: "error" | "success";
  message: string;
  onClose?: () => void;
  durationMs?: number;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
}

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  bare?: boolean;
}

export interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export interface NavbarProps {
  badge?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  children: ReactNode;
  bare?: boolean;
}

export interface SectionTitleProps {
  number: string;
  title: string;
  subtitle: string;
}
