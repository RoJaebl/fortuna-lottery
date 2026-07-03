import type { ResultsResponse } from "@lotto-lab/core/results/dto";
import type { ResultsModel } from "../../model/results.model";

export function assembleResults(dto: ResultsResponse): ResultsModel {
  return {
    draw: dto.draw
      ? { round: dto.draw.round, numbers: [...dto.draw.numbers], bonus: dto.draw.bonus }
      : null,
    items: dto.items.map((item) => ({
      pickId: item.pickId,
      numbers: [...item.numbers],
      matchedNumbers: [...item.matchedNumbers],
      matchedCount: item.matchedCount,
      bonusMatched: item.bonusMatched,
      rank: item.rank,
    })),
  };
}
