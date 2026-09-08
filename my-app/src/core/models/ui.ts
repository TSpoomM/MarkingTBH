import type { ButtonSize, ButtonVariant } from "@/src/core/ui/variants";
import type { ControlSize } from "@/src/core/ui/fields";
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
  wrapContent?: boolean;
  /** Button shape, see BUTTON_VARIANTS - the "secondary" default has a border and the system mid contrast */
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  bare?: boolean;
  size?: ControlSize;
}

export interface AutocompleteProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "list" | "size"> {
  label?: string;
  hint?: string;
  bare?: boolean;
  size?: ControlSize;
  maxOptions?: number;
  options: string[];
}

export interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  onClose: () => void;
}

export interface NavbarProps {
  badge?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  activeNav?: "marking" | "history" | "templates";
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  hint?: string;
  children: ReactNode;
  bare?: boolean;
  size?: ControlSize;
}

export interface SectionTitleProps {
  number: ReactNode;
  title: string;
  subtitle?: string;
  /** Variant used in table heading bars: badge sized to its content, description hidden on small screens */
  compact?: boolean;
}
