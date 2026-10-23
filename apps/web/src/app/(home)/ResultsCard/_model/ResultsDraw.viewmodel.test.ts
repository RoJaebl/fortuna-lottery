import { describe, expect, it } from "vitest";
import { ResultsDrawModel } from "./ResultsDraw.model";
import { ResultsDrawViewModel } from "./ResultsDraw.viewmodel";

describe("ResultsDrawViewModel", () => {
  it("balls — 본 번호 뒤에 보너스가 한 개 붙는다", () => {
    const m = Object.assign(new ResultsDrawModel(), { round: 7, numbers: [1, 2, 3, 4, 5, 6], bonus: 9 });
    const vm = ResultsDrawViewModel.from(m);
    expect(vm.round).toBe(7);
    expect(vm.balls).toEqual([
      { n: 1, bonus: false },
      { n: 2, bonus: false },
      { n: 3, bonus: false },
      { n: 4, bonus: false },
      { n: 5, bonus: false },
      { n: 6, bonus: false },
      { n: 9, bonus: true },
    ]);
  });
});
