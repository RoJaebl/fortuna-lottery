// 사례: 규약 층의 http 영역이 HTTP 구현의 자리를 안다 — 규약 층은 shared/lib 만 보고, 포트는 StoreDeps 타입으로만 받는다.
import type { HttpClient } from "@infrastructure/http";
export type Http = HttpClient;
