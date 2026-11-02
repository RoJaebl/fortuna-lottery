import { describe, expect, it } from "vitest";
import { simulationCard } from "./SimulationCard.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));
const BASE = "rounded-pill border px-3 py-1 text-nano font-semibold tabular-nums tracking-tight";

describe("simulationCard 서식", () => {
  const s = simulationCard();

  it("rankChip 은 강조할 등수만 옅은 신호색 알약이고, 나머지는 테두리만 두른다", () => {
    expect(set(s.rankChip({ emphasized: true }))).toEqual(set(`${BASE} border-warn/40 bg-warn/10 text-warn`));
    expect(set(s.rankChip({ emphasized: false }))).toEqual(set(`${BASE} border-line text-text`));
  });
});
