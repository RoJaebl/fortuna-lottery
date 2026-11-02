import { tv } from "@lib/style/tv";

export const patternDistribution = tv({
  slots: {
    bar: "w-full rounded-t-[3px] transition-[height,background-color] duration-300",
    barLabel: "text-pico tabular-nums",
  },
  variants: {
    highlighted: {
      true: { bar: "bg-warn", barLabel: "font-semibold text-warn" },
      false: { bar: "bg-accent/60", barLabel: "text-muted" },
    },
  },
});
