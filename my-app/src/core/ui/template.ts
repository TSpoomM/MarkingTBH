/** Styles for the manage-template page; previously spread across globals.css */

/** Section heading inside the Template form; previously .config-heading */
export const CONFIG_HEADING =
  "flex items-start gap-4 max-bp640:gap-3 " +
  "[&>span]:grid [&>span]:size-[42px] [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-lg " +
  "[&>span]:bg-primary-soft [&>span]:text-base [&>span]:font-extrabold [&>span]:text-primary-dark " +
  "[&>span]:shadow-[inset_0_0_0_1px_rgba(15,118,110,.12)] max-bp640:[&>span]:size-9 " +
  "[&_h2]:mt-0 [&_h2]:mb-1 [&_h2]:text-[22px] [&_h2]:font-extrabold [&_h2]:leading-tight " +
  "[&_h2]:text-[#1f2d28] max-bp640:[&_h2]:text-[20px] " +
  "[&_p]:m-0 [&_p]:max-w-[760px] [&_p]:text-sm [&_p]:leading-[1.55] [&_p]:text-muted " +
  "max-bp640:[&_p]:text-[14px]";

export const CHOICE_LIST = "grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3 max-bp640:grid-cols-1";

/** Checkable card-style option; previously .choice */
export const CHOICE =
  "flex min-h-[76px] cursor-pointer items-start gap-3 rounded-lg border border-[#d2ddd8] bg-white " +
  "px-4 py-3.5 text-[16px] font-bold " +
  "transition-[border-color,background,box-shadow] duration-150 " +
  "focus-within:outline-none focus-within:shadow-[0_0_0_4px_var(--focus)] " +
  "[&_input]:mt-0.5 [&_input]:size-[18px] [&_input]:shrink-0 [&_input]:accent-primary " +
  "[&>span]:grid [&>span]:min-w-0 [&>span]:gap-1 " +
  "[&_b]:block [&_b]:text-[15px] [&_b]:font-black [&_b]:leading-[1.35] [&_b]:text-[#152822] " +
  "[&_small]:text-[14px] [&_small]:font-normal [&_small]:leading-[1.45] [&_small]:text-muted";

export const CHOICE_SELECTED =
  "border-primary bg-[#edf8f6] text-primary-dark shadow-[inset_0_0_0_1px_rgba(15,118,110,.18)]";

/** Mode switch between edit / create Template; previously .template-admin-top */
export const ADMIN_TOP =
  "flex items-center justify-between gap-4 rounded-lg border border-[rgba(215,224,220,.9)] " +
  "bg-white p-[18px] shadow-[0_1px_2px_rgba(20,33,28,.06)] " +
  "max-bp1050:flex-col max-bp1050:items-stretch max-bp640:p-3.5";

export const MODE_SWITCH =
  "inline-flex w-full max-w-[430px] shrink-0 gap-1 rounded-lg border border-[rgba(15,118,110,.2)] " +
  "bg-[#eef4f2] p-[5px] max-bp640:max-w-none";

export const MODE_SWITCH_BTN =
  "!min-h-[46px] flex-1 cursor-pointer rounded-[7px] border border-transparent bg-transparent px-4 text-[16px] " +
  "font-extrabold text-[#4a5d57] " +
  "max-bp700:px-2.5 max-bp640:min-h-11 max-bp640:px-2 max-bp640:text-sm " +
  "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--focus)]";

export const MODE_SWITCH_BTN_EDIT_ACTIVE =
  "!border-primary-dark !bg-primary !text-white shadow-[0_8px_20px_rgba(15,118,110,.22)] hover:!bg-primary-dark hover:!text-white";

export const MODE_SWITCH_BTN_CREATE_ACTIVE =
  "!border-primary-dark !bg-primary !text-white shadow-[0_8px_20px_rgba(15,118,110,.22)] hover:!bg-primary-dark hover:!text-white";

export const MODE_HELP =
  "grid min-w-0 gap-[5px] text-right max-bp1050:text-left " +
  "[&_strong]:text-base [&_strong]:leading-[1.35] [&_strong]:text-[#1f2d28] " +
  "[&_span]:text-sm [&_span]:leading-[1.45] [&_span]:text-muted max-bp640:[&_span]:text-[14px]";

/**
 * Main card of the Template form; previously .config-card
 * The values used are the ones from .template-admin .config-card (white background, wide padding),
 * not the bare .config-card set that was already overridden.
 */
export const CONFIG_CARD =
  "overflow-visible rounded-lg border border-[#d7e2de] bg-white p-[clamp(20px,2.4vw,32px)] " +
  "shadow-[0_10px_28px_rgba(20,33,28,.08)] max-bp560:p-4";

