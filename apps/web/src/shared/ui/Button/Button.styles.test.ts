import { describe, expect, it } from "vitest";
import { button } from "./Button.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));
const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-pill font-semibold tracking-tight transition-[background-color,color,opacity,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-text focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

describe("button 서식", () => {
  it("아무것도 내리지 않으면 채운 실행 단추(primary) md 다", () => {
    expect(set(button({}))).toEqual(set(`${BASE} h-9 px-5 text-small bg-strong text-on-strong hover:bg-accent`));
  });

  it("secondary 는 테두리만 두른다", () => {
    expect(set(button({ intent: "secondary", size: "sm" }))).toEqual(
      set(`${BASE} h-7 px-3.5 text-micro border border-line bg-panel text-text hover:border-muted`),
    );
  });

  it("ghost 는 바탕 없이 글자만 보인다", () => {
    expect(set(button({ intent: "ghost", size: "sm" }))).toEqual(
      set(`${BASE} h-7 px-3.5 text-micro text-muted hover:bg-said hover:text-text`),
    );
  });
});
