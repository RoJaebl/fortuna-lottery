import { describe, expect, it } from "vitest";
import { tabs } from "./Tabs.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));

const UNDERLINE = {
  list: "flex gap-5 border-b border-line/80",
  item: "-mb-px border-b-2 pb-2.5 pt-1 text-small tracking-tight transition-colors duration-200",
  active: "border-text font-semibold text-text",
  inactive: "border-transparent text-muted hover:text-text",
};
const CHIP = {
  list: "flex gap-1.5 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-gutter:stable] md:flex-wrap md:overflow-x-visible",
  item: "shrink-0 rounded-pill border px-3.5 py-1.5 text-nano font-medium transition-colors duration-200",
  active: "border-text bg-text text-bg",
  inactive: "border-line text-muted hover:border-muted hover:text-text",
};

describe("tabs 서식", () => {
  for (const [variant, style] of [
    ["underline", UNDERLINE],
    ["chip", CHIP],
  ] as const) {
    it(`${variant} 의 목록`, () => {
      expect(set(tabs({ variant }).list())).toEqual(set(style.list));
    });
    it(`${variant} 의 선택된 항목`, () => {
      expect(set(tabs({ variant }).item({ selected: true }))).toEqual(set(`${style.item} ${style.active}`));
    });
    it(`${variant} 의 선택되지 않은 항목`, () => {
      expect(set(tabs({ variant }).item({ selected: false }))).toEqual(set(`${style.item} ${style.inactive}`));
    });
  }
});
