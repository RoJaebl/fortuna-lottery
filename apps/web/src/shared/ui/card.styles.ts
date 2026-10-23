import { tv } from "../lib/style/tv";

export const card = tv({
  slots: {
    root: "rounded-card border border-line bg-panel p-5",
    header: "mb-4",
    title: "text-body font-semibold text-text",
    subtitle: "mt-1 text-micro text-muted",
    footnote: "mt-4 border-t border-line pt-2 text-micro leading-relaxed text-warn",
  },
});
