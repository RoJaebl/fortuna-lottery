// @lib/di — 토큰으로 짓는 법을 등록하고, 처음 꺼낼 때 한 번 지어 같은 인스턴스를 내준다.
// store 도 key 꼴도 무엇을 짓는지도 모른다 (frontend-store §1)
export class Container {
  private readonly factories = new Map<string, () => unknown>();
  private readonly instances = new Map<string, unknown>();

  register(token: string, factory: () => unknown): void {
    this.factories.set(token, factory);
    this.instances.delete(token);
  }

  has(token: string): boolean {
    return this.factories.has(token);
  }

  /** 처음 꺼낼 때 짓는다. 등록되지 않은 토큰이면 그 이름을 담아 즉시 실패한다 */
  resolve(token: string): unknown {
    if (!this.instances.has(token)) {
      const factory = this.factories.get(token);
      if (!factory) throw new Error(`등록되지 않은 토큰이다: ${token}`);
      this.instances.set(token, factory());
    }
    return this.instances.get(token);
  }

  /** 이미 지어진 것만 내준다 — 아무도 꺼내지 않은 것을 짓지 않는다 */
  peek(token: string): unknown {
    return this.instances.get(token);
  }
}
