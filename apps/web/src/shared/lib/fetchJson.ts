// 서버 호출 단일 경로 — action 이 부른다. 응답 타입 T 는 mapper 의 매개변수(계약 타입)가 정한다. 서버가 검증하고 화면은 번역한다(스키마 파싱 없음, wire-contract §3).
export async function fetchJson<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (body as { error?: unknown } | null)?.error;
    throw new Error(typeof message === "string" ? message : `요청 실패 (${res.status})`);
  }
  return body as T;
}
