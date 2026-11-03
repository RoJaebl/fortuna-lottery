import { describe, expect, it } from "vitest";
import { resultsCard } from "./ResultsCard.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));
const BASE = "shrink-0 rounded-pill px-2.5 py-0.5 text-nano font-semibold tracking-tight";

describe("resultsCard 서식", () => {
  const s = resultsCard();

  it("resultLabel 은 당첨이면 옅은 신호색 알약, 아니면 흐린 글자다", () => {
    expect(set(s.resultLabel({ win: true }))).toEqual(set(`${BASE} bg-warn/10 text-warn`));
    expect(set(s.resultLabel({ win: false }))).toEqual(set(`${BASE} text-muted`));
  });
});
