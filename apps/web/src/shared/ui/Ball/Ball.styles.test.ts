import { describe, expect, it } from "vitest";
import { ball } from "./Ball.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));
const BASE = "inline-flex items-center justify-center rounded-full font-bold tabular-nums select-none";

describe("ball 서식", () => {
  it("크기·흐림·링을 모두 켜면 조각이 모두 붙는다", () => {
    expect(set(ball({ size: "sm", dimmed: true, ring: true }))).toEqual(
      set(`${BASE} h-7 w-7 text-micro opacity-30 ring-2 ring-text`),
    );
  });

  it("아무것도 내리지 않으면 md 이고 흐림·링이 없다", () => {
    const cls = set(ball({}));
    expect(cls).toEqual(set(`${BASE} h-9 w-9 text-small`));
    expect(cls.has("opacity-30")).toBe(false);
    expect(cls.has("ring-2")).toBe(false);
  });
});
