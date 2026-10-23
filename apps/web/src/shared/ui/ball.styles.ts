import { tv } from "../lib/style/tv";

export const ball = tv({
  base: "inline-flex items-center justify-center rounded-full font-bold tabular-nums select-none",
  variants: {
    size: { sm: "h-7 w-7 text-micro", md: "h-9 w-9 text-small", lg: "h-11 w-11 text-body" },
    dimmed: { true: "opacity-30" },
    ring: { true: "ring-2 ring-text" },
  },
  defaultVariants: { size: "md" },
});
