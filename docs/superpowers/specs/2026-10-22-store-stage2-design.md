# 공통 상태 라이브러리 — 2단계 설계: 자원(api)·event 를 store 하나로

작성일: 2026-10-22. 대상: `packages/store`(`@fortuna-lottery/store`)와 `apps/web` 의 cache·http·event.
앞선 설계: [1단계 — 공통 상태 라이브러리](2026-10-21-state-library-design.md). 1단계의 결정(전역 등록부·공급자 없음·
생성기가 타입을 글자로 쓴다·라이브러리는 쓰는 프로젝트의 폴더 규약을 모른다)은 그대로 유효하다.

## 의도

1단계에서 state 를 zustand 꼴로 옮기고 보니 가벼웠다. 남은 cache·http·event 는 여전히 옛 store 위에 있다. 값 하나가
화면에 닿기까지 `declare module` 로 key 를 한 번 더 적고, `store.cache` 를 부르고, 영역 객체(`framework/areas/*`)·di 컨테이너·
`StoreProvider`·`useStore` 를 차례로 지난다.

사용자의 생각은 이렇다.

- **store 가 컨테이너를 대신한다.** 바깥 도구(HTTP 클라이언트)도 먼저 만든 store 이고, 다른 store 는 그 store 를 key 로 받아
  메모리 참조로 쓴다. 라이브러리에 영역·컨테이너·주입이라는 개념을 따로 두지 않는다.
- **cache 와 http 는 떼지 않는다.** 둘을 따로 두면 프로젝트가 커질 때 바꾸기 요청의 응답과 캐시가 어긋난다. 그래서 한 자원의
  조회(React Query 의 query)와 바꾸기(mutation)를 store 하나에 묶어, 바꾸기가 끝난 그 자리에서 같은 캐시를 고친다.
- **자원 하나는 조회 하나다.** 여러 자원이 필요하면 store 의 기능으로 자원을 이어 쓴다(체인). 한 자원 안에 조회를 여럿 두지 않는다.
- **자원도 store 처럼 정의한다.** creator 가 돌려주는 객체 안의 `query` 가 조회이고, 나머지 함수가 곧 바꾸기다. 칸(`mutations`)이나
  훅(`onSuccess`)을 따로 두지 않는다.
- **정의 자리의 도우미 이름이 곧 문서다.** `createStore` 안에서 `createResource`·`createEvent` 중 무엇을 썼는지가 그 store 가 무엇인지를
  말한다. 그래서 화면은 무엇이든 `useStore` 하나로 꺼낸다.

## 목표

- `packages/store` 가 정의 도우미 둘(`createResource`·`createEvent`)과 꺼내기 훅 `useStore` 하나를 제공한다.
- 정의는 1단계의 `createStore(key, creator)` 하나다. creator 는 `(set, get, ctx)` 를 받고, `ctx(key)` 로 다른 store 의 지금 값을 읽는다.
- 바깥 도구는 `infra.*` store 다. 시험은 `overrideStore` 로 가짜를 꽂고 `resetStores` 로 되돌린다.
- 자원 사이의 「누가 반응하고 누가 일부러 반응하지 않는가」가 출력 스냅숏에 실린다.
- 옛 store(`shared/lib/store`·`framework/`·`composition/createContainer.ts`·`@lib/di`·`StoreProvider`)를 걷어낸다.
- `pnpm check` 가 통과한다.

## 하지 않는 것

- **vault 골조 문서는 고치지 않는다.** 1단계 방침 그대로 단계가 다 끝난 뒤 한 번에 개정한다. 어긋남은
  [보고 문서](../reports/2026-10-13-vault-feedback.md)에 한 줄로 올린다.
- **주소(route)를 다루지 않는다.** 옛 route 영역(`route.home.index` 하나, 쓰는 곳 없음)과 `no-path-literal` 을 함께 버린다.
  주소가 실제로 필요해질 때 다시 정한다.
