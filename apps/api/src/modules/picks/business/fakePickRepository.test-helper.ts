import type { Pick } from "../domain/model/Pick.model.js";
import type { PickRepositoryPort } from "../domain/port/PickRepositoryPort.js";

/** 유스케이스 시험용 대역 — 포트만 구현하며 어댑터를 가져오지 않는다. */
export class FakePickRepository implements PickRepositoryPort {
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
