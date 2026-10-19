import type { NextConfig } from "next";

// /api/** 는 app/api/[...path]/route.ts 의 프록시가 실행 시점에 응용 서버(apps/api)로 넘긴다
// 런처가 알리는 주소는 127.0.0.1 이다 — next dev 는 localhost 만 같은 출처로 보므로 경고를 낸다
const nextConfig: NextConfig = { allowedDevOrigins: ["127.0.0.1"] };

export default nextConfig;
