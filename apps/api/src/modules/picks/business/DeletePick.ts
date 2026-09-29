import { Inject, Injectable } from "@nestjs/common";
import { err, ok, type Result } from "@fortuna-lottery/kernel";
import { PICK_REPOSITORY, type PickRepositoryPort } from "../domain/port/PickRepositoryPort.js";

/** 픽 삭제 유스케이스 — 소유자 검증 포함 */
@Injectable()
export class DeletePick {
  constructor(@Inject(PICK_REPOSITORY) private readonly repository: PickRepositoryPort) {}

  async execute(userId: string, pickId: string): Promise<Result<{ deleted: true }>> {
    const deleted = await this.repository.deleteById(userId, pickId);
    if (!deleted) return err("삭제할 픽을 찾을 수 없습니다");
    return ok({ deleted: true });
  }
}
