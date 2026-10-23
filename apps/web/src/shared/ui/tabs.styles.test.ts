import { describe, expect, it } from "vitest";
import { tabs } from "./tabs.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));

// 옮기기 전 tabs.tsx 의 상수 그대로다
const UNDERLINE = {
  list: "flex gap-1 border-b border-line",
  item: "-mb-px border-b-2 px-3 py-2 text-small font-medium transition-colors",
  active: "border-text text-text",
  inactive: "border-transparent text-muted hover:text-text",
};
const CHIP = {
  list: "flex gap-2 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-gutter:stable] md:flex-wrap md:overflow-x-visible",
  item: "shrink-0 rounded-box px-3 py-2 text-micro font-semibold transition-colors",
  active: "bg-text text-bg",
  inactive: "bg-said text-muted hover:bg-inset",
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
