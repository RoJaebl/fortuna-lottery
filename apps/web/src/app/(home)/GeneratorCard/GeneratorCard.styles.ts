import { tv } from "@lib/style/tv";

export const generatorCard = tv({
  slots: {
    modes: "inline-flex gap-1 rounded-pill bg-said p-1",
    modeButton: "rounded-pill px-4 py-1.5 text-micro font-medium tracking-tight transition-colors duration-200",
    numberButton:
      "aspect-square rounded-full text-nano font-semibold tabular-nums transition-colors duration-200",
  },
  variants: {
    active: {
      true: { modeButton: "bg-accent text-on-strong" },
      false: { modeButton: "text-muted hover:text-text" },
    },
    selected: {
      true: { numberButton: "bg-accent text-on-strong" },
      false: { numberButton: "bg-said text-muted hover:bg-inset hover:text-text" },
    },
  },
});
