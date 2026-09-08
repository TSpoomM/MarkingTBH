/** Shared card/panel surface; previously .panel / .config-card / .record-card / .history-panel */
export const PANEL =
  "rounded-lg border border-[#d7e2de] bg-white shadow-[0_1px_2px_rgba(20,33,28,.06)]";

/** Table heading bar; previously .table-heading */
export const TABLE_HEADING =
  "flex min-h-[88px] items-center justify-between gap-3.5 rounded-lg border border-[#d7e2de] " +
  "bg-white p-5 shadow-[0_10px_28px_rgba(20,33,28,.08)] " +
  "max-bp1050:flex-col max-bp1050:items-stretch";

/** Table heading embedded in a panel (no border/shadow, only a bottom divider) */
export const TABLE_HEADING_FLUSH =
  "flex min-h-[86px] items-center justify-between gap-3.5 rounded-none border-0 " +
  "border-b border-b-[#e0e9e5] bg-[#fbfcfb] p-5 shadow-none " +
  "max-bp1050:flex-col max-bp1050:items-stretch";

/**
 * Main page container; previously .container
 * screen-only = hidden when printing (rule lives in sticker-print.css)
 */
export const CONTAINER =
  "screen-only mx-auto grid w-full max-w-[1240px] gap-[22px] px-7 py-6 " +
  "max-bp700:px-3 max-bp700:pt-[18px] max-bp700:pb-[34px]";

/** Floating action bar at the bottom of the screen; previously .container.bottom-action */
export const ACTION_BAR =
  "screen-only fixed bottom-[max(16px,env(safe-area-inset-bottom))] left-1/2 z-[950] " +
  "flex w-[calc(100%-56px)] max-w-[1240px] -translate-x-1/2 items-center justify-end gap-5 " +
  "rounded-[10px] border border-[#d7e2de] bg-white/95 px-3.5 py-2.5 backdrop-blur-[16px] " +
  "shadow-[0_18px_46px_rgba(23,35,31,.18),0_2px_10px_rgba(23,35,31,.08)] " +
  "max-bp700:bottom-[max(12px,env(safe-area-inset-bottom))] max-bp700:w-[calc(100%-24px)] " +
  "max-bp700:flex-col max-bp700:items-stretch max-bp700:gap-3";

/**
 * Button group inside ACTION_BAR - forces every button to share the same border and height
 * (previously ghost buttons had no border at all and blended into the bar background)
 */
export const ACTION_BAR_BUTTONS =
  "flex items-center justify-end gap-2.5 max-bp700:w-full max-bp700:flex-col max-bp700:items-stretch " +
  "[&_button]:h-11 [&_button]:min-h-11 [&_button]:py-0";


/**
 * Floating "Preview Sticker" button on the manage-template page
 * Previously .app-button.sticker-preview-open in sticker-print.css,
 * which depended on .app-button - removed during the move to Tailwind
 */
export const PREVIEW_FAB =
  "min-h-11 min-w-[178px] rounded-lg !border-[#8db4a2] !bg-white !px-5 " +
  "!text-sm !text-primary-dark shadow-none hover:!border-primary hover:!bg-primary-soft hover:!text-primary-dark";
