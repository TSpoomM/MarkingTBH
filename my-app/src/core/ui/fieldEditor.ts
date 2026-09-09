/**
 * Styles for TemplateFieldEditor; previously .editor-* / .template-admin .editor-* in globals.css
 *
 * Note: .editor-field used to have several column rules keyed off >label:nth-of-type(n),
 * but .editor-field now renders inside a Modal, which portals out of that DOM tree,
 * so those rules stopped applying long ago. Only the layout that actually works in the modal is kept here.
 */

export const EDITOR_PANEL =
  "grid max-w-full gap-4 overflow-hidden rounded-lg border border-[#dbe4e0] bg-[#f8fbf9] " +
  "p-[clamp(16px,2vw,22px)]";

export const DRAFT_HEADING =
  "flex min-h-[46px] items-center justify-between gap-3 border-b border-b-[#e0e8e4] pb-2 " +
  "[&_h3]:m-0 [&_h3]:text-lg [&_h3]:font-extrabold [&_h3]:text-[#1f2d28] " +
  "[&_span]:inline-flex [&_span]:min-h-[30px] [&_span]:items-center [&_span]:rounded-full " +
  "[&_span]:bg-[#eef4f2] [&_span]:px-[9px] [&_span]:py-1 [&_span]:text-[14px] [&_span]:font-bold " +
  "[&_span]:text-primary-dark";

export const EDITOR_EMPTY = "grid h-[70px] place-items-center text-[14px] text-[#75847b]";

export const FIELD_WRAP = "grid gap-0";
export const FIELD_WRAP_DRAGGING = "opacity-45";

export const TABLE_HEAD =
  "mt-3 grid grid-cols-[42px_minmax(0,1fr)_160px_auto] items-center gap-3 rounded-t-lg " +
  "border border-[#b8c7bd] bg-[#dce8df] p-3.5 max-bp640:grid-cols-1";

/** Drag handle, shared by field / table / segment rows */
export const DRAG_HANDLE =
  "shrink-0 cursor-grab touch-none px-[3px] py-1 text-base leading-none text-muted active:cursor-grabbing";
export const DRAG_HANDLE_SEGMENT = "text-[#4f6058]";

export const FIELD_SUMMARY =
  "group/summary flex cursor-pointer items-center gap-2.5 rounded-[9px] border border-[#bccac1] bg-white " +
  "px-3 py-[9px] select-none shadow-[0_1px_2px_rgba(20,33,28,.05)] " +
  "hover:border-[#86ac97] hover:bg-[#f1f8f4]";

export const EDITOR_NUMBER =
  "grid h-[46px] w-[38px] place-items-center rounded-lg bg-primary-soft text-[16px] font-extrabold " +
  "text-primary-dark max-bp640:w-full";

export const SUMMARY_LABEL =
  "flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-bold text-[#26362c]";
export const SUMMARY_LABEL_EMPTY = "font-semibold text-[#8a978d] italic";

export const SUMMARY_ACTIONS = "flex shrink-0 items-center gap-[7px]";

export const SUMMARY_TOGGLE =
  "!h-9 !min-h-9 !min-w-[58px] shrink-0 rounded-md !border-primary !bg-primary-soft !px-3 " +
  "!text-[13px] !text-primary-dark shadow-none hover:!bg-primary hover:!text-white";

export const SUMMARY_DELETE =
  "!h-9 !min-h-9 !min-w-[58px] rounded-md !border-[#d8b6ba] !bg-[#fbf2f2] !px-3 " +
  "!text-[13px] !text-[#7f252d] shadow-none hover:!border-[#c98288] hover:!bg-[#f6e6e6] hover:!text-[#721f26]";

/** Body of the field edit modal */
export const MODAL_BODY = "grid gap-4 overflow-auto bg-[#f7fbf9] p-[18px]";