/** Box for the Template name / duplicate source; previously .template-name */
export const TEMPLATE_NAME_BOX =
  "grid gap-2.5 rounded-lg border border-[#e1e8e5] bg-[#fbfcfb] p-[18px] text-[14px] font-bold " +
  "shadow-[0_1px_2px_rgba(20,33,28,.06)] " +
  "[&>span]:text-[14px] [&>span]:font-black [&>span]:text-[#152822] " +
  "[&_small]:text-xs [&_small]:font-semibold [&_small]:text-[#60736b]";

export const NAME_STATUS_ROW =
  "my-6 mb-2 grid w-full grid-cols-[minmax(0,1fr)_220px] items-end gap-3 max-bp760:grid-cols-1";

export const STATUS_FIELD =
  "grid min-w-0 grid-rows-[auto_1fr] gap-[7px] self-stretch max-bp760:max-w-[260px]";

export const STATUS_CAPTION = "text-xs font-extrabold text-[#415049]";

/** Active/Inactive switch; previously .template-status-toggle */
export const STATUS_TOGGLE =
  "!grid !h-[100] !min-h-[58px] !w-full !grid-cols-2 !items-stretch gap-1 overflow-hidden " +
  "!rounded-[10px] !border !p-1 !text-[14px] !leading-none !font-black shadow-none " +
  "transition-[border-color,background,box-shadow] duration-200";

export const STATUS_TOGGLE_ACTIVE =
  "!border-[#579474] !bg-[#edf6f0] " +
  "[&>span:first-child]:bg-transparent [&>span:first-child]:text-[#476156] " +
  "[&>span:last-child]:bg-primary [&>span:last-child]:text-white [&>span:last-child]:shadow-[0_5px_14px_#215d4130]";

export const STATUS_TOGGLE_INACTIVE =
  "!border-[#d7b3b7] !bg-[#fff7f7] " +
  "[&>span:first-child]:bg-[#a15c66] [&>span:first-child]:text-white [&>span:first-child]:shadow-[0_5px_14px_rgba(127,37,45,.18)] " +
  "[&>span:last-child]:bg-transparent [&>span:last-child]:text-[#7f252d]";

export const STATUS_OPTION =
  "flex h-full min-w-0 items-center justify-center rounded-[7px] px-3 text-center leading-none whitespace-nowrap transition-[background,color,box-shadow]";

/** Row of sticker defaults; previously .template-default-grid */
export const DEFAULT_GRID =
  "relative z-[2] mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] items-end gap-3 " +
  "[&>label]:relative [&>label]:grid [&>label]:min-w-0 [&>label]:gap-[7px] " +
  "[&>label]:text-xs [&>label]:font-extrabold [&>label]:text-[#415049]";

export const DEFAULT_CHECK =
  "grid min-h-[45px] cursor-pointer grid-cols-[22px_minmax(0,1fr)] items-center gap-2.5 rounded-lg " +
  "border border-[#c7d8d0] bg-white px-3.5 text-[14px] font-extrabold text-[#1f352b] " +
  "shadow-[inset_0_1px_0_rgba(20,33,28,.03)] transition-[border-color,background,box-shadow,opacity] duration-150 " +
  "hover:border-[#8fb5a5] hover:bg-[#f7fbf9] has-checked:border-primary has-checked:bg-primary-soft " +
  "has-disabled:cursor-not-allowed has-disabled:bg-[#eef2f0] has-disabled:text-[#7b8a84] has-disabled:opacity-70 " +
  "[&_input]:m-0 [&_input]:size-[16px] [&_input]:accent-primary";

/** Cancel / back link; previously .back-link */
export const BACK_LINK =
  "inline-flex min-h-11 items-center rounded-lg border border-[rgba(15,118,110,.25)] bg-white px-4 " +
  "text-sm font-bold text-primary-dark no-underline shadow-[0_6px_18px_rgba(23,35,31,.06)] " +
  "transition-[border-color,background,transform] duration-150 " +
  "hover:-translate-y-px hover:border-[rgba(15,118,110,.45)] hover:bg-primary-soft " +
  "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--focus)]";

export const TEMPLATE_MANAGER_GRID = "mt-[18px] grid grid-cols-1 items-start gap-[22px]";


export const EMPTY_GUIDE =
  "mt-4 grid min-h-[112px] place-content-center gap-1.5 rounded-lg border border-dashed border-[#b9c8c3] " +
  "bg-[#fbfcfb] p-[18px] text-center text-muted shadow-[0_1px_2px_rgba(20,33,28,.06)]";

export const OUTSIDE_TITLE = "flex items-center justify-between gap-5 max-bp1050:flex-col max-bp1050:items-stretch mb-5";

export const OUTSIDE_EMPTY =
  "mt-5 grid h-[130px] place-content-center gap-[7px] rounded-lg border border-dashed border-[#afc2b4] " +
  "bg-[#fbfcfb] text-center text-[#708078]";
