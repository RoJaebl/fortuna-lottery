import type { PickEntity } from "../../domain/pick.entity";
import type { PickRepositoryPort } from "../../application/ports/pick-repository.port";

/**
 * 인메모리 픽 저장소 — MVP 전용 (프로세스 재시작 시 휘발).
 * PickRepositoryPort 뒤에 있으므로 Supabase 어댑터 교체 시 유스케이스 무수정.
 */
export function createInMemoryPickRepository(): PickRepositoryPort {
  const store = new Map<string, PickEntity>();
  return {
    async save(pick) {
      store.set(pick.id, pick);
    },
    async findAllByUser(userId) {
      return [...store.values()].filter((p) => p.userId === userId);
    },
    async deleteById(userId, pickId) {
      const existing = store.get(pickId);
      if (!existing || existing.userId !== userId) return false;
      return store.delete(pickId);
    },
  };
}