export const EDITOR_FIELD =
  "grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-stretch gap-4 rounded-lg " +
  "border border-[#d7e2de] bg-white p-5 shadow-[0_8px_24px_rgba(20,33,28,.07)] " +
  "[&>label:not([class])]:col-span-full " +
  "[&>label:not([class])>span]:mb-2 [&>label:not([class])>span]:text-sm " +
  "[&>label:not([class])>span]:font-extrabold " +
  "[&>label:not([class])_input]:h-12 [&>label:not([class])_input]:px-3.5 " +
  "[&>label:not([class])_input]:text-base";

/**
 * Checkbox switch in the field edit modal; previously .template-admin .editor-field .required-toggle
 * (the first version used the bare .required-toggle rule, which is the smaller and already overridden set)
 */
export const TOGGLE_BOX =
  "flex min-h-[74px] cursor-pointer items-center justify-start gap-3 rounded-[10px] border " +
  "border-[#d5e1da] bg-[#fbfdfb] px-4 py-3 " +
  "transition-[border-color,background,box-shadow] duration-150 " +
  "hover:border-[#9dbbab] hover:bg-[#f6faf7] " +
  "has-checked:border-[#74aa90] has-checked:bg-[#eef8f2] " +
  "has-checked:shadow-[inset_0_0_0_1px_rgba(31,123,83,.08)] " +
  "[&_input]:m-0 [&_input]:size-[22px] [&_input]:shrink-0 [&_input]:rounded " +
  "[&_input]:border [&_input]:border-[#9eb0a8] [&_input]:bg-white [&_input]:accent-primary " +
  "[&>span]:m-0 [&>span]:min-w-0 [&>span]:whitespace-normal";

export const TOGGLE_COPY =
  "grid gap-[5px] leading-[1.3] " +
  "[&_strong]:text-[16px] [&_strong]:font-extrabold [&_strong]:leading-[1.3] [&_strong]:text-[#24362e] " +
  "[&_small]:text-[14px] [&_small]:font-semibold [&_small]:leading-[1.35] [&_small]:text-[#6b7b73]";

/** Counter toggle and date format buttons in the field edit modal */
export const COUNT_BUTTON =
  "min-h-[74px] rounded-lg border border-[#98b8a6] bg-[#fbfdfb] px-[18px] text-[16px] font-extrabold " +
  "text-primary-dark shadow-none hover:border-[#7fa99a] hover:bg-[#edf7f1]";
export const COUNT_BUTTON_ACTIVE =
  "!border-primary-dark !bg-primary-dark !text-white hover:!border-primary-dark hover:!bg-primary-dark hover:!text-white";

/** Section (segment) row */
export const SEGMENTS_ROW =
  "grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-stretch gap-3.5 rounded-lg " +
  "border border-[#b8cbc2] bg-[#edf4f0] px-[18px] pt-4 pb-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,.7)] " +
  "max-bp640:grid-cols-1 max-bp640:p-3";

export const SEGMENTS_TITLE =
  "col-span-full flex min-h-[34px] items-center px-0.5 text-[16px] font-extrabold text-[#203830]";

export const FORMAT_PREVIEW =
  "col-span-full grid gap-[7px] rounded-lg border border-[#abc4b8] bg-[#fbfdfc] px-3.5 py-3 " +
  "[&>span]:text-[14px] [&>span]:font-extrabold [&>span]:text-[#203830] " +
  "[&>strong]:flex [&>strong]:min-h-[44px] [&>strong]:items-center [&>strong]:rounded-[7px] " +
  "[&>strong]:border [&>strong]:border-[#a9c0b5] [&>strong]:bg-white [&>strong]:px-3 " +
  "[&>strong]:font-mono [&>strong]:text-[16px] [&>strong]:font-extrabold [&>strong]:text-[#10231d]";

export const SEGMENT_CARD =
  "grid min-w-0 grid-rows-[auto_1fr_auto] gap-3 overflow-visible rounded-lg border border-[#9eb8ac] " +
  "bg-white shadow-[0_8px_18px_rgba(20,33,28,.08)]";
export const SEGMENT_CARD_DRAGGING = "opacity-45";

