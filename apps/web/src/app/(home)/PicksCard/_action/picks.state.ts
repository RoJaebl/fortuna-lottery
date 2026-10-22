import { createStore } from "@fortuna-lottery/store";
import { createResource, type Cache } from "@fortuna-lottery/store/query";
import { PickViewModel } from "../_model/Pick.viewmodel";
import { picksListResponse } from "../_mapper/picksList.mapper";
import { picksCreateRequest, picksCreateResponse } from "../_mapper/picksCreate.mapper";

/** 내 픽 — 목록 조회 하나와 저장·삭제. 바꾸기는 목록을 다시 받지 않고 그 자리에서 고친다 */
createStore("api.home.PicksCard.picks", (set, get, ctx) =>
  createResource((cache: Cache<void, PickViewModel[]>) => ({
    query: async () => PickViewModel.fromMany(picksListResponse(await ctx("infra.http").client.get("/api/picks"))),

    /** 응답으로 받은 픽을 목록 맨 앞에 더한다 */
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
      cache.setData((prev) => [created, ...(prev ?? [])]);
      ctx("event.home.PicksCard.changed").emit({ kind: "saved" });
      return created;
    },

    /** 먼저 목록에서 빼고, 실패하면 되돌린다 */
    remove: async (id: string) => {
      const before = cache.getData();
      cache.setData((prev) => prev?.filter((p) => p.id !== id));
      try {
        await ctx("infra.http").client.send(`/api/picks/${encodeURIComponent(id)}`, { method: "DELETE" });
        ctx("event.home.PicksCard.changed").emit({ kind: "removed" });
      } catch (e) {
        cache.setData(() => before); // 받기 전(undefined)이었어도 되돌린다 — 값 꼴은 undefined 를 받지 않는다
        throw e;
      }
    },
  })),
);
