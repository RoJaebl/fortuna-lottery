import { Inject, Injectable } from "@nestjs/common";
import type { ResultsCheckInput } from "../domain/model/ResultsCheck.model.js";
import { DRAW_HISTORY, type DrawHistoryPort } from "../domain/port/DrawHistoryPort.js";
import { PICK_SOURCE, type PickSourcePort } from "../domain/port/PickSourcePort.js";

/**
 * 대조 재료를 모은다 — 사용자의 픽과 과거 회차를 두 포트에서 함께 받아, 기준 회차(최신 회차) 하나 아래 픽을 묶는다.
 * 판정하지 않는다(backend-module-layout 규칙 4절) — 등수는 business/CheckResults 가 매긴다.
 */
@Injectable()
export class ResultsCheckContext {
  constructor(
    @Inject(PICK_SOURCE) private readonly pickSource: PickSourcePort,
    @Inject(DRAW_HISTORY) private readonly drawHistory: DrawHistoryPort,
  ) {}

  async assemble(userId: string): Promise<ResultsCheckInput> {
    const [picks, draws] = await Promise.all([this.pickSource.listByUser(userId), this.drawHistory.findAll()]);
    return { draw: draws[draws.length - 1] ?? null, picks };
  }
}