- **한 자원 안에 조회를 여럿 두지 않는다.** 응답이 다르면 자원을 나누고 체인으로 잇는다.
- React Query 의 기능 가운데 지금 화면이 쓰지 않는 것: `staleTime`, 창에 돌아오면 다시 받기, 자동 재시도, 보는 화면이 없을 때 지우기.
- 서버 컴포넌트에서 데이터를 받는 것. 받기는 화면이 뜬 뒤(`useEffect`)에만 한다.
- zustand·TanStack Query 를 의존성으로 들이는 것. 모양만 따른다.

## 실패로 보는 것

- 바꾸기의 응답과 같은 자원의 캐시가 어긋나는 것. 바꾸기를 마친 자리 말고 다른 곳에서 그 캐시를 고쳐야 하는 것.
- 정의를 한 파일로 모으게 되는 것. 사람이 목록 파일(event 이름 표, 등록 목록)을 고쳐야 새 것이 쓰이는 것.
- 정의 파일에 key 나 타입을 두 번 적어야 하는 것.
- 생성 결과에 `any` 가 남아 타입 검사가 조용히 꺼지는 것.
- 다른 store 에서 꺼낸 값이 낡는 것 — `set` 뒤에도, 시험이 갈아 끼운 뒤에도 옛 값을 보는 것.
- 시험끼리 상태·가짜 도구·event 듣기가 새는 것.
- 화면이 고르지 않은 칸 때문에 다시 그려지거나, 묶어 꺼낸 객체 때문에 끝없이 다시 그려지는 것.
- 바꾸기만 쓰려는 화면이 조회를 시작하는 것.
- 한 화면에서 누른 바꾸기의 진행·오류가 다른 화면에 보이는 것.
- 「일부러 반응하지 않는다」는 결정이 코드에서 조용히 사라지는 것.

## 고려한 길

**A. 라이브러리가 영역을 안다.** `createStore` 가 key 접두를 보고 짓는 법을 가르고, 전파 규칙을 칸으로 둔다. key 접두라는 이
저장소의 약속을 라이브러리가 알게 된다. 버렸다.

**B. 라이브러리가 도구를 주입한다.** `bindStores(deps)` 로 환경별 변수를 넘기고 생성기가 그 타입을 올린다. 「주입」이 라이브러리에
개념으로 하나 더 생기고, 도구를 바꿀 때 모든 store 를 다시 지어야 한다. 버렸다.

**C. cache(`createQuery`)와 http(`createMutation`)를 다른 key 로 두고 event 로 잇는다.** React Query 의 훅 둘을 그대로 옮긴 꼴이다.
바꾸기와 캐시가 event 라는 간접 고리로만 이어져, 고리를 빠뜨리거나 응답과 캐시가 어긋날 자리가 생긴다. 사용자가 버렸다.

**D. 자원 하나가 조회 하나와 바꾸기 함수들을 store 처럼 갖는다.** (고른 길) 바꾸기 함수가 같은 자원의 캐시를 그 자리에서 고친다.
event 는 자원 **사이**만 잇는다. 라이브러리는 key 접두를 모르고, 자원·event 라는 일반 개념만 도우미로 준다. 이것은 이 저장소의
폴더 규약이 아니라 어느 프로젝트에도 통하는 개념이므로 1단계 원칙과 부딪치지 않는다.

자원의 정의 꼴로는 `createResource({ query, mutations: { save: { run, onSuccess } } })` 도 따졌다. 사용자가 store 와 같은 꼴
(`createResource((cache) => ({ query, save, … }))`)을 골랐다. 꺼내는 훅으로는 `useQuery`·`useMutation` 을 따로 두는 길도 따졌다.
사용자가 `useStore` 하나를 골랐다. 정의의 도우미 이름이 이미 그 store 가 무엇인지를 말하기 때문이다.

## 결정

### 1. 정의는 `createStore(key, (set, get, ctx) => …)` 하나다

- 1단계의 상태만 쓰는 정의(`(set) => ({…})`)는 그대로다.
- 자원과 event 는 creator 가 도우미의 반환값을 돌려준다.

```ts
createStore("event.home.PicksCard.changed", () => createEvent<{ kind: "saved" | "removed" }>());
createStore("api.home.PicksCard.picks", (set, get, ctx) => createResource((cache) => ({ query: async () => …, async save(n) { … } })));
```

