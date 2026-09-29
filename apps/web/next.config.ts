import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // packages/core는 순수 TS 소스 그대로 참조한다 (빌드 스텝 없음)
  transpilePackages: ["@fortuna-lottery/core"],
  // Prisma는 네이티브 엔진을 쓰므로 서버 번들에 넣지 않고 런타임에 그대로 require 한다
  serverExternalPackages: ["@prisma/client"],
  // 응용 서버(apps/api)로 넘긴다. fallback 이므로 아직 남은 Next 경로 처리기(app/api/**)가 먼저 응답한다 —
  // 도메인을 옮길 때 그 처리기를 지우는 것이 곧 전환이다
  rewrites: async () => ({
    fallback: [
      {
        source: "/api/:path*",
        destination: `${process.env.API_ORIGIN ?? "http://localhost:4000"}/api/:path*`,
      },
    ],
  }),
};

export default nextConfig;
