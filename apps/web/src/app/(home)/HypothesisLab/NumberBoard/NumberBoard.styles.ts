import { tv } from "@lib/style/tv";

/** 번호판 칸 — 고른 번호 · 고를 수 있는 번호 · 이 가정 아래 만들 수 없는 번호 */
export const numberBoard = tv({
  slots: {
    cell: "flex flex-col items-center gap-0.5 rounded-box py-1.5 transition-[background-color,color,opacity] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-text disabled:cursor-not-allowed",
    count: "text-pico tabular-nums",
  },
  variants: {
    state: {
      selected: { cell: "bg-accent text-on-strong", count: "text-on-strong/80" },
      possible: { cell: "text-text hover:bg-said", count: "text-muted" },
      impossible: { cell: "text-muted opacity-35", count: "text-muted" },
    },
  },
});
