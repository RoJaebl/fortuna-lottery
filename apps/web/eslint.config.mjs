// 의존 방향·층 경계는 루트의 .dependency-cruiser.cjs 가 맡는다 (boundary-enforcement §2).
// 여기에는 코드 모양 규칙만 둔다 (boundary-enforcement §4, fractal-view-promotion §7).
import tseslint from "typescript-eslint";
// 경로 ↔ state key 규칙의 정본 — 검사기·스냅숏 시험·state 영역이 같은 함수로 판정한다 (frontend-store §3)
import { canReach, statePrefixOf } from "./src/framework/paths.mjs";

const VIEW_STATE = {
  selector: "CallExpression[callee.name=/^use(State|Reducer|Effect)$/]",
  message: "화면은 상태를 갖지 않는다. 상호작용 상태는 presenter 로, 서버 상태는 action 으로.",
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
    "CallExpression[callee.object.name='store'][callee.property.name=/^(state|cache|http|event|invalidates|unaffected|route)$/]" +
    ":not(Program > ExpressionStatement > CallExpression)," +
    // 옛 엔진의 createStore(areas) 는 첫 인자가 문자열이 아니라 세지 않는다
    "CallExpression[callee.name='createStore'][arguments.0.type='Literal']:not(Program > ExpressionStatement > CallExpression)",
  message:
    "store 등록은 모듈 최상단에서만 한다 — 함수나 컴포넌트 안에서 하면 불릴 때마다 같은 key 를 다시 등록한다 (store-registers-at-top-level)",
};

// 자체 규칙이 함께 쓰는 판정. key 는 문자열 리터럴로만 읽고, store 와 훅의 이름은 no-renamed-store-import 가 지킨다
const storeCall = (node, names) =>
  node.callee.type === "MemberExpression" &&
  node.callee.object.name === "store" &&
  names.includes(node.callee.property.name);
const hookCall = (node, name) => node.callee.type === "Identifier" && node.callee.name === name;
const keyOf = (arg) => (arg?.type === "Literal" && typeof arg.value === "string" ? arg.value : null);

/** 이 파일이 areas 로 등록한 key 를 모으고, 파일 끝에서 pick 이 고른 인자마다 judge 를 돌린다 — 근사 둘이 쓴다 */
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

/** 호출 하나를 보고 바로 판정한다 — state 영역의 정확한 검사들이 쓴다. judge 는 호출과 이 파일의 경로를 받는다 */
const callRule = (judge) => ({
  meta: { type: "problem", schema: [] },
  create(context) {
    // @fortuna-lottery/store 에서 createStore 로 가져온 지역 이름 — 옛 엔진의 createStore(areas) 는 출처가 달라 세지 않는다
    const created = new Set();
    const createCall = (node) => node.callee.type === "Identifier" && created.has(node.callee.name);
    return {
      ImportDeclaration(node) {
        if (node.source.value !== "@fortuna-lottery/store") return;
        for (const spec of node.specifiers) {
          if (spec.type === "ImportSpecifier" && spec.imported.name === "createStore") created.add(spec.local.name);
        }
      },
      CallExpression(node) {
        const message = judge(node, context.filename, createCall);
        if (message) context.report({ node, message });
      },
    };
  },
});

