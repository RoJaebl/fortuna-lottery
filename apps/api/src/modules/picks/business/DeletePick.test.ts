import { describe, expect, it } from "vitest";
import { InMemoryPickRepository } from "../domain/adapter/InMemoryPickRepository.js";
import { DeletePick } from "./DeletePick.js";
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
  return { savePick, listPicks: new ListPicks(repository), deletePick: new DeletePick(repository) };
};

describe("DeletePick (Fake 저장소 주입)", () => {
  it("삭제 — 소유자만 삭제 가능", async () => {
    const { savePick, listPicks, deletePick } = setup();
    const saved = await savePick.execute("guest", { numbers: [1, 2, 3, 4, 5, 6] });
    if (!saved.ok) throw new Error("저장 실패");

    expect((await deletePick.execute("other", saved.value.id)).ok).toBe(false); // 남의 픽
    expect((await deletePick.execute("guest", saved.value.id)).ok).toBe(true);
    expect((await deletePick.execute("guest", saved.value.id)).ok).toBe(false); // 이미 삭제됨
    expect(await listPicks.execute("guest")).toEqual([]);
  });
});
