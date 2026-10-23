import { tv } from "@lib/style/tv";

export const simulationCard = tv({
  slots: { rankChip: "rounded-box px-3 py-2 text-small font-semibold" },
  variants: {
    emphasized: {
      true: { rankChip: "border border-warn text-warn" },
      false: { rankChip: "bg-said text-text" },
    },
  },
});
