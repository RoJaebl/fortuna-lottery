// 의존 방향·층 경계는 루트의 .dependency-cruiser.cjs 가 맡는다 (boundary-enforcement §2).
// 여기에는 코드 모양 규칙만 둔다 (boundary-enforcement §4, fractal-view-promotion §7).
import tseslint from "typescript-eslint";

// 골조 이관 전 구역 — .dependency-cruiser.cjs 의 options.exclude 가운데 apps/web 몫과 같은 경로여야 한다.
// 그쪽 정규식에서 도메인이 빠질 때마다 여기서도 함께 뺀다. 이 목록도 줄기만 한다.
export const OLD_ZONE = ["src/modules/**", "src/server/**", "src/app/api/**"];

const VIEW_STATE = {
  selector: "CallExpression[callee.name=/^use(State|Reducer|Effect)$/]",
  message: "화면은 상태를 갖지 않는다. 상호작용 상태는 표시 조정자로, 서버 상태는 action 으로.",
};

// 이름에 기댄 근사다 — 변수 이름이 ViewModel 로 끝나거나 vm 인 것만 잡는다(boundary-enforcement §4).
const VIEWMODEL_SPREAD = {
  selector: "ObjectExpression > SpreadElement[argument.name=/ViewModel$|^vm$/]",
  message:
    "표시 모델을 얕은 전개로 복제하면 프로토타입이 떨어져 나간다. " +
    "Object.assign(new XViewModel(), vm, patch) 또는 withX() 를 쓴다.",
};

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  {
    ignores: OLD_ZONE,
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
  },
  {
    files: ["src/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", VIEWMODEL_SPREAD],
      // 뷰 폴더(PascalCase)도 index 만 공개한다 — 폴더 이름 뒤에 경로가 더 붙으면 그 안쪽을 짚은 것이다.
      // 모듈 사이 봉쇄는 dependency-cruiser 의 no-deep-module-import 가 맡는다.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^\\.{1,2}/(?:\\.\\./)*(?:[^/]+/)*[A-Z][A-Za-z0-9]*/",
              caseSensitive: true,
              message: "뷰 폴더 밖에서는 그 폴더의 index 만 가져온다 (fractal-view-promotion §6).",
            },
          ],
        },
      ],
    },
  },
  {
    // 규칙 이름이 같으면 뒤의 설정이 앞의 것을 통째로 덮는다 — 화면 파일에는 두 선택자를 함께 건다
    files: ["src/modules/**/*.tsx"],
    ignores: ["src/modules/**/*.presenter.tsx"], // JSX 를 담은 조정자는 화면이 아니다
    rules: {
      "no-restricted-syntax": ["error", VIEW_STATE, VIEWMODEL_SPREAD],
    },
  },
);
