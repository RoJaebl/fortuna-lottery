// 서버 통신 단일 경로 — 모든 모듈의 api-client는 이 fetcher만 사용한다.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `요청 실패 (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // 본문이 JSON이 아니면 기본 메시지 유지
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

export async function apiGet<T>(url: string): Promise<T> {
  return handle<T>(await fetch(url));
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  return handle<T>(
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function apiDelete<T>(url: string): Promise<T> {
  return handle<T>(await fetch(url, { method: "DELETE" }));
}
