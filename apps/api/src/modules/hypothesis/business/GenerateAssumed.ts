import { Inject, Injectable } from "@nestjs/common";
import type { HypothesisGenerateRequest } from "@fortuna-lottery/contract/hypothesis";
import type { Combination, Result } from "@fortuna-lottery/kernel";
import { DRAW_HISTORY, type DrawHistoryPort } from "../domain/port/DrawHistoryPort.js";
import { RNG, type RandomPort } from "../domain/port/RandomPort.js";
import { assumedCombinations, combinationKey } from "./assumption.js";
import { drawAssumed } from "./drawAssumed.js";
import { toAssumption } from "./EvaluateAssumption.js";

/** 가정 우주 안에서 조합 하나를 뽑는 유스케이스 */
@Injectable()
export class GenerateAssumed {
  constructor(
    @Inject(DRAW_HISTORY) private readonly drawHistory: DrawHistoryPort,
    @Inject(RNG) private readonly random: RandomPort,
  ) {}

  async execute(request: HypothesisGenerateRequest): Promise<Result<Combination>> {
    const assumption = toAssumption(request);
    const draws = await this.drawHistory.findAll();
    const { pool, count } = assumedCombinations(assumption, draws);
    const pastKeys = new Set(draws.map((d) => combinationKey(d.numbers)));
    return drawAssumed(this.random, assumption, pool, pastKeys, count);
  }
}
