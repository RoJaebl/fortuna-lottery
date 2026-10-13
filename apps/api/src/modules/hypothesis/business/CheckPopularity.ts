import { Inject, Injectable } from "@nestjs/common";
import type { HypothesisPopularityRequest } from "@fortuna-lottery/contract/hypothesis";
import { createCombination, ok, type Result } from "@fortuna-lottery/kernel";
import { DRAW_HISTORY, type DrawHistoryPort } from "../domain/port/DrawHistoryPort.js";
import { popularityPatterns, type PopularityPattern } from "./popularity.js";

/** 인기 패턴 검사 유스케이스 — 조합 검증 후 걸리는 패턴을 모은다 */
@Injectable()
export class CheckPopularity {
  constructor(@Inject(DRAW_HISTORY) private readonly drawHistory: DrawHistoryPort) {}

  async execute(request: HypothesisPopularityRequest): Promise<Result<PopularityPattern[]>> {
    const combo = createCombination(request.numbers);
    if (!combo.ok) return combo;
    return ok(popularityPatterns(combo.value, await this.drawHistory.findAll()));
  }
}
