import { describe, expect, it } from "vitest";
import { generatorCard } from "./GeneratorCard.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));
const MODE = "rounded-box px-3 py-2 text-small font-medium transition-colors";
const NUM = "rounded-button py-1 text-micro font-semibold tabular-nums transition-colors";

describe("generatorCard 서식", () => {
  const s = generatorCard();

  it("modeButton 은 active 참·거짓 모두 지금 화면의 클래스를 낸다", () => {
    expect(set(s.modeButton({ active: true }))).toEqual(set(`${MODE} bg-accent text-on-strong`));
    expect(set(s.modeButton({ active: false }))).toEqual(set(`${MODE} bg-said text-text hover:bg-inset`));
  });

  it("numberButton 은 selected 참·거짓 모두 지금 화면의 클래스를 낸다", () => {
    expect(set(s.numberButton({ selected: true }))).toEqual(set(`${NUM} bg-accent text-on-strong`));
    expect(set(s.numberButton({ selected: false }))).toEqual(set(`${NUM} bg-said text-muted hover:bg-inset`));
  });
});
