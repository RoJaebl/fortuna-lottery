import { defineArea } from "@lib/store";
import type { AreaContext } from "./context";

export type From = "tab" | "server";

/**
 * event 영역의 정의 셋 — 사건 선언, 그 사건이 낡게 하는 캐시, 일부러 낡게 하지 않는 캐시.
 * 규칙의 key 는 「사건 key → 캐시 key」다. 등록 함수 셋(event·invalidates·unaffected)은 규약 층의 index 가 이 꼴로 바꿔 넘긴다
 */
export type EventDef =
  | { kind: "event"; from: From }
  | { kind: "invalidates"; event: string; cache: string; from: From }
  | { kind: "unaffected"; event: string; cache: string; reason: string };

export const ruleKey = (event: string, cache: string) => `${event} → ${cache}`;

// 컨테이너마다 등록된 사건 — emit 이 등록부를 확인하는 자리. 사건 통로는 등록부를 모른다
const declared = new WeakMap<AreaContext, ReadonlySet<string>>();
const missingEvent = (key: string) => new Error(`등록되지 않은 사건이다: ${key}`);

export const eventArea = defineArea<EventDef, never, AreaContext>({
  prefix: "event.",
  describe(defs) {
    const all = [...defs];
    const lines: string[] = [];
    for (const [key, def] of all) {
      if (def.kind !== "event") continue;
      lines.push(`${key} (from: ${def.from})`);
      for (const [, rule] of all) {
        if (rule.kind === "invalidates" && rule.event === key) lines.push(`  낡게 한다: ${rule.cache} (from: ${rule.from})`);
      }
      for (const [, rule] of all) {
        if (rule.kind === "unaffected" && rule.event === key) {
          lines.push(`  일부러 낡게 하지 않는다: ${rule.cache} — ${rule.reason}`);
        }
      }
    }
    return lines;
  },
  // 전파 규칙을 이 컨테이너의 사건 통로에 건다 — 이미 지어진 캐시만 무효화한다
  attach(defs, ctx, container) {
    const events = new Set([...defs].filter(([, def]) => def.kind === "event").map(([key]) => key));
    for (const def of defs.values()) {
      if (def.kind === "event") continue;
      if (!events.has(def.event)) throw missingEvent(def.event);
      if (!container.has(def.cache)) throw new Error(`등록되지 않은 key 다: ${def.cache}`);
      if (def.kind === "invalidates") {
        const { cache } = def;
        ctx.events.on(def.event, () => (container.peek(cache) as { invalidate(): void } | undefined)?.invalidate());
      }
    }
    declared.set(ctx, events);
  },
});

/** http 영역 콜백에 넘기는 emit — 등록된 사건만 사건 통로로 낸다 */
export function emitOf(ctx: AreaContext): (key: string, payload: unknown) => void {
  return (key, payload) => {
    if (!declared.get(ctx)?.has(key)) throw missingEvent(key);
    ctx.events.emit(key, payload);
  };
}
