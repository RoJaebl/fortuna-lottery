import { tv } from "../../lib/style/tv";

/**
 * 단추 — primary 는 채운 실행 단추(strong 은 실행 단추에만 쓴다), secondary 는 테두리, ghost 는 글자만.
 * 모양은 알약형 하나로 맞춰 화면마다 단추가 달라 보이지 않게 한다
 */
export const button = tv({
  base: "inline-flex items-center justify-center gap-1.5 rounded-pill font-semibold tracking-tight transition-[background-color,color,opacity,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
  variants: {
    intent: {
      primary: "bg-strong text-on-strong hover:bg-accent",
      secondary: "border border-line bg-panel text-text hover:border-muted",
      ghost: "text-muted hover:bg-said hover:text-text",
    },
    size: {
      sm: "h-7 px-3.5 text-micro",
      md: "h-9 px-5 text-small",
    },
  },
  defaultVariants: { intent: "primary", size: "md" },
});
