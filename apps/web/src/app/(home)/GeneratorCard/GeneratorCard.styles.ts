import { tv } from "@lib/style/tv";

export const generatorCard = tv({
  slots: {
    modeButton: "rounded-box px-3 py-2 text-small font-medium transition-colors",
    numberButton: "rounded-button py-1 text-micro font-semibold tabular-nums transition-colors",
  },
  variants: {
    active: {
      true: { modeButton: "bg-accent text-on-strong" },
      false: { modeButton: "bg-said text-text hover:bg-inset" },
    },
    selected: {
      true: { numberButton: "bg-accent text-on-strong" },
      false: { numberButton: "bg-said text-muted hover:bg-inset" },
    },
  },
});
