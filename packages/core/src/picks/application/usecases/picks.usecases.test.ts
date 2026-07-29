import { describe, expect, it } from "vitest";
import { createInMemoryPickRepository } from "../../infrastructure/adapters/in-memory-pick.repository";
import { makeDeletePick } from "./delete-pick";
import { makeListPicks } from "./list-picks";
import { makeSavePick } from "./save-pick";

const setup = () => {
  const repository = createInMemoryPickRepository();
  let seq = 0;
  let tick = 0;
  const savePick = makeSavePick({
    repository,
    idGenerator: () => `pick-${++seq}`,
    clock: () => new Date(Date.UTC(2026, 6, 1, 0, 0, ++tick)),
  });
  return {
    repository,
    savePick,
    listPicks: makeListPicks(repository),
    deletePick: makeDeletePick(repository),
  };
};

describe("picks 유스케이스 (Fake 저장소 주입)", () => {
  it("저장 — VO 검증 통과 시 정렬된 번호로 저장한다", async () => {
    const { savePick } = setup();
    const result = await savePick("guest", { numbers: [45, 1, 22, 7, 33, 14] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe("pick-1");
      expect(result.value.numbers).toEqual([1, 7, 14, 22, 33, 45]);
    }
  });

  it("저장 — 잘못된 조합은 거부한다", async () => {
    const { savePick, listPicks } = setup();
    expect((await savePick("guest", { numbers: [1, 1, 2, 3, 4, 5] })).ok).toBe(false);
    expect((await savePick("guest", { numbers: [1, 2, 3] })).ok).toBe(false);
    expect(await listPicks("guest")).toEqual([]);
  });

  it("목록 — 최신 저장순, 사용자별 격리", async () => {
    const { savePick, listPicks } = setup();
    await savePick("guest", { numbers: [1, 2, 3, 4, 5, 6] });
    await savePick("guest", { numbers: [7, 8, 9, 10, 11, 12] });
    await savePick("other", { numbers: [13, 14, 15, 16, 17, 18] });

    const list = await listPicks("guest");
    expect(list).toHaveLength(2);
    expect(list[0]?.numbers).toEqual([7, 8, 9, 10, 11, 12]); // 최신 먼저
    expect(await listPicks("other")).toHaveLength(1);
  });

  it("삭제 — 소유자만 삭제 가능", async () => {
    const { savePick, listPicks, deletePick } = setup();
    const saved = await savePick("guest", { numbers: [1, 2, 3, 4, 5, 6] });
    if (!saved.ok) throw new Error("저장 실패");

    expect((await deletePick("other", saved.value.id)).ok).toBe(false); // 남의 픽
    expect((await deletePick("guest", saved.value.id)).ok).toBe(true);
    expect((await deletePick("guest", saved.value.id)).ok).toBe(false); // 이미 삭제됨
    expect(await listPicks("guest")).toEqual([]);
  });
});