- 객체 안의 함수는 화살표 꼴(`save: async () => {}`)과 메서드 꼴(`async save() {}`) 가운데 요소마다 아무 쪽이나 쓴다. state·자원 모두 같다.

### 2. `ctx(key)` 는 부르는 순간의 값을 준다

```ts
export interface Ctx {
  <K extends StateKey>(key: K): StateOf<K>;
  <K extends StateKey, N extends Names<K>, O extends PickOptions<K, N>>(key: K, options: O): Picked<K, O>;
  /** 지금 짓고 있는 store 의 key — event 에 「누가」를 남길 때 쓴다 */
  readonly key: string;
}
```

꺼내는 꼴은 `useStore` 와 같다. `ctx(key)` 는 전부, `ctx(key, { pick })`·`ctx(key, { omit })` 은 고른 칸이다. 화면 밖이라 구독은 없고
부르는 순간의 값만 준다. 자원을 `ctx` 로 꺼내면 `fetch`·`getData`·`setData`·`invalidate` 와 정의한 바꾸기 함수가 나온다(5절).

`set` 은 불변성을 지키려고 상태 객체를 새로 만들어 갈아 끼운다. 그래서 값을 변수에 담아 두면 그 순간의 객체를 쥐게 되어
낡는다. **`ctx` 는 함수 안(조회·바꾸기·event 반응)에서 값이 필요한 순간에 부른다.** creator 맨 위에서 `ctx` 를 쓰는 것은
event 에 `on`·`exempt` 를 거는 자리 하나다.

### 3. 짓는 것은 처음 꺼낼 때다

- 1단계는 등록하는 순간 지었다. 2단계는 `getStore`·`useStore`·`ctx`·`getInitialState` 가 처음 꺼낼 때 짓는다. creator 가 짓는 순간
  `ctx` 로 event store 를 꺼내도 import 순서에 묶이지 않는다.
- 짓는 사슬이 같은 key 로 돌아오면 `순환한다: a → b → a` 로 즉시 실패한다.
- 짓는 동안 `ctx` 로 꺼낸 key 를 기록한다. 어떤 store 를 다시 지으면, 그것을 지을 때 꺼냈던 store 도 함께 다시 짓는다. 그래서
  event store 가 다시 지어져도(개발 모드·시험) 듣기가 끊기지 않는다.
- `getStore(key)` 의 `StoreApi` 객체는 key 마다 하나이고 다시 지어도 바뀌지 않는다.

### 4. 꺼내기는 `useStore` 하나이고, store 가 정한 꺼내기에 맡긴다

```ts
/** 상태가 이 표식의 함수를 가지면 useStore 는 꺼내기를 그 함수에 맡긴다 */
export const USE: unique symbol;
```

| 꺼내는 store | `useStore` 의 둘째 인자 | 돌려주는 것 |
|---|---|---|
| state·event·infra(표식 없음) | 없음, `{ pick }`, `{ omit }` | 상태 전부, 고른 칸, 뺀 칸 빼고 전부 |
| 자원(표식 있음) | 없음, `{ args?, pick?, omit? }` | 조회 칸(`data`·`status`·`error`·`refetch`)과 바꾸기마다 `{ mutate, pending, error, data, reset }` |

- 둘째 인자와 반환 타입은 key 의 타입이 정한다.
- `pick`·`omit` 은 고른 칸을 칸마다 `Object.is` 로 견주어, 다 같으면 앞서 준 객체를 다시 준다. 고른 칸이 바뀔 때만 다시 그린다.
- 자원에서 `pick`·`omit` 이 조회 칸(`data`·`status`·`error`·`refetch`)을 하나도 남기지 않으면, 조회를 시작하지도 구독하지도 않는다.
- 한 key 의 상태가 표식을 가지는지는 늘 같으므로 훅 순서가 바뀌지 않는다.
- **1단계의 `useSharedState(key, (s) => …)` 은 없앤다.** 이름을 `useStore` 로 바꾸고 지금 presenter 들을 새 꼴로 옮긴다.

