import { createCombination } from "../../../shared/combination";
import { scoreAgainstDraw } from "../../../shared/scoring";
import type { DrawDataPort } from "../../../lotterietus/application/ports/draw-data.port";
import type { PickRepositoryPort } from "../../../picks/application/ports/pick-repository.port";
import type { ResultsResponse } from "../../dto/results.dto";

/**
 * 당첨 대조 유스케이스 — 저장된 픽을 최신 회차와 대조해 채점한다.
 * 근접 정도(matchedNumbers)는 사실 그대로 제공한다 (과장 없음 — 다크패턴 회피).
 */
export const makeCheckResults =
  (pickRepository: PickRepositoryPort, drawData: DrawDataPort) =>
  async (userId: string): Promise<ResultsResponse> => {
    const [picks, draws] = await Promise.all([
      pickRepository.findAllByUser(userId),
      drawData.getAllDraws(),
    ]);
    const latest = draws[draws.length - 1];
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

    return {
      draw: {
        round: latest.round,
        numbers: [...latest.numbers],
        bonus: latest.bonus,
        drawnAt: latest.drawnAt,
      },
      items,
    };
  };
