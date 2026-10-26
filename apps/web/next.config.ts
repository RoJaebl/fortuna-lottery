import type { NextConfig } from "next";
import { withStore } from "supa-store/next";

// /api/** 는 app/api/[...path]/route.ts 의 프록시가 실행 시점에 응용 서버(apps/api)로 넘긴다
// 런처가 알리는 주소는 127.0.0.1 이다 — next dev 는 localhost 만 같은 출처로 보므로 경고를 낸다
// typedRoutes — 주소 함수의 반환 타입 Route 가 실제 폴더와 맞는지 타입 검사가 본다 (frontend-app-layers §7)
const nextConfig: NextConfig = { allowedDevOrigins: ["127.0.0.1"], typedRoutes: true };

export default withStore(nextConfig);
