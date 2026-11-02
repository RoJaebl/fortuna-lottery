import { tv } from "../../lib/style/tv";

/** 공 — 색은 규칙대로 두고, 아래쪽에 옅은 그늘을 넣어 납작한 원이 아니라 공처럼 보이게 한다 */
export const ball = tv({
  base: "inline-flex items-center justify-center rounded-full font-semibold tabular-nums tracking-tight select-none shadow-[inset_0_-2px_0_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3)]",
  variants: {
    size: { sm: "h-7 w-7 text-nano", md: "h-9 w-9 text-micro", lg: "h-11 w-11 text-small" },
    dimmed: { true: "opacity-30" },
    ring: { true: "ring-2 ring-text ring-offset-2 ring-offset-panel" },
  },
  defaultVariants: { size: "md" },
});