### 5. 자원 — `createResource((cache) => ({ query?, …바꾸기 }), { auto? })`

```ts
export interface Cache<A, D> {
  getData(args?: A): D | undefined;
  /** 응답이 실어 온 값으로 바로 고친다 — 다시 받지 않는다 */
  setData(updater: D | ((prev: D | undefined) => D | undefined), args?: A): void;
  /** 다시 받는다 — args 를 주면 그 칸만, 없으면 받아 둔 칸 모두 */
  invalidate(args?: A): Promise<void>;
  /** 받아서 칸에 넣고 값을 돌려준다 — 이미 받은 칸이면 그 값을 바로 준다(체인에서 쓴다) */
  fetch(args?: A): Promise<D>;
}
```

- **`query` 는 예약된 이름이고, 그 함수가 조회 하나다.** 없으면 조회하지 않는다. 조회의 인자 타입(`A`)과 값 타입(`D`)은 `query` 의
  서명에서 추론하고 `cache` 의 타입이 거기서 나온다.
- **나머지 함수가 모두 바꾸기다.** 바꾸기의 앞뒤 일(낙관적 갱신·성공 뒤 캐시 고치기·실패하면 되돌리기)은 함수 안에서 `await` 앞뒤로
  `cache` 를 고쳐 쓴다.
- **바꾸기 이름으로 쓸 수 없는 것:** `query`, 그리고 화면에 나가는 `data`·`status`·`error`·`refetch`. 겹치면 지을 때 실패한다.
- **조회:** 조회 조건(`args`)마다 칸을 쥐고 같은 조건을 보는 화면끼리 나눠 쓴다(칸 이름은 `JSON.stringify(args)`). 같은 칸의 요청이
  겹치면 하나로 합친다. 다시 받는 동안과 실패했을 때 앞선 `data` 를 남긴다. 칸마다 요청 차례를 세어 늦게 온 응답을 버린다.
  `auto`(기본 `true`)면 화면이 그 칸을 처음 볼 때 받고, `false` 면 `refetch` 로만 받는다.
- **바꾸기:** 화면이 `useStore` 로 꺼내면 진행·오류·결과는 그 화면 하나의 지역 상태다. 화면 안에서 요청 차례를 세어 늦게 온
  응답을 버린다. `mutate(...args)` 는 실패해도 던지지 않고 `error` 에 문구를 둔다. store 끼리·시험은 `ctx(key).save(...)`·
  `getStore(key).getState().save(...)` 로 함수를 바로 부르고, 이것은 실패하면 던진다.
- **store 끼리 보는 자원의 모양:** `ctx(key)`·`getStore(key).getState()` 는 `{ fetch, getData, setData, invalidate, …정의한 바꾸기 }` 를 준다.
  조회 칸(`data`·`status`·`error`·`refetch`)과 바꾸기의 `{ mutate, pending, … }` 꼴은 화면이 `useStore` 로 꺼낼 때만 나온다.
- **`this`:** 라이브러리는 함수를 늘 원래 객체를 `this` 로 넘겨 부른다. 그래서 메서드 꼴은 `this.save(...)` 로 같은 자원의 다른 함수를
  부를 수 있고, 화살표 꼴은 `this` 의 영향을 받지 않는다. state 의 `pick` 꺼내기도 함수 칸은 원래 상태 객체에 묶어서 준다.