export const SEGMENT_HEAD =
  "flex items-center justify-between gap-2.5 border-b border-b-[#9eb8ac] bg-[#d5e6dc] px-3.5 py-3 " +
  "[&>span]:inline-flex [&>span]:min-h-[26px] [&>span]:items-center [&>span]:rounded-full " +
  "[&>span]:bg-primary-dark [&>span]:px-[9px] [&>span]:py-[3px] [&>span]:text-xs [&>span]:font-extrabold " +
  "[&>span]:text-white";

export const SEGMENT_HEAD_LEFT =
  "flex min-w-0 items-center gap-1.5 " +
  "[&_strong]:text-[16px] [&_strong]:font-extrabold [&_strong]:text-[#15251f]";

export const SEGMENT_NAME =
  "grid gap-[7px] px-3.5 pt-3.5 pb-0.5 " +
  "[&>span]:text-[14px] [&>span]:font-extrabold [&>span]:text-[#405049] " +
  "[&_input]:h-11 [&_input]:w-full [&_input]:border-[#a9c0b5] [&_input]:text-[16px]";

export const SEGMENT_AFFIXES =
  "grid grid-cols-2 gap-2.5 px-3.5 pt-0 pb-3 " +
  "[&>label]:grid [&>label]:gap-[7px] " +
  "[&_span]:text-[14px] [&_span]:font-extrabold [&_span]:text-[#405049] " +
  "[&_input]:h-10 [&_input]:w-full [&_input]:border-[#a9c0b5] [&_input]:font-mono [&_input]:text-sm";

export const SEGMENT_ACTIONS =
  "grid grid-cols-2 items-end gap-2 border-t border-t-[#c9d8d1] bg-[#f1f6f3] px-3.5 pt-3 pb-3.5 " +
  "max-bp640:grid-cols-1 " +
  "[&>button]:h-10 [&>button]:min-h-9 [&>button]:w-full [&>button]:max-w-full [&>button]:min-w-0 " +
  "[&>button]:self-end [&>button]:rounded-lg [&>button]:text-[14px] " +
  "[&>button:last-child]:border [&>button:last-child]:border-[#d8b6ba] " +
  "[&>button:last-child]:bg-[#fbf2f2] [&>button:last-child]:text-[#9d3e43] " +
  "[&>button:last-child]:shadow-none";

export const COUNT_SEGMENT =
  "border border-[#98b8a6] bg-[#e7f2ec] text-primary-dark hover:border-[#7fa99a] hover:bg-[#edf7f1]";
export const COUNT_SEGMENT_ACTIVE =
  "!border-primary-dark !bg-primary-dark !text-white hover:!border-primary-dark hover:!bg-primary-dark hover:!text-white";

export const ADD_SEGMENT =
  "col-span-full min-h-11 w-full rounded-lg border border-dashed border-[#8fb3a2] bg-[#e0f0e8] " +
  "text-base font-black text-primary-dark shadow-none hover:border-primary-dark hover:bg-[#d6eadf]";

export const ADD_ROW_BUTTON =
  "h-[38px] min-h-11 w-full cursor-pointer rounded-b-lg border border-t-0 border-dashed border-[#8fb3a2] bg-[#f7faf6] " +
  "text-sm font-extrabold text-primary-dark hover:border-primary hover:bg-primary-soft";

export const ADD_FIELD_BUTTON =
  "flex min-h-11 w-full items-center justify-center gap-[7px] rounded-lg border border-dashed " +
  "border-[#8fb3a2] bg-surface-2 text-primary-dark hover:border-primary hover:bg-primary-soft";

/** Button row at the bottom of the modal; previously .print-export-actions */
export const MODAL_ACTIONS = "flex w-full justify-end gap-2.5 max-bp700:grid max-bp700:grid-cols-1";

export const DATE_FORMAT_GRID =
  "grid grid-cols-4 gap-2 rounded-lg border border-[#d7e2de] bg-white p-3.5 " +
  "shadow-[0_8px_24px_rgba(20,33,28,.07)] max-bp700:grid-cols-2";

export const COUNTER_PAD_TOGGLE = "border-t border-t-[#e1e8e5] pt-3";

export const COUNTER_STOP_BUTTON =
  "mr-auto border-[#d8b6ba] text-[#9d3e43] hover:border-[#c7858b] hover:bg-[#f1dddd]";
