/** CalendarInput styles; previously .calendar-* in globals.css */
export const CAL_SHELL = "relative block h-full w-full min-w-0";

export const CAL_DISPLAY =
  "!flex h-full w-full cursor-pointer items-center justify-start rounded-lg !border-2 !border-[#86aa99] " +
  "!m-0 !py-0 !pr-[50px] !pl-[14px] font-black !text-[#071c15] " +
  "!bg-white " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_1px_2px_rgba(20,40,32,.08)] " +
  "transition-[border-color,box-shadow,background] duration-150 " +
  "group-hover/cal:!border-primary group-hover/cal:!bg-white " +
  "group-hover/cal:shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_4px_12px_rgba(24,83,59,.08)] " +
  "group-focus-within/cal:!border-primary group-focus-within/cal:!bg-white " +
  "group-focus-within/cal:shadow-[0_0_0_3px_var(--focus),0_6px_16px_rgba(15,118,110,.12)]";

export const CAL_DISPLAY_SIZE = {
  md: "h-[45px] text-sm",
  lg: "h-[52px] min-h-[52px] text-[16px]",
} as const;

export const CAL_DISPLAY_PLACEHOLDER = "font-semibold text-[#778980]";

export const CAL_DISPLAY_DISABLED =
  "cursor-not-allowed !border-[#9cafb4] !bg-[#e8eee9] !text-[#34443f] shadow-none " +
  "group-hover/cal:!border-[#9cafb4] group-hover/cal:!bg-[#e8eee9] group-hover/cal:shadow-none";

/** Calendar icon position (the icon itself is CalendarDays from lucide) */
export const CAL_ICON =
  "pointer-events-none absolute top-1/2 right-4 z-[2] -translate-y-1/2 text-primary-dark drop-shadow-[0_1px_0_rgba(255,255,255,.9)]";

export const CAL_POPOVER =
  "absolute top-[calc(100%+8px)] right-0 z-[1200] w-[min(322px,calc(100vw-32px))] rounded-lg " +
  "border-2 border-[#9bb9ad] bg-[#fbfdfc] p-3 " +
  "shadow-[0_18px_46px_rgba(23,35,31,.18),0_3px_10px_rgba(23,35,31,.08)] " +
  "max-bp700:right-auto max-bp700:left-0 max-bp700:w-[min(322px,calc(100vw-48px))]";

export const CAL_POPOVER_UP = "top-auto bottom-[calc(100%+8px)]";

export const CAL_HEAD =
  "grid min-h-[42px] grid-cols-[38px_minmax(0,1fr)_38px] items-center gap-2 rounded-lg " +
  "border border-[#bfd4ca] bg-[#edf6f2] p-1 text-[#20352b]";

/** Small buttons in the calendar (month step / clear / today / day numbers) */
export const CAL_BTN =
  "cursor-pointer rounded-[7px] !border !border-[#bfd2c8] font-extrabold shadow-none " +
  "transition-[border-color,background,color,transform] duration-150 " +
  "hover:!border-primary hover:!bg-primary-soft hover:!text-primary-dark";

export const CAL_NAV = "!grid !size-[34px] !min-h-0 place-items-center !bg-white !p-0 !text-primary-dark hover:!bg-primary-soft [&_svg]:size-5 [&_svg]:stroke-[2.5]";

export const CAL_ACTION = "!min-h-[34px] !border-[#abc6b9] !bg-[#f7faf8] !px-3 text-xs !text-[#142820]";

export const CAL_GRID = "grid grid-cols-[repeat(7,minmax(0,1fr))]";
export const CAL_WEEKDAYS = "mt-3 mb-1.5 gap-1";
export const CAL_WEEKDAY = "grid h-6 place-items-center text-[12px] font-black text-[#6a7b73]";
export const CAL_DAYS = "gap-[5px]";

export const CAL_DAY =
  "!grid aspect-square !min-h-0 min-w-0 place-items-center !border-[#c9d8d0] !bg-white !p-0 text-[14px] !text-[#17352a]";
export const CAL_DAY_EMPTY = "!border-transparent !bg-transparent pointer-events-none";
export const CAL_DAY_TODAY = "!border-primary !text-primary-dark shadow-[inset_0_0_0_1px_var(--primary)]";
export const CAL_DAY_SELECTED =
  "!border-primary-dark !bg-primary !text-white shadow-[0_6px_14px_rgba(15,118,110,.28)] " +
  "hover:!border-primary-dark hover:!bg-primary hover:!text-white";

export const CAL_ACTIONS = "mt-3 flex justify-end gap-2 border-t border-t-[#e0e9e5] pt-2.5";
