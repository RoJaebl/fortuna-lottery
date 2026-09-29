import type { PicksItem } from "@fortuna-lottery/contract/picks";
import type { PickRepositoryPort } from "../ports/pick-repository.port";

/** 픽 목록 유스케이스 — 최신 저장순 */
export const makeListPicks =
  (repository: PickRepositoryPort) =>
  async (userId: string): Promise<PicksItem[]> => {
    const picks = await repository.findAllByUser(userId);
    return picks
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((p) => ({ id: p.id, numbers: [...p.numbers], createdAt: p.createdAt }));
  };
