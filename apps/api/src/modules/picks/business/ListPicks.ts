import { Inject, Injectable } from "@nestjs/common";
import type { Pick } from "../domain/model/Pick.model.js";
import { PICK_REPOSITORY, type PickRepositoryPort } from "../domain/port/PickRepositoryPort.js";

/** 픽 목록 유스케이스 — 최신 저장순 */
@Injectable()
export class ListPicks {
  constructor(@Inject(PICK_REPOSITORY) private readonly repository: PickRepositoryPort) {}

  async execute(userId: string): Promise<Pick[]> {
    const picks = await this.repository.findAllByUser(userId);
    return picks.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
