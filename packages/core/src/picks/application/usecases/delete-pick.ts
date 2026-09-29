import { err, ok, type Result } from "@fortuna-lottery/kernel";
import type { PickRepositoryPort } from "../ports/pick-repository.port";

/** 픽 삭제 유스케이스 — 소유자 검증 포함 */
export const makeDeletePick =
  (repository: PickRepositoryPort) =>
  async (userId: string, pickId: string): Promise<Result<{ deleted: true }>> => {
    const deleted = await repository.deleteById(userId, pickId);
    if (!deleted) return err("삭제할 픽을 찾을 수 없습니다");
    return ok({ deleted: true });
  };