```ts
createStore("api.home.PicksCard.picks", (set, get, ctx) =>
  createResource((cache) => ({
    query: async () => PickViewModel.fromMany(picksListResponse(await ctx("infra.http").client.get("/api/picks"))),

    async save(numbers: readonly number[]) {                       // 응답으로 캐시에 더한다
      const created = PickViewModel.from(picksCreateResponse(await ctx("infra.http").client.send("/api/picks", { /* … */ })));
      cache.setData((prev) => [created, ...(prev ?? [])]);
      ctx("event.home.PicksCard.changed").emit({ kind: "saved" });
      return created;
    },

    remove: async (id: string) => {                                // 낙관적 삭제 — 실패하면 되돌린다
      const before = cache.getData();
      cache.setData((prev) => prev?.filter((p) => p.id !== id));
      try {
        await ctx("infra.http").client.send(`/api/picks/${encodeURIComponent(id)}`, { method: "DELETE" });
        ctx("event.home.PicksCard.changed").emit({ kind: "removed" });
      } catch (e) {
        cache.setData(before);
        throw e;
      }
    },
  })),
);

// 화면
const { data: picks = [], status, save, remove } = useStore("api.home.PicksCard.picks");
await save.mutate(numbers);                                            // save.pending · save.error 는 이 화면의 것
const { save } = useStore("api.home.PicksCard.picks", { pick: ["save"] }); // 조회를 시작하지 않는다
```

### 6. 체인 — 여러 자원을 store 로 잇는다

자원 하나는 조회 하나이므로, 여러 자원이 필요하면 자원을 이어 쓴다.

```ts
// 조회가 다른 자원의 값을 받아 이어 받는다
createStore("api.home.ResultsCard.latestWithPicks", (set, get, ctx) =>
  createResource(() => ({
    query: async () => matchPicks(await ctx("api.home.LotterietusCard.latest").fetch(), await ctx("api.home.PicksCard.picks").fetch()),
  })),
);

// 바꾸기가 여러 자원의 바꾸기를 차례로 부른다 — 각 자원의 캐시는 그 자원이 고친다
createStore("api.home.GeneratorCard.quickSave", (set, get, ctx) =>
  createResource(() => ({
    async generateAndSave(mode: GeneratorMode) {
      const combination = await ctx("api.home.GeneratorCard.generator").generate(mode, []);
      return ctx("api.home.PicksCard.picks").save(combination.numbers);
    },
  })),
);
```

이어진 앞 자원이 바뀌었을 때 다시 받아야 하면, 앞 자원이 내는 event 를 `on` 으로 듣는다(7절).

### 7. event — 자원 사이만 잇는다 — `createEvent<P>()`

같은 자원 안의 「바꾸면 캐시가 낡는다」는 바꾸기 함수가 그 자리에서 맡는다. event 는 자원 **사이**에만 쓴다. 표식이 없으므로
화면은 `useStore("event.…", { pick: ["emit"] })` 로 꺼낸다.

- `emit(payload)`: 반응하는 store 들을 부른다.
- `on(who, fn)`: `who`(store key)가 반응한다. 같은 `who` 가 다시 걸면 앞 것을 갈아 끼운다. 풀기 함수를 돌려준다.
- `exempt(who, why)`: `who` 는 일부러 반응하지 않는다. 실행에는 영향이 없고 결정이라는 기록만 남긴다. 같은 `who` 가 한 event 에
  `on` 과 `exempt` 를 함께 적으면 즉시 실패한다.
- `record()`: `{ on: string[]; exempt: Array<{ who; why }> }` — 출력 스냅숏이 읽는다.

```ts
// 픽이 바뀌면 내 픽 통계를 다시 받는다
createStore("api.home.StatisticsPanel.myPicks", (set, get, ctx) => {
  const resource = createResource(() => ({ query: async () => myPicksStats(await ctx("api.home.PicksCard.picks").fetch()) }));
  ctx("event.home.PicksCard.changed").on(ctx.key, () => void resource.invalidate());
  return resource;
});

// 당첨 대조는 픽이 바뀌어도 일부러 다시 받지 않는다 — 사람이 누를 때만 받는다
createStore("api.home.ResultsCard.check", (set, get, ctx) => {
  ctx("event.home.PicksCard.changed").exempt(ctx.key, "결과는 사람이 「당첨 대조」를 눌러 받는다");
  return createResource(() => ({ query: async () => toResultsState(resultsCheckResponse(await ctx("infra.http").client.get("/api/results"))) }), { auto: false });
});
```

### 8. 바깥 도구는 `infra.*` store 다

```ts
// apps/web/src/infrastructure/http/http.state.ts
createStore("infra.http", () => ({ client: new FetchHttpClient() as HttpClient }));
```

