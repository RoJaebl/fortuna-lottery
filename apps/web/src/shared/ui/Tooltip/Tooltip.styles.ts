import { tv } from "../../lib/style/tv";

export const tooltipRoot = tv({ base: "group relative inline-flex align-middle" });

export const tooltipTrigger = tv({
  base: "inline-flex h-4 w-4 items-center justify-center rounded-full text-micro text-muted transition-colors hover:text-text focus-visible:text-text focus-visible:outline-none",
});

/** 옅은 면과 부드러운 그림자 — 투명도·위치만 천천히 바뀐다 */
export const tooltipBubble = tv({
  base: "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-64 -translate-x-1/2 translate-y-1 rounded-box border border-line/70 bg-raised px-3 py-2 text-left text-nano font-normal normal-case tracking-normal text-text opacity-0 shadow-lg transition duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100",
});
