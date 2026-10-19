import type { HttpClient } from "./http.port";

/** 시험이 경로마다 응답을 정한다. 정하지 않은 경로를 부르면 그 경로 이름으로 실패한다 */
export class TestHttpClient implements HttpClient {
  private readonly answers = new Map<string, () => unknown>();
  readonly sent: Array<{ path: string; init: RequestInit }> = [];

  respond(path: string, answer: () => unknown): void {
    this.answers.set(path, answer);
  }

  get<T>(path: string): Promise<T> {
    return this.send<T>(path, { method: "GET" });
  }

  async send<T>(path: string, init: RequestInit): Promise<T> {
    this.sent.push({ path, init });
    const answer = this.answers.get(path);
    if (!answer) throw new Error(`시험이 응답을 정하지 않은 경로다: ${path}`);
    return answer() as T;
  }
}