정의는 `ctx("infra.http").client.get(…)` 처럼 쓴다. `FetchHttpClient` 가 서버 본문의 `{ error }` 문구를 꺼내는 지금 동작은 그대로다.

### 9. 시험은 `overrideStore` 로 갈아 끼운다

```ts
/** 처음 등록한 정의 대신 이것으로 짓는다. 그 key 에 기대던 store 도 다시 짓는다 */
export function overrideStore<K extends StateKey>(
  key: K,
  creator: (set: SetState<StateOf<K>>, get: GetState<StateOf<K>>, ctx: Ctx) => object,
): void;
```

- `resetStores()` 는 덮어쓴 정의를 모두 처음 등록한 것으로 되돌리고, 모든 store 를 **먼저 전부 무른 뒤** 보는 화면이 있는 store 를
  다시 지어 알린다. 가짜가 다음 시험으로 새지 않는다.
- 개발 모드의 `createStore` 재등록(Fast Refresh)은 지금처럼 정의를 바꿔 끼운다. 이것은 `resetStores` 가 되돌리지 않는다.

### 10. key 는 폴더를 따르고 닿는 범위를 검사한다

- 접두는 `state.`·`api.`·`event.`·`infra.` 넷이다. `cache.`·`http.` 는 없어지고 `api.` 하나가 된다.
- state 와 같은 규칙을 모든 key 에 건다. `app/(home)/PicksCard/` 에서 정의한 store 는 `<접두>.home.PicksCard.<이름>` 이다.
- 닿는 범위 검사(`useStore`·`ctx` 로 읽을 수 있는 key)도 state 와 같다. **event 만 예외로 범위 밖에서도 읽는다.**
- `infra.*` 는 `infrastructure/` 에서 정의하고 어디서나 읽는다.

### 11. 한 곳에서 보기 — 출력 스냅숏

`composition/store.describe.test.ts` 가 등록된 store 를 모두 지은 뒤 스냅숏을 남긴다. 지금의 state 절(무엇을 바꾸는가·정의·쓰는 곳)을
남기고, event 절과 자원 목록(자원마다 조회 유무와 바꾸기 이름)을 더한다.

```
event.home.PicksCard.changed
  on     api.home.StatisticsPanel.myPicks
  exempt api.home.ResultsCard.check — 결과는 사람이 「당첨 대조」를 눌러 받는다
```

### 12. 정의 파일·생성 파일·등록을 싣는 자리

- 정의 파일은 1단계 기본값 그대로 `*.state.ts` 다. 자원은 `_action/<자원>.state.ts`, event 는 내는 쪽 `_action/<도메인>.event.state.ts`,
  바깥 도구는 `infrastructure/<이름>/<이름>.state.ts` 다.
- 생성기는 creator 의 반환 타입을 글자로 뽑는 1단계 일을 그대로 한다. 두 가지를 더한다.
  - **결과가 바뀌지 않을 때까지 되풀이해 돈다.** 새 key 가 처음 생성될 때 `StateOf<K>` 가 `unknown` 이라 `get()` 에 기대는 함수가
    `any` 로 찍히는 것을 다음 돌기에서 바로잡는다.
  - **결과에 `any` 가 남으면 실패한다.** 고정점이 나지 않는 것은 반환 타입을 적게 한다.
- 생성 파일을 불러오는 자리는 셋이다. 서버 쪽 `app/layout.tsx`, 클라이언트 번들에 싣는 `"use client"` 경계 하나(`app/StoreRegistry.tsx`
  같은 것), 그리고 `test.setup.ts` 다. `composition/screens.ts`·`composition/routes.ts` 는 없어진다.

## 라이브러리에서 바뀌는 것 (`packages/store`)

- `src/index.ts`: creator 셋째 인자 `ctx`, 처음 꺼낼 때 짓기·순환 검사·기댄 store 다시 짓기, `USE` 표식, `overrideStore`,
  `resetStores` 의 되돌리기, pick·omit 의 타입(`Names`·`PickOptions`·`Picked`)과 함수 칸을 원래 객체에 묶어 주는 `pickFrom`.
