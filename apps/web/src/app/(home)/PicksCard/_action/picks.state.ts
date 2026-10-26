import { createStore } from "supa-store";
import { createResource, type Cache } from "supa-store/query";
import { PickViewModel } from "../_model/Pick.viewmodel";
import { picksListResponse } from "../_mapper/picksList.mapper";
import { picksCreateRequest, picksCreateResponse } from "../_mapper/picksCreate.mapper";

/** 내 픽 — 목록 조회 하나와 저장·삭제. 바꾸기는 목록을 다시 받지 않고 그 자리에서 고친다 */
createStore("api.home.PicksCard.picks", (set, get, ctx) =>
  createResource((cache: Cache<void, PickViewModel[]>) => ({
    query: async () => PickViewModel.fromMany(picksListResponse(await ctx("infra.http").client.get("/api/picks"))),

    /** 응답으로 받은 픽을 목록 맨 앞에 더한다 — 아직 목록을 받지 못했으면 더할 자리가 없으므로 목록을 다시 받는다 */
    async save(numbers: readonly number[]) {
      const created = PickViewModel.from(
        picksCreateResponse(
          await ctx("infra.http").client.send("/api/picks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(picksCreateRequest(numbers)),
          }),
        ),
      );
      // 받는 중인 첫 목록 위에 setData 하면 그 응답이 버려져 목록이 저장한 픽 하나만 남는다
      if (cache.getData() === undefined) await cache.invalidate();
      else cache.setData((prev) => [created, ...(prev ?? [])]);
      ctx("event.home.PicksCard.changed").emit({ kind: "saved" });
      return created;
    },

    /** 먼저 목록에서 빼고, 실패하면 뺀 픽 하나만 제자리에 되돌린다 — 그 사이의 다른 저장·삭제는 그대로 둔다 */
    remove: async (id: string) => {
      const index = cache.getData()?.findIndex((p) => p.id === id) ?? -1;
      const removed = index >= 0 ? cache.getData()![index] : undefined;
      cache.setData((prev) => prev?.filter((p) => p.id !== id));
      try {
        await ctx("infra.http").client.send(`/api/picks/${encodeURIComponent(id)}`, { method: "DELETE" });
        ctx("event.home.PicksCard.changed").emit({ kind: "removed" });
      } catch (e) {
        // 그 사이 다시 받은 목록에 이미 있으면 한 번 더 넣지 않는다
        if (removed)
          cache.setData((prev) =>
            prev && !prev.some((p) => p.id === id) ? [...prev.slice(0, index), removed, ...prev.slice(index)] : prev,
          );
        throw e;
      }
    },
  })),
);
