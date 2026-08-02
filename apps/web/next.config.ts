import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // packages/core는 순수 TS 소스 그대로 참조한다 (빌드 스텝 없음)
  transpilePackages: ["@fortuna-lottery/core"],
  // Prisma는 네이티브 엔진을 쓰므로 서버 번들에 넣지 않고 런타임에 그대로 require 한다
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
