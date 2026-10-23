import { describe, expect, it } from "vitest";
import { resultsCard } from "./ResultsCard.styles";

const set = (cls: string) => new Set(cls.split(" ").filter(Boolean));
const BASE = "shrink-0 text-micro font-semibold";

describe("resultsCard 서식", () => {
  const s = resultsCard();

  it("resultLabel 은 win 참·거짓 모두 지금 화면의 클래스를 낸다", () => {
    expect(set(s.resultLabel({ win: true }))).toEqual(set(`${BASE} text-warn`));
    expect(set(s.resultLabel({ win: false }))).toEqual(set(`${BASE} text-muted`));
  });
});
