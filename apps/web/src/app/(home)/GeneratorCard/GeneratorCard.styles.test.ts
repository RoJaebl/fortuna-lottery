import { describe, expect, it } from "vitest";
import { generatorCard } from "./GeneratorCard.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));
const MODE = "rounded-pill px-4 py-1.5 text-micro font-medium tracking-tight transition-colors duration-200";
const NUM = "aspect-square rounded-full text-nano font-semibold tabular-nums transition-colors duration-200";

describe("generatorCard 서식", () => {
  const s = generatorCard();

  it("모드 묶음은 알약 하나 안에 단추를 모은다", () => {
    expect(set(s.modes())).toEqual(set("inline-flex gap-1 rounded-pill bg-said p-1"));
  });

  it("modeButton 은 고른 모드만 강조색으로 채운다", () => {
    expect(set(s.modeButton({ active: true }))).toEqual(set(`${MODE} bg-accent text-on-strong`));
    expect(set(s.modeButton({ active: false }))).toEqual(set(`${MODE} text-muted hover:text-text`));
  });

  it("numberButton 은 고른 번호만 강조색으로 채운다", () => {
    expect(set(s.numberButton({ selected: true }))).toEqual(set(`${NUM} bg-accent text-on-strong`));
    expect(set(s.numberButton({ selected: false }))).toEqual(
      set(`${NUM} bg-said text-muted hover:bg-inset hover:text-text`),
    );
  });
});
