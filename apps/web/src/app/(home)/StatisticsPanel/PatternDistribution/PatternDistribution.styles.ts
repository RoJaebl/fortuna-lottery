import { tv } from "@lib/style/tv";

export const patternDistribution = tv({
  slots: { bar: "w-full rounded-t", barLabel: "text-nano" },
  variants: {
    highlighted: {
      true: { bar: "bg-warn", barLabel: "font-bold text-warn" },
      false: { bar: "bg-accent/70", barLabel: "text-muted" },
    },
  },
});
