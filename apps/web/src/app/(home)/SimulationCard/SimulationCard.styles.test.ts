import { describe, expect, it } from "vitest";
import { simulationCard } from "./SimulationCard.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));
const BASE = "rounded-box px-3 py-2 text-small font-semibold";

describe("simulationCard 서식", () => {
  const s = simulationCard();

  it("rankChip 은 emphasized 참·거짓 모두 지금 화면의 클래스를 낸다", () => {
    expect(set(s.rankChip({ emphasized: true }))).toEqual(set(`${BASE} border border-warn text-warn`));
    expect(set(s.rankChip({ emphasized: false }))).toEqual(set(`${BASE} bg-said text-text`));
  });
});
