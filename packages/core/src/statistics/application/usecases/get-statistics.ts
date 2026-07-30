import { TOTAL_COMBINATIONS } from "../../../shared/combination";
import type { DrawDataPort } from "../../../lotterietus/application/ports/draw-data.port";
import {
  frequency,
  hotCold,
  lowCountDistribution,
  oddCountDistribution,
  sumDistribution,
  topPairs,
  zoneCounts,
} from "../../domain/calculations";
import type { StatisticsResponse } from "../../dto/statistics.dto";

const GRID_ROUNDS = 52; // 잔디밭: 최근 1년치
const TOP_PAIRS = 15;

/**
 * 통계 유스케이스 — DrawDataPort를 한 번 읽어 8종 통계를 일괄 계산한다.
 * 주 1회 갱신 데이터이므로 호출측에서 캐시(ISR 등) 가능.
 */
export const makeGetStatistics =
  (drawData: DrawDataPort) => async (): Promise<StatisticsResponse> => {
    const draws = await drawData.getAllDraws();
    const latest = draws[draws.length - 1];
    return {
      totalDraws: draws.length,
      latestRound: latest?.round ?? 0,
      frequency: frequency(draws),
      sumDistribution: sumDistribution(draws),
      oddCountDist: oddCountDistribution(draws),
      lowCountDist: lowCountDistribution(draws),
      zoneCounts: zoneCounts(draws),
      hotCold: hotCold(draws),
      topPairs: topPairs(draws, TOP_PAIRS),
      recentGrid: draws.slice(-GRID_ROUNDS).map((d) => ({
        round: d.round,
        numbers: [...d.numbers],
      })),
      totalCombinations: TOTAL_COMBINATIONS,
    };
  };
