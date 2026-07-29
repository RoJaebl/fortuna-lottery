import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // packages/core는 순수 TS 소스 그대로 참조한다 (빌드 스텝 없음)
  transpilePackages: ["@lotto-lab/core"],
};

export default nextConfig;
