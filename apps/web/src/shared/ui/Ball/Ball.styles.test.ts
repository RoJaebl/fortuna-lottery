import { describe, expect, it } from "vitest";
import { ball } from "./Ball.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));
const BASE =
  "inline-flex items-center justify-center rounded-full font-semibold tabular-nums tracking-tight select-none shadow-[inset_0_-2px_0_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.3)]";

describe("ball 서식", () => {
  it("크기·흐림·링을 모두 켜면 조각이 모두 붙는다", () => {
    expect(set(ball({ size: "sm", dimmed: true, ring: true }))).toEqual(
      set(`${BASE} h-7 w-7 text-nano opacity-30 ring-2 ring-text ring-offset-2 ring-offset-panel`),
    );
  });

  it("아무것도 내리지 않으면 md 이고 흐림·링이 없다", () => {
    const cls = set(ball({}));
    expect(cls).toEqual(set(`${BASE} h-9 w-9 text-micro`));
    expect(cls.has("opacity-30")).toBe(false);
    expect(cls.has("ring-2")).toBe(false);
  });
});
