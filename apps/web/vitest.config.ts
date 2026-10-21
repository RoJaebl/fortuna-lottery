import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig 의 jsx: preserve 는 Next 가 바꾸는 몫이다 — 시험에서는 esbuild 가 React 17+ 자동 런타임으로 바꾼다
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@widgets": path.resolve(__dirname, "src/widgets"),
      "@framework": path.resolve(__dirname, "src/framework"),
      "@composition": path.resolve(__dirname, "src/composition"),
      "@infrastructure": path.resolve(__dirname, "src/infrastructure"),
      "@lib": path.resolve(__dirname, "src/shared/lib"),
      "@ui": path.resolve(__dirname, "src/shared/ui"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    globalSetup: ["./vitest.store-gen.ts"],
    setupFiles: ["./src/test.setup.ts"],
  },
});
