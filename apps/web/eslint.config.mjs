// 아키텍처 경계 규칙 (설계 문서 v2 §4) — 위반 = 빌드 실패
import tseslint from "typescript-eslint";

/** FE가 core 내부(도메인/유스케이스/인프라)에 접근하는 것을 금지하는 패턴 */
const coreInternalPatterns = [
  {
    group: [
      "@lotto-lab/core/*/application",
      "@lotto-lab/core/*/domain",
      "@lotto-lab/core/*/infrastructure",
      "@lotto-lab/core/shared",
    ],
    message:
      "FE 모듈은 core의 dto만 타입 import할 수 있습니다 (경계 규칙). 로직이 필요하면 API route를 통하세요.",
  },
  {
    group: ["@/server/*", "@/server"],
    message: "FE 모듈은 서버 컴포지션 루트에 접근할 수 없습니다. HTTP(api-client)를 통하세요.",
  },
];

/** 모듈 간 deep import 금지 — 공개 index.ts로만 소통 */
const deepImportPattern = {
  group: ["@/modules/*/*"],
  message: "모듈 간에는 공개 API(@/modules/<name>)로만 import하세요 (deep import 금지).",
};

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  {
    files: ["src/modules/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": ["error", { patterns: [...coreInternalPatterns, deepImportPattern] }],
    },
  },
  {
    // 라우트 페이지는 모듈 조립만 — core 직접 접근 금지 (api/는 예외: 인프라 계층)
    files: ["src/app/**/*.{ts,tsx}"],
    ignores: ["src/app/api/**"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": ["error", { patterns: [...coreInternalPatterns, deepImportPattern] }],
    },
  },
);
