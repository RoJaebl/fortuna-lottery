// 서버 상태 캐시 도구 — frontend-module-layout 규칙 3.1절의 전문이다. 도메인을 모른다.
// action 이 모듈 수준에 하나씩 만들고, 수명 규칙 셋(같은 조건이면 다시 받지 않기 · 넘어간 요청의 응답 버리기 ·
// 보는 화면이 없어지면 놓기)이 이 안에서 지켜진다. action 에는 무엇을 언제 무효화하는가만 남는다.
export type CacheEntry<V> =
  | { status: "loading"; value: V | null; error: null }
  | { status: "ready"; value: V; error: null }
  | { status: "error"; value: V | null; error: string };

export function createServerCache<Q, V>(keyOf: (query: Q) => string, load: (query: Q) => Promise<V>) {
  const entries = new Map<string, CacheEntry<V>>();
  const watchers = new Map<string, Set<() => void>>();
  const queries = new Map<string, Q>();
  const turns = new Map<string, number>(); // 캐시키마다 몇 번째 요청인가

  const notify = (key: string) => watchers.get(key)?.forEach((fn) => fn());

  async function fetchInto(key: string, query: Q) {
    const turn = (turns.get(key) ?? 0) + 1;
    turns.set(key, turn);
    const kept = entries.get(key)?.value ?? null;
    entries.set(key, { status: "loading", value: kept, error: null });
    notify(key);
    try {
      const value = await load(query);
      if (turns.get(key) !== turn || !watchers.has(key)) return; // 넘어간 요청이거나 아무도 보지 않는다
      entries.set(key, { status: "ready", value, error: null });
    } catch (e) {
      if (turns.get(key) !== turn || !watchers.has(key)) return;
      entries.set(key, { status: "error", value: kept, error: e instanceof Error ? e.message : "알 수 없는 오류" });
    }
    notify(key);
  }

  return {
    /** 이 조건의 값이 필요하다. 믿을 값이 있으면 아무것도 하지 않는다 — 실패한 값은 믿지 않는다 */
    ensure(query: Q) {
      const key = keyOf(query);
      queries.set(key, query);
      const entry = entries.get(key);
      if (!entry || entry.status === "error") void fetchInto(key, query);
    },
    read: (query: Q) => entries.get(keyOf(query)),
    /** 쥔 값을 전부 버린다. 지금 보고 있는 조건은 곧바로 다시 받는다 */
    invalidate() {
      for (const key of [...entries.keys()]) {
        entries.delete(key);
        const query = queries.get(key);
        if (watchers.has(key) && query !== undefined) void fetchInto(key, query);
      }
    },
    /** 바꾸는 요청의 응답이 이미 새 값을 실어 왔을 때 — 다시 받지 않고 그대로 넣는다 */
    put(query: Q, value: V) {
      const key = keyOf(query);
      turns.set(key, (turns.get(key) ?? 0) + 1); // 오가던 요청의 응답은 이제 낡았다
      entries.set(key, { status: "ready", value, error: null });
      notify(key);
    },
    subscribe(query: Q, fn: () => void) {
      const key = keyOf(query);
      const set = watchers.get(key) ?? new Set<() => void>();
      set.add(fn);
      watchers.set(key, set);
      return () => {
        set.delete(fn);
        if (set.size > 0) return;
        watchers.delete(key); // 보는 화면이 하나도 남지 않았다 — 놓는다
        entries.delete(key);
        queries.delete(key);
      };
    },
  };
}
