import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// esbuild 는 데코레이터 메타데이터를 내지 않아 Nest 의 생성자 주입이 깨진다 — swc 로 바꾼다
export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  // Nest 를 처음 적재하는 데 10초 넘게 걸릴 때가 있다 — 기본 hookTimeout(10초)으로는 beforeAll 이 끊긴다.
  // 시험 본문에서 모듈을 띄우는 시험도 있어(IdentityFacade) testTimeout 도 같이 늘린다
  test: { include: ["src/**/*.test.ts"], hookTimeout: 30_000, testTimeout: 30_000 },
});
