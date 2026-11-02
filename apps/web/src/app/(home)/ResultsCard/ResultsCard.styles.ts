import { tv } from "@lib/style/tv";

export const resultsCard = tv({
  slots: { resultLabel: "shrink-0 rounded-pill px-2.5 py-0.5 text-nano font-semibold tracking-tight" },
  variants: {
    win: { true: { resultLabel: "bg-warn/10 text-warn" }, false: { resultLabel: "text-muted" } },
  },
});
