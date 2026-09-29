import { Inject, Injectable } from "@nestjs/common";
import type { PicksSaveRequest } from "@fortuna-lottery/contract/picks";
import { createCombination, err, ok, type Result } from "@fortuna-lottery/kernel";
import type { Pick } from "../domain/model/Pick.model.js";
import { CLOCK, type ClockPort } from "../domain/port/ClockPort.js";
import { ID_GENERATOR, type IdGeneratorPort } from "../domain/port/IdGeneratorPort.js";
import { PICK_REPOSITORY, type PickRepositoryPort } from "../domain/port/PickRepositoryPort.js";

/** 픽 저장 유스케이스 — 검증(사용자·조합) → 저장 */
@Injectable()
export class SavePick {
  constructor(
    @Inject(PICK_REPOSITORY) private readonly repository: PickRepositoryPort,
    @Inject(ID_GENERATOR) private readonly idGenerator: IdGeneratorPort,
    @Inject(CLOCK) private readonly clock: ClockPort,
  ) {}

  async execute(userId: string, request: PicksSaveRequest): Promise<Result<Pick>> {
    if (!userId) return err("사용자 식별자가 없습니다");
    const combination = createCombination(request.numbers);
    if (!combination.ok) return combination;

    const pick: Pick = {
      id: this.idGenerator(),
      userId,
      numbers: combination.value,
      createdAt: this.clock().toISOString(),
    };
    await this.repository.save(pick);
    return ok(pick);
  }
}