- `src/react.ts`: `useSharedState` 를 `useStore` 로 바꾸고, 표식에 맡기기와 pick·omit 꺼내기를 둔다.
- `src/query.ts`(새 진입점 `./query`, `"use client"` 가 아니다): `createResource`·`createEvent`. 정의 파일은 서버 쪽에서도
  평가되므로 정의 때 부르는 도우미는 `"use client"` 파일에 둘 수 없다. 도우미 안의 React 훅은 화면이 `useStore` 로 꺼낼 때만 불린다.
- `tools/codegen.cjs`: 고정점까지 되풀이, 결과의 `any` 거부.

## apps/web 에서 바뀌는 것

- action 11 개를 자원(`api.*` 의 `*.state.ts`)으로 옮긴다. 묶음은 이렇다.
  - 내 픽: 목록 조회 + 저장·삭제 → `api.home.PicksCard.picks` 하나
  - 통계, 회차: 조회만
  - 인기 패턴: 조건(조합)이 있는 조회만
  - 당첨 대조: 누를 때만 받는 조회(`auto: false`)
  - 조합 생성, 가정 평가·가정 생성, 백테스트: 바꾸기만
- `use*Action` 훅은 없어지고 presenter 가 `useStore` 로 꺼낸다.
- 전파 관계를 옮긴다. 픽 저장·삭제가 목록을 고치는 것은 자원 안에서 하고, 당첨 대조가 일부러 반응하지 않는 것은 `exempt` 로 둔다.
- 지금 presenter 들의 `useSharedState(key, (s) => …)` 를 `useStore(key, { pick })` 로 옮긴다.
- 걷어내는 것: `shared/lib/store/`, `shared/lib/store-react/`, `shared/lib/di/`, `shared/lib/events/`, `shared/lib/cache/`,
  `framework/`(그 안의 `paths.mjs` 와 `paths.test.ts` 는 eslint 도우미 자리로 옮긴다), `composition/{createContainer,screens,routes}.ts`,
  `app/AppContainer.tsx`, `app/(home)/routes.ts`, `declare module "@lib/store"` 줄 전부.
- 검사기:
  - 옛 store 를 짚던 규칙(`hook-resolves-own-key-only`·`rule-targets-own-cache`·`no-renamed-store-import`·`no-path-literal`·
    `middleware-sees-infrastructure-lib-routes-only`·`nothing-reaches-composition` 의 예외)을 새 꼴에 맞추거나 지운다.
  - state 만 알던 규칙(`state-key-matches-folder`·`state-key-within-scope`·`state-registers-in-state-folder`·`store-gen-imports-state-only`)을
    모든 접두의 key 로 넓히고, `event.` 의 범위 예외와 `infra.` 의 자리를 더한다.
  - 시험 파일은 `overrideStore` 를 쓰므로 등록 규칙에 걸리지 않는다. 시험 파일이 `infrastructure/http` 의 `TestHttpClient` 를 가져오는
    것은 허용한다.
  - 새로 거는 근사 검사 하나: 「`ctx` 는 creator 맨 위에서는 `.on`·`.exempt` 를 거는 자리에만 쓴다」.
- CLAUDE.md 「이 저장소가 정한 것」을 고친다.

## 시험

- `test.setup.ts` 는 생성 파일을 불러오고 `afterEach(resetStores)` 를 건다.
- 지금 시험이 지키는 것을 새 꼴로 옮긴다.
  - 픽을 저장·삭제하면 목록이 고쳐진다(저장은 응답으로 더하고, 삭제는 낙관적으로 빼고 실패하면 되돌린다).
  - 픽이 바뀌어도 당첨 대조는 다시 받지 않는다.
  - 저장이 실패하면 event 를 내지 않는다.
  - 조합이 빠르게 바뀔 때 앞 조합의 늦은 응답이 뒤 조합 자리에 보이지 않는다.
  - 서버 오류 문구가 화면에 그대로 보인다.
  - 바꾸기만 고른 화면은 조회를 시작하지 않는다.
