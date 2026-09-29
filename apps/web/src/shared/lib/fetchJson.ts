// 서버 호출 단일 경로 — action 이 부른다. 응답을 unknown 으로 넘기고, mapper 가 계약 타입으로 좁혀 원형으로 옮긴다(스키마 파싱 없음, wire-contract §3).
export async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(path, init);
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (body as { error?: unknown } | null)?.error;
    throw new Error(typeof message === "string" ? message : `요청 실패 (${res.status})`);
  }
  return body;
}
