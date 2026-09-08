/** Options popup shared by Autocomplete and Select */
/**
 * max-h is lower than before (420px) so the popup does not run past the viewport,
 * which used to grow the document and add a second page scrollbar
 * overscroll-contain stops scrolling inside the list from dragging the page along
 */
export const LISTBOX =
  "absolute inset-x-0 top-[calc(100%+8px)] z-[1200] max-h-[300px] overflow-auto overscroll-contain " +
  "scroll-py-1.5 rounded-lg border border-[#b9cbc4] bg-white p-1.5 " +
  "shadow-[0_18px_38px_rgba(23,35,31,.18),0_3px_10px_rgba(23,35,31,.08)]";

export const LISTBOX_OPTION =
  "flex w-full min-h-10 items-center justify-start rounded-md border border-transparent bg-transparent px-2.5 py-[7px] " +
  "text-left text-sm font-bold leading-tight text-[#1a2a24] cursor-pointer " +
  "shadow-none hover:border-[#b7d1c4] hover:bg-primary-soft hover:text-primary-dark " +
  "disabled:cursor-not-allowed disabled:text-[#8c9b95] disabled:opacity-70 disabled:hover:bg-transparent";

export const LISTBOX_OPTION_ACTIVE = "bg-primary-soft text-primary-dark";

/** Currently selected option - the check mark uses Check from lucide */
export const LISTBOX_OPTION_SELECTED =
  "relative gap-2 pr-[34px] bg-primary-soft text-primary-dark border-primary-dark";

export const LISTBOX_CHECK = "absolute top-1/2 right-2.5 -translate-y-1/2";

export const LISTBOX_OPTION_TEXT = "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap";
