/** 사건 이름으로 듣고 낸다. 도메인을 모른다 — 이름과 값의 타입은 사건을 내는 쪽이 정한다 */
export class DomainEvents {
  private readonly listeners = new Map<string, Set<(payload: unknown) => void>>();

  /** 듣기를 걸고, 그것을 푸는 함수를 돌려준다 */
  on(name: string, fn: (payload: unknown) => void): () => void {
    const set = this.listeners.get(name) ?? new Set<(payload: unknown) => void>();
    set.add(fn);
    this.listeners.set(name, set);
    return () => {
      set.delete(fn);
    };
  }

  emit(name: string, payload?: unknown): void {
    this.listeners.get(name)?.forEach((fn) => fn(payload));
  }
}
