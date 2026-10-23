import { tv } from "@lib/style/tv";

export const resultsCard = tv({
  slots: { resultLabel: "shrink-0 text-micro font-semibold" },
  variants: { win: { true: { resultLabel: "text-warn" }, false: { resultLabel: "text-muted" } } },
});
