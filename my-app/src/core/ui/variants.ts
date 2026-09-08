/**
 * Shared button styles, written once in Tailwind and reused everywhere,
 * replacing the previous per-page .export-button / .print-export-secondary /
 * .template-cancel-button / .summary-delete-field / .add-field-button rules
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost" | "icon";
export type ButtonSize = "sm" | "md" | "lg";

export const BUTTON_BASE =
  "relative inline-flex min-w-0 cursor-pointer items-center justify-center gap-2 " +
  "leading-none font-extrabold whitespace-nowrap " +
  "transition-[transform,box-shadow,background,border-color,opacity] duration-150 ease-out " +
  "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--focus)] " +
  "disabled:cursor-not-allowed disabled:opacity-[.56] disabled:shadow-none disabled:translate-y-0";

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "rounded-lg border border-primary-dark bg-primary text-white " +
    "shadow-[0_6px_16px_rgba(15,118,110,.18)] " +
    "hover:border-[#0b4f48] hover:bg-primary-dark hover:text-white enabled:hover:-translate-y-px",
  secondary:
    "rounded-lg border border-[#9fb8ad] bg-white text-[#182820] shadow-[0_1px_2px_rgba(20,33,28,.05)] " +
    "hover:border-primary hover:bg-[#f2f8f5] hover:text-primary-dark enabled:hover:-translate-y-px",
  danger:
    "rounded-md border border-[#c98288] bg-[#fff5f5] text-[#7f252d] shadow-none " +
    "hover:border-[#ad555d] hover:bg-[#f6e6e6] hover:text-[#721f26]",
  outline:
    "rounded-lg border border-[#8db4a2] bg-[#f7faf6] text-primary-dark shadow-none " +
    "hover:border-primary-dark hover:bg-primary-soft hover:text-primary-dark",
  ghost:
    "rounded-lg border border-[#c4d4cc] bg-white/70 text-[#24352d] shadow-none " +
    "hover:border-[#8fb5a5] hover:bg-white hover:text-primary-dark",
  icon:
    "size-[34px] shrink-0 rounded-lg border border-[#c4d4cc] bg-white/55 text-[21px] text-[#405049] shadow-none " +
    "hover:border-[#8fb5a5] hover:bg-white hover:text-primary-dark",
};

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "min-h-[34px] px-2.5 text-xs",
  md: "min-h-11 px-[18px] text-sm",
  lg: "min-h-12 px-5 text-[16px] font-black",
};
