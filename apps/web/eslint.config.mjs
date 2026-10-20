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

// hook-resolves-own-key-only 의 첫 갈래 — action 파일 밖에서는 store 에서 꺼내지 않는다
const STORE_OUTSIDE_ACTION = {
  selector: "CallExpression[callee.name='useStore']",
  message: "store 에서 꺼내는 것은 action 의 훅뿐이다 (hook-resolves-own-key-only)",
};

// store-registers-at-top-level — 등록 호출은 모듈 최상단의 문장으로만 선다
const STORE_REGISTER_NESTED = {
  selector:
    "CallExpression[callee.object.name='store'][callee.property.name=/^(cache|http|event|invalidates|unaffected|route)$/]" +
    ":not(Program > ExpressionStatement > CallExpression)",
  message:
    "store 등록은 모듈 최상단에서만 한다 — 함수나 컴포넌트 안에서 하면 불릴 때마다 같은 key 를 다시 등록한다 (store-registers-at-top-level)",
};

// key 를 같은 파일의 등록과 대조하는 근사 둘 — hook-resolves-own-key-only 의 둘째 갈래와 rule-targets-own-cache.
// key 는 문자열 리터럴로만 읽는다
const storeCall = (node, names) =>
  node.callee.type === "MemberExpression" &&
  node.callee.object.name === "store" &&
  names.includes(node.callee.property.name);
const keyOf = (arg) => (arg?.type === "Literal" && typeof arg.value === "string" ? arg.value : null);

/** 이 파일이 areas 로 등록한 key 를 모으고, 파일 끝에서 pick 이 고른 인자마다 judge 를 돌린다 */
const ownKeyRule = (areas, pick, judge) => ({
  meta: { type: "problem", schema: [] },
  create(context) {
    const own = new Set();
    const used = [];
    return {
      CallExpression(node) {
        if (storeCall(node, areas) && keyOf(node.arguments[0])) own.add(keyOf(node.arguments[0]));
        const arg = pick(node);
        if (arg) used.push(arg);
      },
      "Program:exit"() {
        for (const arg of used) {
          const message = judge(keyOf(arg), own);
          if (message) context.report({ node: arg, message });
        }
      },
    };
  },
});

const STORE_KEYS = {
  rules: {
    "hook-resolves-own-key-only": ownKeyRule(
      ["cache", "http"],
      (node) => node.callee.name === "useStore" && node.arguments[0],
      (key, own) =>
        key === null
          ? "useStore 의 key 는 문자열 그대로 쓴다 (hook-resolves-own-key-only)"
          : /^(event|route)\./.test(key)
            ? "사건은 콜백의 emit 으로 내고 주소는 route(key) 로 만든다 — useStore 로 꺼내지 않는다 (hook-resolves-own-key-only)"
            : own.has(key)
              ? null
              : "훅은 이 파일이 store.cache·store.http 로 등록한 key 만 꺼낸다 (hook-resolves-own-key-only)",
    ),
    "rule-targets-own-cache": ownKeyRule(
      ["cache"],
      (node) => storeCall(node, ["invalidates", "unaffected"]) && node.arguments[1],
      (key, own) =>
        key !== null && own.has(key)
          ? null
          : "전파 규칙의 둘째 인자는 이 파일이 store.cache 로 등록한 key 다 — 규칙은 낡는 쪽 캐시의 파일에 둔다 (rule-targets-own-cache)",
    ),
  },
};

// no-path-literal (근사) — 주소는 route(key) 로만 만든다. 선택자 정규식 안의 / 는 / 로 적는다
const PATH_LITERAL = [
  {
    selector: "JSXAttribute[name.name='href'] :matches(Literal[value=/^\\u002F/], TemplateElement[value.raw=/^\\u002F/])",
    message: "주소는 @lib/store 의 route(key) 로 만든다 (no-path-literal)",
  },
  {
    selector: "CallExpression[callee.property.name=/^(push|replace)$/] > :matches(Literal[value=/^\\u002F/], TemplateLiteral[quasis.0.value.raw=/^\\u002F/])",
    message: "주소는 @lib/store 의 route(key) 로 만든다 (no-path-literal)",
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
    plugins: { store: STORE_KEYS },
    rules: {
      "no-restricted-imports": ["error", { patterns: [ROOT_ALIAS] }],
      "no-restricted-syntax": ["error", STORE_OUTSIDE_ACTION, STORE_REGISTER_NESTED],
      "store/rule-targets-own-cache": "error",
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
    // 라우트 폴더의 index.ts 는 등록 목록이라 자식 뷰 폴더의 _action/ 을 직접 짚는다 (frontend-module-layout §8).
    // 자식 뷰 폴더의 index.tsx 는 확장자가 달라 이 블록에 걸리지 않는다
    files: ["src/app/**/index.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [ROOT_ALIAS] }],
    },
  },
  {
    // 규칙 이름이 같으면 뒤 블록이 앞 블록을 통째로 덮는다 — 블록마다 걸릴 선택자를 전부 싣는다
    files: [`${SCREEN}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-syntax": ["error", VIEWMODEL_SPREAD, STORE_OUTSIDE_ACTION, STORE_REGISTER_NESTED, ...PATH_LITERAL],
    },
  },
  {
    files: [`${SCREEN}/**/*.action.ts`], // action 의 훅만 useStore 를 부른다
    rules: {
      "no-restricted-syntax": ["error", VIEWMODEL_SPREAD, STORE_REGISTER_NESTED, ...PATH_LITERAL],
      "store/hook-resolves-own-key-only": "error",
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
        STORE_OUTSIDE_ACTION,
        STORE_REGISTER_NESTED,
        ...PATH_LITERAL,
      ],
    },
  },
  {
    // store 자신의 시험은 it 안에서 등록하고 useStore 를 직접 부르는 것이 일이다
    files: ["src/shared/lib/store/store.test.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
);
