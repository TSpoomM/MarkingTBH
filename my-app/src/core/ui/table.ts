/** One record card in the vertical table; previously .record-card */
export const RECORD_CARD =
  "overflow-visible rounded-lg border border-[#d7e2de] bg-white shadow-[0_1px_2px_rgba(20,33,28,.06)]";

/**
 * Table with the label on the left and the input on the right; previously .vertical-fields
 * The inner inputs are styled through a single arbitrary variant instead of a .vertical-fields input CSS rule
 */
export const VERTICAL_FIELDS =
  "grid gap-0 " +
  "[&_input]:m-[10px_14px] [&_input]:h-12 [&_input]:w-[calc(100%_-_28px)] [&_input]:text-base " +
  "max-bp700:[&_input]:m-3 max-bp700:[&_input]:w-[calc(100%_-_24px)]";

/**
 * The CalendarInput padding inside the vertical table must match the other inputs in the same cell,
 * otherwise the button stretches to the full cell width and the calendar icon sticks to the border
 */
export const VERTICAL_FIELD_CALENDAR =
  "m-[10px_14px] !h-12 !min-h-12 !w-[calc(100%_-_28px)] max-bp700:m-3 max-bp700:!w-[calc(100%_-_24px)] " +
  "[&>button]:!h-12 [&>button]:!min-h-12 [&>button]:!w-full [&>button]:!bg-white " +
  "[&>button]:!py-0 [&>button]:!pl-[14px] [&>button]:!pr-[50px] " +
  "[&>svg]:right-8";

export const VERTICAL_SEGMENT_INPUTS =
  "m-[10px_14px] grid min-w-0 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5 " +
  "max-bp700:m-3 max-bp700:w-[calc(100%-24px)] " +
  "[&_input]:!m-0 [&_input]:!h-12 [&_input]:!w-full [&_input]:!text-base";

export const VERTICAL_FIELD_LABEL =
  "grid min-h-[72px] grid-cols-[minmax(190px,26%)_minmax(0,1fr)] items-center border-b border-b-[#d2ddd5] bg-white last:border-b-0 " +
  "max-bp700:grid-cols-1 " +
  "[&>span]:flex [&>span]:flex-nowrap [&>span]:items-center [&>span]:content-center [&>span]:gap-x-1.5 [&>span]:gap-y-0.5 " +
  "[&>span]:self-stretch [&>span]:whitespace-nowrap [&>span]:border-r [&>span]:border-r-[#d2ddd5] " +
  "[&>span]:bg-[#f8fbf9] [&>span]:px-[18px] [&>span]:py-3.5 [&>span]:text-[16px] [&>span]:font-bold " +
  "[&>span]:leading-[1.3] [&>span]:text-[#34443f] " +
  "max-bp700:[&>span]:border-r-0 max-bp700:[&>span]:border-b max-bp700:[&>span]:border-b-[#e0e8e4] " +
  "max-bp700:[&>span]:whitespace-normal " +
  "[&>span_small]:w-auto [&>span_small]:min-w-0 [&>span_small]:overflow-hidden [&>span_small]:text-ellipsis " +
  "[&>span_small]:whitespace-nowrap [&>span_small]:text-xs [&>span_small]:font-bold " +
  "[&>span_small]:leading-[1.35] [&>span_small]:text-[#718077]";

/** Lock icon in front of a locked field (the icon itself is Lock from lucide) */
export const LOCK_ICON = "inline-block shrink-0 align-middle text-[#314238]";

/** Column on the marking page (inside / outside frame); previously .table-column */
export const TABLE_COLUMN = "grid min-w-0 content-start gap-4 border-t-4 border-t-transparent pt-3";

export const TABLE_COLUMN_LABEL =
  "grid min-h-10 items-center justify-between gap-1 px-1 " +
  "[&_span]:text-[14px] [&_span]:font-extrabold [&_span]:text-muted " +
  "[&_strong]:inline-flex [&_strong]:w-fit [&_strong]:items-center [&_strong]:rounded-full " +
  "[&_strong]:bg-primary-soft [&_strong]:px-3 [&_strong]:py-[7px] [&_strong]:text-xl " +
  "[&_strong]:font-extrabold [&_strong]:uppercase [&_strong]:leading-none [&_strong]:text-primary-dark " +
  "[&_strong]:shadow-[inset_0_0_0_1px_rgba(15,118,110,.12)]";

/** Empty state shown before a template is selected on the marking page */
export const PRINT_EMPTY =
  "grid min-h-[280px] place-items-center content-center gap-3.5 border-t-4 border-t-primary " +
  "rounded-b-lg bg-surface-2 text-center text-[#596a62] " +
  "[&_strong]:text-lg [&_strong]:font-black [&_strong]:text-[#1a2a24]";
