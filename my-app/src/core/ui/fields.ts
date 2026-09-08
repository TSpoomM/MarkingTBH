/**
 * Shared styles for form controls; previously spread across .field / .app-control /
 * .details-panel .app-control / .vertical-fields input
 *
 * Note: never put mutually conflicting utilities (e.g. two border-color values) in the same string,
 * because Tailwind resolves them by the order in the generated CSS, not the order written in className
 */
export type ControlSize = "md" | "lg";

export const FIELD = "grid gap-2";
export const FIELD_LG = "relative grid grid-rows-[auto_52px_minmax(17px,auto)] gap-[9px]";

export const FIELD_LABEL = "m-0 block text-sm font-extrabold text-[#2d3d37]";
export const FIELD_LABEL_LG = "m-0 block text-[14px] font-black text-[#152822]";

export const FIELD_HINT = "block text-[14px] leading-[1.4] text-[#7c8a82]";
export const FIELD_HINT_LG = "block text-xs font-semibold leading-[1.4] text-[#60736b] aria-hidden:invisible";

export const FIELD_REQUIRED = "ml-1 not-italic text-[#b94147]";

/** Shared shell for every control - no border color/shadow/size, so it never clashes with tone/size */
export const CONTROL_BASE =
  "w-full rounded-lg bg-white outline-none " +
  "transition-[border-color,box-shadow,background] duration-150 " +
  "placeholder:text-[#98a6a0] " +
  "focus:border-primary focus:shadow-[0_0_0_4px_rgba(15,118,110,.12)] " +
  "disabled:cursor-not-allowed disabled:bg-[#eef2f0] disabled:text-[#7b8a84]";

export const CONTROL_TONE: Record<ControlSize, string> = {
  md: "border border-[#cfdad6] text-[#16231e] shadow-[inset_0_1px_0_rgba(20,33,28,.03)]",
  lg: "border border-[#bdcec7] text-[#12221d] shadow-[0_1px_0_rgba(15,118,110,.08),0_10px_24px_rgba(23,35,31,.04)]",
};

export const CONTROL_SIZE: Record<ControlSize, string> = {
  md: "h-[45px] px-[13px] text-sm",
  lg: "min-h-[52px] px-[13px] text-[16px] font-semibold",
};

export const control = (size: ControlSize = "md") =>
  `${CONTROL_BASE} ${CONTROL_TONE[size]} ${CONTROL_SIZE[size]}`;
