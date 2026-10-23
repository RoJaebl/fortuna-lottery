import { Inject, Injectable } from "@nestjs/common";
import type {
  HypothesisEvaluateRequest,
  HypothesisEvaluateResponse,
  HypothesisGenerateRequest,
  HypothesisGenerateResponse,
  HypothesisPopularityRequest,
  HypothesisPopularityResponse,
} from "@fortuna-lottery/contract/hypothesis";
import { RequestRejected } from "../../../../infrastructure/http/RequestRejected.js";
import { CheckPopularity } from "../../business/CheckPopularity.js";
import { EvaluateAssumption } from "../../business/EvaluateAssumption.js";
import { GenerateAssumed } from "../../business/GenerateAssumed.js";

@Injectable()
export class HypothesisFacade {
  constructor(
    @Inject(EvaluateAssumption) private readonly evaluateAssumption: EvaluateAssumption,
    @Inject(GenerateAssumed) private readonly generateAssumed: GenerateAssumed,
    @Inject(CheckPopularity) private readonly checkPopularity: CheckPopularity,
  ) {}

  async evaluate(request: HypothesisEvaluateRequest): Promise<HypothesisEvaluateResponse> {
    const result = await this.evaluateAssumption.execute(request);
    if (!result.ok) throw new RequestRejected(result.error);
    const e = result.value;
    // 도메인 원형을 계약 모양으로 옮긴다 — 읽기 전용 배열을 가변 복사본으로
    return {
      totalCombinations: e.totalCombinations,
      assumedCombinations: e.assumedCombinations,
      pool: [...e.pool],
      hitRate: { ...e.hitRate },
      backtest: {
        assumed: { tickets: e.backtest.assumed.tickets, rankCounts: [...e.backtest.assumed.rankCounts] },
        random: { tickets: e.backtest.random.tickets, rankCounts: [...e.backtest.random.rankCounts] },
      },
    };
  }

  async generate(request: HypothesisGenerateRequest): Promise<HypothesisGenerateResponse> {
    const result = await this.generateAssumed.execute(request);
    if (!result.ok) throw new RequestRejected(result.error);
    return { numbers: [...result.value] };
  }

  async popularity(request: HypothesisPopularityRequest): Promise<HypothesisPopularityResponse> {
    const result = await this.checkPopularity.execute(request);
    if (!result.ok) throw new RequestRejected(result.error);
    return { patterns: result.value };
  }
}
