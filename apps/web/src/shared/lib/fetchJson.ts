// 서버 호출 단일 경로 — action 이 부른다. 응답을 믿지 않고 unknown 으로 넘긴다: 파싱은 mapper 가 계약 스키마로 한다.
export async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(path, init);
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (body as { error?: unknown } | null)?.error;
    throw new Error(typeof message === "string" ? message : `요청 실패 (${res.status})`);
  }
  return body;
}
