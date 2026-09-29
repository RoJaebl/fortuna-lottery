import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /api/** 는 모두 응용 서버(apps/api)가 받는다 — Next 경로 처리기는 남아 있지 않다
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
