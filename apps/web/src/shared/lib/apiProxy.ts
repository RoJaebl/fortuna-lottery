// 브라우저의 /api/* 를 응용 서버(apps/api)로 그대로 넘기는 실행 시점 프록시.
// 주소(API_ORIGIN)는 요청마다 읽는다 — 빌드 때 굳지 않는다.

const UNREACHABLE_BODY = { error: "서버에 닿지 않습니다" };
const LOG_INTERVAL_MS = 5000;

// 요청을 넘길 때 버리는 헤더 — 홉 단위 헤더와 새로 계산되는 값
const DROPPED_REQUEST_HEADERS = ["host", "connection", "keep-alive", "transfer-encoding", "content-length"];
// fetch 가 본문을 이미 풀어 주므로 응답에서 버리는 헤더
const DROPPED_RESPONSE_HEADERS = ["content-encoding", "content-length", "connection", "keep-alive", "transfer-encoding"];

export type ApiProxyDeps = {
  origin?: string;
  fetchImpl?: typeof fetch;
  log?: (line: string) => void;
  now?: () => number;
};

let lastLogAt: number | null = null;

/** 시험이 로그 제한 상태를 처음으로 되돌린다. */
export function resetApiProxyLog(): void {
  lastLogAt = null;
}

export async function proxyToApi(
  request: Request,
  path: readonly string[],
  deps: ApiProxyDeps = {},
): Promise<Response> {
  const origin = deps.origin ?? process.env.API_ORIGIN ?? "http://127.0.0.1:4000";
  const fetchImpl = deps.fetchImpl ?? fetch;
  const log = deps.log ?? ((line: string) => console.error(line));
  const now = deps.now ?? Date.now;

  const search = new URL(request.url).search;
  const target = `${origin}/api/${path.join("/")}${search}`;

  const headers = new Headers(request.headers);
  for (const name of DROPPED_REQUEST_HEADERS) headers.delete(name);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  try {
    const upstream = await fetchImpl(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
    const responseHeaders = new Headers(upstream.headers);
    for (const name of DROPPED_RESPONSE_HEADERS) responseHeaders.delete(name);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    const at = now();
    if (lastLogAt === null || at - lastLogAt >= LOG_INTERVAL_MS) {
      lastLogAt = at;
      log(`[apiProxy] 응용 서버에 닿지 않습니다: ${origin}`);
    }
    return Response.json(UNREACHABLE_BODY, { status: 503 });
  }
}