- 다시 써야 할 시험: `composition/createContainer.test.ts`, `framework/store.test.ts`, `framework/paths.test.ts`(옮긴다),
  `listPicks.action.test.ts`, `checkResults.action.test.ts`, `checkPopularity.action.test.ts`, `savePick.action.test.ts`, `StoreProvider` 를 쓰는
  presenter 시험들, `packages/store/src/react.test.tsx`.
- 라이브러리 시험: 처음 꺼낼 때 짓기, 순환, 기댄 store 다시 짓기, `overrideStore`·`resetStores` 되돌리기, pick·omit 의 다시 그리기,
  자원의 겹친 요청 합치기·늦은 응답 버리기·앞선 값 남기기·`fetch` 의 이미 받은 칸, 바꾸기의 화면별 상태, 화살표 꼴과 메서드 꼴의
  `this`, 예약 이름 충돌, event 의 `on`/`exempt` 충돌.

## Claude 가 정한 것 — 사용자가 확인할 것

사용자가 정한 것은 「고려한 길」의 D, `ctx` 와 메모리 참조, 꺼내기 옵션 `pick`·`omit`(1단계 포함), event 를 store key 하나로 두는 것,
`exempt` 라는 이름, cache 와 http 를 자원 하나로 묶는 것, 자원 하나는 조회 하나이고 여러 자원은 체인으로 잇는 것, 자원을 store 처럼
`(cache) => ({ query, …바꾸기 })` 로 정의하는 것, 화살표 꼴과 메서드 꼴을 요소마다 고르는 것, 꺼내기를 `useStore` 하나로 묶는 것,
도우미를 라이브러리가 제공하는 것, key 를 폴더에 따르게 하고 event 만 범위 예외로 두는 것, route 를 버리는 것이다. 아래는 내가 정했다.

1. **도우미는 `"use client"` 가 아닌 새 진입점 `@fortuna-lottery/store/query` 에 둔다.** 정의 파일이 서버 쪽에서도 평가되기 때문이다.
2. **짓는 때를 「처음 꺼낼 때」로 바꾸고, 기댄 store 를 함께 다시 짓는다.** import 순서와 event 듣기 끊김을 막으려는 것이다.
3. **시험은 `overrideStore` 로 갈아 끼우고 `resetStores` 가 처음 정의로 되돌린다.** 가짜가 다음 시험으로 새지 않게 하려는 것이다.
4. **`on`·`exempt` 는 `who`(store key)를 받고 라이브러리가 `ctx.key` 를 준다.** 출력에 「누가」를 싣고 개발 모드의 듣기 중복을 막는다.
5. **생성기는 고정점까지 되풀이하고 결과의 `any` 를 거부한다.** 첫 생성에서 `any` 가 새는 것을 검사기가 통과시키지 않게 하려는 것이다.
6. **출력 스냅숏은 지금의 state 절을 남기고 event 절과 자원 목록을 더한다.**
7. **`pick`·`omit` 이 조회 칸을 남기지 않으면 조회를 시작하지 않는다.** 바꾸기만 쓰려는 화면이 목록을 받지 않게 하려는 것이다.
8. **화면에서 바꾸기는 `save.mutate(…)`·`save.pending` 처럼 한 겹 감싼 객체로 꺼낸다.** React Query 의 `useMutation` 이 주는 꼴과 같다.
9. **메서드 꼴의 `this` 를 허용하고, 라이브러리가 늘 원래 객체를 `this` 로 넘긴다.** 두 꼴을 요소마다 고르게 한다는 결정을 지키려는 것이다.
10. **`cache` 의 타입은 `query` 의 서명에서 추론한다.** 한 호출 안에서 추론이 막히면 `query` 에 반환 타입을 적는다. 계획의 첫 과업에서
    시험으로 먼저 확인한다.
11. **query 의 칸 이름은 `JSON.stringify(args)` 이고, `mutate` 는 실패해도 던지지 않는다.** React Query 의 `mutate` 와 같다.
12. **정의 파일은 모두 `*.state.ts` 이고 생성 파일을 싣는 자리는 서버 `layout.tsx`·클라이언트 경계 하나·`test.setup.ts` 셋이다.**