const STORE_KEYS = {
  rules: {
    "hook-resolves-own-key-only": ownKeyRule(
      ["cache", "http"],
      (node) => hookCall(node, "useStore") && node.arguments[0],
      (key, own) =>
        key === null
          ? "useStore 의 key 는 문자열 그대로 쓴다 (hook-resolves-own-key-only)"
          : /^state\./.test(key)
            ? "공통 상태는 presenter 가 useSharedState 로 꺼낸다 — useStore 로 꺼내지 않는다 (hook-resolves-own-key-only)"
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

    // state 영역의 다섯 — 정확한 검사다. key 가 소유 폴더의 경로이므로 판정이 문자열 비교 하나다
    "state-key-literal": callRule((node, _file, createCall) =>
      (hookCall(node, "useSharedState") || createCall(node)) && keyOf(node.arguments[0]) === null
        ? "state key 는 문자열 그대로 쓴다 — 변수나 템플릿으로 넘기면 자리와 범위를 판정할 수 없다 (state-key-literal)"
        : null,
    ),
    "state-key-matches-folder": callRule((node, file, createCall) => {
      const key = createCall(node) && keyOf(node.arguments[0]);
      const prefix = statePrefixOf(file);
      // 접두 뒤에는 이름 마디 하나만 온다 — 'state.documents.[id].panel' 을 app/documents/_state/ 가 등록하지 못하게 한다
      return key && !(key.startsWith(prefix) && !key.slice(prefix.length).includes("."))
        ? `이 파일이 등록하는 state key 는 ${prefix}<이름> 꼴이다 (state-key-matches-folder)`
        : null;
    }),
    "state-key-within-scope": callRule((node, file) => {
      const key = hookCall(node, "useSharedState") && keyOf(node.arguments[0]);
      return key && !canReach(key, file)
        ? "presenter 는 자기 폴더나 조상 폴더가 정의한 state key 만 꺼낸다 (state-key-within-scope)"
        : null;
    }),
    "state-only-in-presenter": callRule((node) =>
      hookCall(node, "useSharedState")
        ? "state key 를 꺼내는 것은 presenter 뿐이다 — 화면은 입력 묶음을 받고 action 은 공통 상태를 다루지 않는다 (state-only-in-presenter)"
        : null,
    ),
    "state-registers-in-state-folder": callRule((node, _file, createCall) =>
      createCall(node)
        ? "공통 상태는 _state/(위젯은 state/) 의 파일이 등록한다 (state-registers-in-state-folder)"
        : null,
    ),

    // 정확한 검사 — 규약 층의 store 와 훅은 제 이름으로만 가져온다. 이름 바꾸기·이름 공간·기본 import 를 모두 막는다
    "no-renamed-store-import": {
      meta: { type: "problem", schema: [] },
      create(context) {
        return {
          ImportDeclaration(node) {
            if (!/^(@framework(\/react)?|@fortuna-lottery\/store(\/react)?)$/.test(node.source.value)) return;
            for (const spec of node.specifiers) {
              if (spec.type !== "ImportSpecifier" || spec.imported.name !== spec.local.name) {
                context.report({
                  node: spec,
                  message: `${node.source.value} 에서는 제 이름으로만 가져온다 — 다른 이름이면 key 검사가 그 호출을 보지 못한다 (no-renamed-store-import)`,
                });
              }
            }
          },
        };
      },
    },
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
const STATE_FILES = ["src/app/**/_state/*.state.ts", "src/widgets/**/state/*.state.ts"];
const PRESENTER_FILES = ["src/**/*.presenter.{ts,tsx}"];

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
      "store/no-renamed-store-import": "error",
      "store/state-key-literal": "error",
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
      `${SCREEN}/**/*.presenter.tsx`, // JSX 를 담은 presenter 는 화면이 아니다
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
  // state 영역 — 규칙마다 이름이 달라 서로 덮지 않는다. 글롭은 그 규칙이 울어야 할 자리를 그대로 짚는다.
  // 두 규칙은 화면 쪽 코드에만 건다 — shared/lib·framework 의 시험이 store 를 직접 다뤄도 울지 않는다
  { files: [`${SCREEN}/**/*.{ts,tsx}`], ignores: PRESENTER_FILES, rules: { "store/state-only-in-presenter": "error" } },
  { files: [`${SCREEN}/**/*.{ts,tsx}`], ignores: STATE_FILES, rules: { "store/state-registers-in-state-folder": "error" } },
  { files: STATE_FILES, rules: { "store/state-key-matches-folder": "error" } },
  { files: PRESENTER_FILES, rules: { "store/state-key-within-scope": "error" } },
  {
    // 엔진과 규약 층의 시험은 it 안에서 시험용 key 로 등록하고 store 를 직접 다루는 것이 일이다
    files: ["src/{shared/lib,framework}/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": "off",
      "store/rule-targets-own-cache": "off",
      "store/state-key-literal": "off",
    },
  },
);
