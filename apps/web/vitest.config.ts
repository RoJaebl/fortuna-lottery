import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      "@widgets": path.resolve(__dirname, "src/widgets"),
      "@composition": path.resolve(__dirname, "src/composition"),
      "@infrastructure": path.resolve(__dirname, "src/infrastructure"),
      "@lib": path.resolve(__dirname, "src/shared/lib"),
      "@ui": path.resolve(__dirname, "src/shared/ui"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
