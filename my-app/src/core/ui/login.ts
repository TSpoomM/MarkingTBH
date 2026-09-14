/** Login page styles */
export const LOGIN_PAGE =
  "screen-only relative grid min-h-screen w-full place-items-center overflow-hidden bg-canvas px-4 py-10";

/** Wraps every LOGIN_BLOBS entry so individual blobs don't repeat "absolute pointer-events-none" */
export const LOGIN_BLOB_LAYER = "pointer-events-none absolute inset-0 overflow-hidden";

/**
 * Reference-style geometric backdrop, tuned to the app's green/white theme.
 * Ordered back-to-front (front ones sit closer to the card).
 */
export const LOGIN_BLOBS = [
  "absolute -right-[8vw] -top-[16vw] size-[42vw] min-h-[520px] min-w-[520px] rounded-full bg-primary-soft " +
    "max-bp700:-right-[160px] max-bp700:-top-[190px] max-bp700:size-[360px] max-bp700:min-h-0 max-bp700:min-w-0",
  "absolute -bottom-[35vw] right-[-3vw] size-[62vw] min-h-[760px] min-w-[760px] rounded-full bg-primary/90 " +
    "max-bp900:-bottom-[300px] max-bp900:-right-[280px] max-bp900:size-[620px] max-bp900:min-h-0 max-bp900:min-w-0 " +
    "max-bp700:-bottom-[250px] max-bp700:-right-[300px] max-bp700:size-[500px]",
  "absolute -left-[58px] top-[28%] size-[214px] rounded-full bg-primary-dark/85 " +
    "max-bp900:-left-[80px] max-bp900:size-[150px] max-bp700:-left-[96px] max-bp700:top-auto max-bp700:bottom-[12%]",
  "absolute left-[10%] top-[12%] h-[28px] w-[118px] rounded-full bg-white/80 " +
    "max-bp900:hidden",
  "absolute bottom-[14%] left-[22%] size-[72px] rounded-full bg-primary-soft max-bp900:hidden",
];

export const LOGIN_CARD =
  "relative z-[1] grid w-full max-w-[620px] gap-4 rounded-lg border border-[#d7e2de] bg-white px-12 py-10 " +
  "shadow-[0_18px_48px_rgba(20,33,28,.12)] max-bp700:max-w-[calc(100vw-28px)] max-bp700:px-6 max-bp700:py-8";

export const LOGIN_HEADER = "mb-4 grid justify-items-center gap-2 text-center";

export const LOGIN_TITLE_TH = "m-0 text-[20px] font-semibold text-muted max-bp700:text-[18px]";

export const LOGIN_TITLE_EN = "m-0 text-[24px] font-extrabold text-ink max-bp700:text-[21px]";

export const LOGIN_SUBTITLE = "m-0 text-[15px] font-medium text-muted max-bp700:text-sm";

export const LOGIN_ERROR =
  "rounded-full border border-[#f0b8b8] bg-[#fff6f6] px-4 py-2.5 text-center text-base font-semibold text-[#943039]";

export const LOGIN_FIELD_WRAP = "relative flex items-center";

export const LOGIN_INPUT =
  "h-[54px] w-full rounded-lg border border-[#c8d3cf] bg-white px-4 pr-12 text-[20px] text-[#16231e] " +
  "outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#7f8d87] " +
  "focus:border-primary focus:shadow-[0_0_0_4px_var(--focus)] " +
  "disabled:cursor-not-allowed disabled:bg-[#eef2f0] disabled:text-[#7b8a84]";

export const LOGIN_TOGGLE_PASSWORD =
  "absolute right-4 grid place-items-center rounded-full text-primary hover:text-primary-dark " +
  "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--focus)] rounded-full";

export const LOGIN_SUBMIT =
  "mt-0.5 h-[52px] w-full cursor-pointer rounded-lg border border-primary-dark bg-primary " +
  "text-[20px] font-black text-white shadow-[0_10px_22px_rgba(15,118,110,.22)] " +
  "transition-[transform,box-shadow,opacity] duration-150 " +
  "hover:enabled:-translate-y-px hover:enabled:bg-primary-dark hover:enabled:shadow-[0_14px_28px_rgba(15,118,110,.28)] " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:translate-y-0";

export const LOGIN_FOOTER_LINKS = "mt-1 flex items-center justify-between text-base font-medium text-[#767f7a]";

export const LOGIN_FOOTER_LINK = "cursor-not-allowed no-underline hover:text-[#767f7a]";
