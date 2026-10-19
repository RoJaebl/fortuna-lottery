// 의존 방향·층 경계는 루트의 .dependency-cruiser.cjs 가 맡는다 (boundary-enforcement §2).
// 여기에는 코드 모양 규칙만 둔다 (boundary-enforcement §4, fractal-view-promotion §7).
import tseslint from "typescript-eslint";

const VIEW_STATE = {
  selector: "CallExpression[callee.name=/^use(State|Reducer|Effect)$/]",
  message: "화면은 상태를 갖지 않는다. 상호작용 상태는 표시 조정자로, 서버 상태는 action 으로.",
};

// 이 저장소가 더한 것: React.useState 처럼 멤버 호출로 부르는 꼴도 같은 상태 호출이다(boundary-enforcement §4 의 알려진 구멍).
const VIEW_STATE_MEMBER = {
  selector: "CallExpression[callee.type='MemberExpression'][callee.property.name=/^use(State|Reducer|Effect)$/]",
  message: VIEW_STATE.message,
};

// 이름에 기댄 근사다 — 변수 이름이 ViewModel 로 끝나거나 vm 인 것만 잡는다(boundary-enforcement §4).
const VIEWMODEL_SPREAD = {
  selector: "ObjectExpression > SpreadElement[argument.name=/ViewModel$|^vm$/]",
  message:
    "표시 모델을 얕은 전개로 복제하면 프로토타입이 떨어져 나간다. " +
    "Object.assign(new XViewModel(), vm, patch) 또는 withX() 를 쓴다.",
};

// hook-resolves-own-token-only (근사) — 둘로 나뉜다
const RESOLVE_OUTSIDE_ACTION = {
  selector: "CallExpression[callee.name='useResolve']",
  message: "컨테이너에서 꺼내는 것은 action 의 훅뿐이다 (hook-resolves-own-token-only)",
};
const RESOLVE_INFRA_TOKEN = {
  // 이 저장소의 infrastructure 토큰 이름 — infrastructure 에 토큰을 더하면 여기에도 더한다
  selector: "CallExpression[callee.name='useResolve'][arguments.0.name=/^(HTTP_CLIENT|DOMAIN_EVENTS|TEST_HTTP)$/]",
  message: "훅은 자기 유스케이스 토큰 하나만 꺼낸다 — infrastructure 토큰을 꺼내지 않는다 (hook-resolves-own-token-only)",
};

// no-path-literal (근사) — 주소는 app/routes.ts 로만 만든다. 선택자 정규식 안의 / 는 / 로 적는다
const PATH_LITERAL = [
  {
    selector: "JSXAttribute[name.name='href'] :matches(Literal[value=/^\\u002F/], TemplateElement[value.raw=/^\\u002F/])",
    message: "주소는 @app/routes 로 만든다 (no-path-literal)",
  },
  {
    selector: "CallExpression[callee.property.name=/^(push|replace)$/] > :matches(Literal[value=/^\\u002F/], TemplateLiteral[quasis.0.value.raw=/^\\u002F/])",
    message: "주소는 @app/routes 로 만든다 (no-path-literal)",
  },
];

// no-root-alias
const ROOT_ALIAS = {
  regex: "^@/",
  message: "층 별칭을 쓴다 (frontend-app-layers §3 층 별칭)",
};

// 뷰 폴더(PascalCase)는 index 만 공개한다 — 폴더 이름 뒤에 경로가 더 붙으면 그 안쪽을 짚은 것이다(fractal-view-promotion §6).
// 화면 모듈 사이 봉쇄는 dependency-cruiser 의 screen-must-not-reach-screen 이 맡는다.
const VIEW_FOLDER_SURFACE = [
  {
    regex: "^\\.{1,2}/(?:\\.\\./)*(?:[^/]+/)*[A-Z][A-Za-z0-9]*/",
    caseSensitive: true,
    message: "뷰 폴더 밖에서는 그 폴더의 index 만 가져온다 (fractal-view-promotion §6).",
  },
  {
    // 별칭(@app/) 경로로 같은 안쪽을 짚는 꼴 — 위 상대 경로 패턴과 같은 메시지다.
    regex: "^@app/(?:[^/]+/)*[A-Z][A-Za-z0-9]*/",
    caseSensitive: true,
    message: "뷰 폴더 밖에서는 그 폴더의 index 만 가져온다 (fractal-view-promotion §6).",
  },
];

// 화면 쪽 코드 — app/ 아래 라우트 폴더의 화면 모듈과 위젯. app/ 뿌리의 셸 파일도 이 글롭에 든다
const SCREEN = "src/{app,widgets}";

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": ["error", { patterns: [ROOT_ALIAS] }],
      "no-restricted-syntax": ["error", RESOLVE_OUTSIDE_ACTION],
    },
  },
  {
    // 규칙 이름이 같으면 뒤 블록이 앞 블록을 통째로 덮는다 — ROOT_ALIAS 를 함께 싣는다
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [ROOT_ALIAS, ...VIEW_FOLDER_SURFACE] }],
    },
  },
  {
    // 규칙 이름이 같으면 뒤 블록이 앞 블록을 통째로 덮는다 — 블록마다 걸릴 선택자를 전부 싣는다
    files: [`${SCREEN}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-syntax": ["error", VIEWMODEL_SPREAD, RESOLVE_OUTSIDE_ACTION, ...PATH_LITERAL],
    },
  },
  {
    files: [`${SCREEN}/**/*.action.ts`], // action 의 훅만 useResolve 를 부른다
    rules: {
      "no-restricted-syntax": ["error", VIEWMODEL_SPREAD, RESOLVE_INFRA_TOKEN, ...PATH_LITERAL],
    },
  },
  {
    files: [`${SCREEN}/**/*.tsx`],
    ignores: [
      `${SCREEN}/**/*.presenter.tsx`, // JSX 를 담은 조정자는 화면이 아니다
      "src/app/AppContainer.tsx", // 셸의 클라이언트 경계는 컨테이너를 useState 로 한 번 짓는다
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        VIEW_STATE,
        VIEW_STATE_MEMBER,
        VIEWMODEL_SPREAD,
        RESOLVE_OUTSIDE_ACTION,
        ...PATH_LITERAL,
      ],
    },
  },
);
