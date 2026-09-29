import { Inject, Injectable } from "@nestjs/common";
import { createCombination, scoreAgainstDraw } from "@fortuna-lottery/kernel";
import { ResultsCheckContext } from "../context/ResultsCheckContext.js";
import type { ResultsCheck } from "../domain/model/ResultsCheck.model.js";

/**
 * 당첨 대조 유스케이스 — 저장된 픽을 최신 회차와 대조해 채점한다.
 * 근접 정도(matchedNumbers)는 사실 그대로 제공한다 (과장 없음 — 다크패턴 회피).
 */
@Injectable()
export class CheckResults {
  constructor(@Inject(ResultsCheckContext) private readonly context: ResultsCheckContext) {}

  async execute(userId: string): Promise<ResultsCheck> {
    const { draw: latest, picks } = await this.context.assemble(userId);
    if (!latest) {
      return { draw: null, items: [] };
    }

    const items = picks
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((pick) => {
        // 저장 시 검증된 조합이지만 채점 전 안전하게 재검증
        const combo = createCombination(pick.numbers);
        const score = combo.ok
          ? scoreAgainstDraw(combo.value, latest.numbers, latest.bonus)
          : { matchedNumbers: [], matchedCount: 0, bonusMatched: false, rank: 0 as const };
        return {
          pickId: pick.id,
          numbers: [...pick.numbers],
          matchedNumbers: [...score.matchedNumbers],
          matchedCount: score.matchedCount,
          bonusMatched: score.bonusMatched,
          rank: score.rank,
        };
      });

    return { draw: latest, items };
  }
}
