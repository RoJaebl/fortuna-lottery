import type { Pick } from "../model/Pick.model.js";
import type { PickRepositoryPort } from "../port/PickRepositoryPort.js";

/**
 * 인메모리 픽 저장소 — MVP 전용 (프로세스 재시작 시 휘발).
 * PickRepositoryPort 뒤에 있으므로 Supabase 어댑터 교체 시 유스케이스 무수정.
 */
export class InMemoryPickRepository implements PickRepositoryPort {
  private readonly store = new Map<string, Pick>();

  save = async (pick: Pick): Promise<void> => {
    this.store.set(pick.id, pick);
  };

  findAllByUser = async (userId: string): Promise<Pick[]> =>
    [...this.store.values()].filter((p) => p.userId === userId);

  deleteById = async (userId: string, pickId: string): Promise<boolean> => {
    const existing = this.store.get(pickId);
    if (!existing || existing.userId !== userId) return false;
    return this.store.delete(pickId);
  };
}
