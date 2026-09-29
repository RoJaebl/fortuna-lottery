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

describe("ListPicks (Fake 저장소 주입)", () => {
  it("목록 — 최신 저장순, 사용자별 격리", async () => {
    const { savePick, listPicks } = setup();
    await savePick.execute("guest", { numbers: [1, 2, 3, 4, 5, 6] });
    await savePick.execute("guest", { numbers: [7, 8, 9, 10, 11, 12] });
    await savePick.execute("other", { numbers: [13, 14, 15, 16, 17, 18] });

    const list = await listPicks.execute("guest");
    expect(list).toHaveLength(2);
    expect(list[0]?.numbers).toEqual([7, 8, 9, 10, 11, 12]); // 최신 먼저
    expect(await listPicks.execute("other")).toHaveLength(1);
  });
});
