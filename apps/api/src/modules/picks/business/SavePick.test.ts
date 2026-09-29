import { describe, expect, it } from "vitest";
import { InMemoryPickRepository } from "../domain/adapter/InMemoryPickRepository.js";
import { ListPicks } from "./ListPicks.js";
import { SavePick } from "./SavePick.js";

const setup = () => {
  const repository = new InMemoryPickRepository();
  let seq = 0;
  let tick = 0;
  const savePick = new SavePick(
    repository,
    () => `pick-${++seq}`,
    () => new Date(Date.UTC(2026, 6, 1, 0, 0, ++tick)),
  );
  return { savePick, listPicks: new ListPicks(repository) };
};

describe("SavePick (Fake 저장소 주입)", () => {
  it("저장 — 검증 통과 시 정렬된 번호로 저장한다", async () => {
    const { savePick } = setup();
    const result = await savePick.execute("guest", { numbers: [45, 1, 22, 7, 33, 14] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe("pick-1");
      expect(result.value.numbers).toEqual([1, 7, 14, 22, 33, 45]);
    }
  });

  it("저장 — 잘못된 조합은 거부한다", async () => {
    const { savePick, listPicks } = setup();
    expect((await savePick.execute("guest", { numbers: [1, 1, 2, 3, 4, 5] })).ok).toBe(false);
    expect((await savePick.execute("guest", { numbers: [1, 2, 3] })).ok).toBe(false);
    expect(await listPicks.execute("guest")).toEqual([]);
  });
});
