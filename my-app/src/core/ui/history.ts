/** History table styles; previously .history-* in globals.css */
export const HISTORY_WRAP =
  "screen-only mx-auto grid w-full max-w-[1320px] gap-[18px] px-7 pt-[26px] pb-[42px] " +
  "max-bp700:px-3 max-bp700:pt-[18px] max-bp700:pb-[34px]";

export const HISTORY_EMPTY =
  "m-0 grid min-h-[260px] place-items-center rounded-lg bg-[#fbfcfb] p-7 text-center text-base font-bold text-[#65776f]";

export const HISTORY_TABLE_WRAP =
  "overflow-auto min-h-[280px] max-h-[calc(100vh-var(--navbar-height,92px)-330px)]";

export const HISTORY_TABLE =
  "w-full border-separate border-spacing-0 bg-white text-sm " +
  "max-bp700:min-w-[820px] " +
  "[&_th]:sticky [&_th]:top-0 [&_th]:z-[2] [&_th]:border-b [&_th]:border-b-[#dce7e2] " +
  "[&_th]:bg-[#f6faf8] [&_th]:px-4 [&_th]:py-[15px] [&_th]:text-left [&_th]:align-top " +
  "[&_th]:text-xs [&_th]:font-black [&_th]:uppercase [&_th]:whitespace-nowrap [&_th]:text-[#52635b] " +
  "[&_td]:border-b [&_td]:border-b-[#edf2ef] [&_td]:bg-white [&_td]:px-4 [&_td]:py-[15px] " +
  "[&_td]:text-left [&_td]:align-top [&_td]:leading-[1.45] [&_td]:text-[#21332c] " +
  "[&_td:first-child]:font-semibold [&_td:first-child]:whitespace-nowrap [&_td:first-child]:text-[#51655c]";

export const HISTORY_ROW = "hover:[&>td]:bg-[#f7fbf9]";

const BADGE_BASE =
  "inline-flex min-h-[30px] min-w-[90px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-black";

export const HISTORY_BADGE: Record<string, string> = {
  print: `${BADGE_BASE} border-primary/35 bg-primary-soft text-primary-dark`,
  save: `${BADGE_BASE} border-[#c9d8ee] bg-[#eef4ff] text-[#315987]`,
  unknown: `${BADGE_BASE} border-[#ddd4bd] bg-[#f6f0e3] text-[#6b5a2f]`,
};

export const historyBadge = (action: string) => HISTORY_BADGE[action] ?? HISTORY_BADGE.unknown;

export const HISTORY_FIELD_COUNT =
  "inline-flex min-h-[30px] items-center rounded-[7px] border border-[#c8d8d0] bg-[#f3f8f5] " +
  "px-2.5 text-xs font-extrabold whitespace-nowrap text-[#315446]";

export const HISTORY_TOGGLE =
  "flex min-h-[38px] w-full min-w-[70px] cursor-pointer items-center justify-center rounded-lg " +
  "border border-[#bcd1c6] bg-white px-4 text-sm font-extrabold text-primary-dark shadow-none " +
  "hover:bg-primary-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--focus)]";

/** History detail modal */
export const HISTORY_MODAL_BODY = "grid gap-[18px] overflow-auto bg-[#f7fbf9] p-[18px]";

export const HISTORY_SUMMARY =
  "grid grid-cols-3 gap-2.5 max-bp1100:grid-cols-1 " +
  "[&_span]:text-xs [&_span]:font-extrabold [&_span]:leading-tight [&_span]:text-[#61736b] " +
  "[&_strong]:min-w-0 [&_strong]:text-[16px] [&_strong]:leading-[1.3] [&_strong]:break-words [&_strong]:text-[#14251f]";

/** White box (sticker details / sticker content) */
export const HISTORY_BOX = "grid gap-3 rounded-lg border border-[#dce8e3] p-4";
export const HISTORY_BOX_TITLE = "[&_h3]:m-0 [&_h3]:text-lg [&_h3]:font-black [&_h3]:text-[#10231d]";

export const HISTORY_SPEC_LIST =
  "m-0 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5 " +
  "[&>div]:grid [&>div]:min-w-0 [&>div]:gap-1 [&>div]:rounded-lg [&>div]:border " +
  "[&>div]:border-[#e2ebe7] [&>div]:bg-[#f8fbf9] [&>div]:p-3 " +
  "[&_dt]:m-0 [&_dt]:min-w-0 [&_dt]:text-xs [&_dt]:leading-[1.3] [&_dt]:font-extrabold " +
  "[&_dt]:break-words [&_dt]:text-[#61736b] " +
  "[&_dd]:m-0 [&_dd]:min-w-0 [&_dd]:text-[16px] [&_dd]:leading-[1.3] [&_dd]:font-black " +
  "[&_dd]:break-words [&_dd]:text-[#14251f]";

export const HISTORY_TEMPLATE_GRID = "grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] gap-3";

export const HISTORY_TEMPLATE_CARD =
  "min-w-0 overflow-hidden rounded-lg border border-[#dce8e3] bg-white " +
  "[&>header]:flex [&>header]:min-h-[50px] [&>header]:items-center [&>header]:justify-between " +
  "[&>header]:gap-3 [&>header]:border-b [&>header]:border-b-[#e4ece8] [&>header]:bg-[#fbfcfb] " +
  "[&>header]:px-3.5 [&>header]:py-3 " +
  "[&>header_strong]:text-[16px] [&>header_strong]:font-black [&>header_strong]:text-[#10231d] " +
  "[&>header_span]:text-xs [&>header_span]:font-extrabold [&>header_span]:leading-tight [&>header_span]:text-[#61736b] " +
  "[&_dl]:m-0 [&_dl]:grid " +
  "[&_dl>div]:grid [&_dl>div]:grid-cols-[minmax(110px,34%)_minmax(0,1fr)] [&_dl>div]:gap-2.5 " +
  "[&_dl>div]:border-b [&_dl>div]:border-b-[#edf3f0] [&_dl>div]:px-3.5 [&_dl>div]:py-2.5 " +
  "[&_dt]:m-0 [&_dt]:min-w-0 [&_dt]:text-xs [&_dt]:leading-[1.35] [&_dt]:font-extrabold " +
  "[&_dt]:break-words [&_dt]:text-[#61736b] " +
  "[&_dd]:m-0 [&_dd]:min-w-0 [&_dd]:text-sm [&_dd]:leading-[1.35] [&_dd]:font-extrabold " +
  "[&_dd]:break-words [&_dd]:text-[#14251f]";
