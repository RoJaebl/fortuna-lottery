import type { ResultsCheckResponse } from "@fortuna-lottery/contract/results";
import { ResultsCheckModel, ResultsDrawModel } from "../../model/ResultsCheck.model";
import { ResultsCheckItemModel } from "../../model/ResultsCheckItem.model";

/** 번역측은 스키마로 파싱하지 않고 자기 원형으로 옮긴다(wire-contract 규칙 3절) — 받는 값이 unknown 이라 여기서 한 번 좁힌다 */
export function checkResultsResponse(res: unknown): ResultsCheckModel {
  const dto = res as ResultsCheckResponse;
  return Object.assign(new ResultsCheckModel(), {
    draw: dto.draw
      ? Object.assign(new ResultsDrawModel(), {
          round: dto.draw.round,
          numbers: [...dto.draw.numbers],
          bonus: dto.draw.bonus,
        })
      : null,
    items: dto.items.map((item) =>
      Object.assign(new ResultsCheckItemModel(), {
        pickId: item.pickId,
        numbers: [...item.numbers],
        matchedNumbers: [...item.matchedNumbers],
        matchedCount: item.matchedCount,
        bonusMatched: item.bonusMatched,
        rank: item.rank,
      }),
    ),
  });
}
