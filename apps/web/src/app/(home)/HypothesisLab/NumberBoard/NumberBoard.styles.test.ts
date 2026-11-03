import { describe, expect, it } from "vitest";
import { numberBoard } from "./NumberBoard.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));
const CELL =
  "flex flex-col items-center gap-0.5 rounded-box py-1.5 transition-[background-color,color,opacity] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-text disabled:cursor-not-allowed";

describe("numberBoard 서식", () => {
  const s = numberBoard();

  it("고른 번호는 강조색으로 채운다", () => {
    expect(set(s.cell({ state: "selected" }))).toEqual(set(`${CELL} bg-accent text-on-strong`));
    expect(set(s.count({ state: "selected" }))).toEqual(set("text-pico tabular-nums text-on-strong/80"));
  });

  it("고를 수 있는 번호는 또렷하게 두고 마우스에 옅은 면을 깐다", () => {
    expect(set(s.cell({ state: "possible" }))).toEqual(set(`${CELL} text-text hover:bg-said`));
    expect(set(s.count({ state: "possible" }))).toEqual(set("text-pico tabular-nums text-muted"));
  });

  it("이 가정 아래 만들 수 없는 번호는 흐리게 둔다", () => {
    expect(set(s.cell({ state: "impossible" }))).toEqual(set(`${CELL} text-muted opacity-35`));
    expect(set(s.count({ state: "impossible" }))).toEqual(set("text-pico tabular-nums text-muted"));
  });
});
