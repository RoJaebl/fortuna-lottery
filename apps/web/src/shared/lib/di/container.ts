/** 타입을 실은 값 — 꺼낸 값에 타입 단언을 쓰지 않게 한다 */
export interface Token<T> {
  readonly name: string;
  readonly _type?: T;
}

export function token<T>(name: string): Token<T> {
  return { name };
}

export class Container {
  private readonly factories = new Map<Token<unknown>, (c: Container) => unknown>();
  private readonly instances = new Map<Token<unknown>, unknown>();

  register<T>(t: Token<T>, f: (c: Container) => T): void {
    this.factories.set(t, f);
  }

  /** 처음 꺼낼 때 한 번 짓고, 그 뒤로는 같은 인스턴스를 내준다 */
  resolve<T>(t: Token<T>): T {
    if (!this.instances.has(t)) {
      const f = this.factories.get(t);
      if (!f) throw new Error(`등록되지 않은 토큰이다: ${t.name}`);
      this.instances.set(t, f(this));
    }
    return this.instances.get(t) as T; // 단언은 이 한 줄뿐이다 — 등록이 같은 토큰의 T 로 지었다
  }
}
