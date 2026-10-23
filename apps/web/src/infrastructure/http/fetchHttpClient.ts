import type { HttpClient } from "./http.port";

export class FetchHttpClient implements HttpClient {
  get<T>(path: string): Promise<T> {
    return this.send<T>(path, { method: "GET" });
  }

  // 서버가 검증하고 화면은 번역한다(스키마 파싱 없음, wire-contract §3). 실패 문구는 서버 본문의 error 를 따른다.
  async send<T>(path: string, init: RequestInit): Promise<T> {
    const res = await fetch(path, init);
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (body as { error?: unknown } | null)?.error;
      throw new Error(typeof message === "string" ? message : `요청 실패 (${res.status})`);
    }
    return (body ?? undefined) as T; // 204 와 빈 본문은 undefined
  }
}
