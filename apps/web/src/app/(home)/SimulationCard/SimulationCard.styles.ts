import { tv } from "@lib/style/tv";

export const simulationCard = tv({
  slots: { rankChip: "rounded-pill border px-3 py-1 text-nano font-semibold tabular-nums tracking-tight" },
  variants: {
    emphasized: {
      true: { rankChip: "border-warn/40 bg-warn/10 text-warn" },
      false: { rankChip: "border-line text-text" },
    },
  },
});
