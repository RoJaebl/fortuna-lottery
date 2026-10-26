// 의존 방향·층 경계는 루트의 .dependency-cruiser.cjs 가 맡는다 (boundary-enforcement §2).
// 여기에는 코드 모양 규칙만 둔다 (boundary-enforcement §4, fractal-view-promotion §7).
import tseslint from "typescript-eslint";
// 경로 ↔ store key 규칙의 정본 — 검사기 도우미 자리에 두고 아래 key 검사들이 같은 함수로 판정한다 (frontend-store §3)
import { canReach, infraKeyOf, keyPrefixOf } from "./eslint/paths.mjs";

const VIEW_STATE = {
  selector: "CallExpression[callee.name=/^use(State|Reducer|Effect)$/]",
  message: "화면은 상태를 갖지 않는다. 상호작용 상태는 presenter 로, 서버 상태는 자원으로.",
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

// store-registers-at-top-level — 등록 호출은 모듈 최상단의 문장으로만 선다
const STORE_REGISTER_NESTED = {
  selector: "CallExpression[callee.name='createStore'][arguments.0.type='Literal']:not(Program > ExpressionStatement > CallExpression)",
  message:
    "store 등록은 모듈 최상단에서만 한다 — 함수나 컴포넌트 안에서 하면 불릴 때마다 같은 key 를 다시 등록한다 (store-registers-at-top-level)",
};

// no-namespace-store-import — 이름공간으로 가져오면 S.useStore(…)·S.createStore(…) 꼴이 되어 store key 검사가 알아보지 못한다
const STORE_NAMESPACE_IMPORT = {
  selector: "ImportDeclaration[source.value=/^supa-store/] > ImportNamespaceSpecifier",
  message:
    "supa-store 는 이름으로 가져온다 — import * as 로 가져오면 store key 규칙을 비켜 간다 (no-namespace-store-import)",
};

const keyOf = (arg) => (arg?.type === "Literal" && typeof arg.value === "string" ? arg.value : null);
const isFunction = (node) => /Function/.test(node.type);

/**
 * 호출 하나를 보고 바로 판정한다 — store key 검사와 ctx 검사가 쓴다.
 * judge 는 호출·이 파일의 경로·호출의 갈래를 받는다. 갈래는 넷이다.
 *   create — supa-store 에서 가져온 createStore
 *   hook   — supa-store/react 에서 가져온 useStore
 *   ctx    — createStore 에 넘긴 creator 의 셋째 인자. 이름은 쓰는 이가 정하므로 그 자리에서 읽는다
 *   top    — 이 호출이 store 를 짓는 순간 한 번 도는 자리에 있는가. 감싼 가장 가까운 함수가 creator 이거나,
 *            그 자리에서 부른 createResource·createEvent(supa-store/query)의 첫 인자 함수다 —
 *            createResource 는 정의 함수를 짓는 순간 한 번 부른다
 * 가져온 이름은 바꿔 가져와도 따라가지만, 이름 공간 import(import * as s)와 구조 분해한 ctx 는 보지 못한다
 */
const callRule = (judge) => ({
  meta: { type: "problem", schema: [] },
  create(context) {
    const created = new Set();
    const hooks = new Set();
    const builders = new Set();
    const ctxs = new Set();
    const tops = new Set();
    const named = (set) => (node) => node.callee.type === "Identifier" && set.has(node.callee.name);
    const top = (node) => {
      let at = node.parent;
      while (at && !isFunction(at)) at = at.parent;
      return tops.has(at);
    };
    const kind = { create: named(created), hook: named(hooks), ctx: named(ctxs), top };
    const sources = {
      "supa-store": [created, ["createStore"]],
      "supa-store/react": [hooks, ["useStore"]],
      "supa-store/query": [builders, ["createResource", "createEvent"]],
    };
    return {
      ImportDeclaration(node) {
        const into = sources[node.source.value];
        if (!into) return;
        for (const spec of node.specifiers) {
          if (spec.type === "ImportSpecifier" && into[1].includes(spec.imported.name)) into[0].add(spec.local.name);
        }
      },
      CallExpression(node) {
        // 짓는 순간 도는 함수를 들어가기 전에 적는다 — 안쪽 호출은 이 뒤에 찾아온다
        const creator = kind.create(node) && node.arguments[1];
        if (creator && isFunction(creator)) {
          tops.add(creator);
          if (creator.params[2]?.type === "Identifier") ctxs.add(creator.params[2].name);
        }
        const define = named(builders)(node) && top(node) && node.arguments[0];
        if (define && isFunction(define)) tops.add(define);
        const message = judge(node, context.filename, kind);
        if (message) context.report({ node, message });
      },
    };
  },
});

const STORE_KEYS = {
  rules: {
    // store key 검사 다섯 — 정확한 검사다. key 가 소유 폴더의 경로이므로 판정이 문자열 비교 하나다.
    // 이름은 state 영역 시절의 것을 그대로 두고, state.·api.·event.·infra. key 와 useStore·ctx 호출을 모두 본다
    "state-key-literal": callRule((node, _file, kind) =>
      (kind.hook(node) || kind.create(node) || kind.ctx(node)) && keyOf(node.arguments[0]) === null
        ? "store key 는 문자열 그대로 쓴다 — 변수나 템플릿으로 넘기면 자리와 범위를 판정할 수 없다 (state-key-literal)"
        : null,
    ),
    "state-key-matches-folder": callRule((node, file, kind) => {
      const key = kind.create(node) && keyOf(node.arguments[0]);
      if (!key) return null;
      const infra = infraKeyOf(file);
      if (infra !== null) {
        return key === infra ? null : `infrastructure/ 의 파일이 등록하는 store key 는 ${infra} 다 (state-key-matches-folder)`;
      }
      const area = key.split(".")[0];
      if (!["state", "api", "event"].includes(area)) {
        return "이 파일이 등록하는 store key 의 접두는 state.·api.·event. 가운데 하나다 — infra. 는 infrastructure/<이름>/ 에서만 등록한다 (state-key-matches-folder)";
      }
      const prefix = keyPrefixOf(file, area);
      // 접두 뒤에는 이름 마디 하나만 온다 — 'state.documents.[id].panel' 을 app/documents/_state/ 가 등록하지 못하게 한다
      return key.startsWith(prefix) && !key.slice(prefix.length).includes(".")
        ? null
        : `이 파일이 등록하는 store key 는 ${prefix}<이름> 꼴이다 (state-key-matches-folder)`;
    }),
    "state-key-within-scope": callRule((node, file, kind) => {
      const key = (kind.hook(node) || kind.ctx(node)) && keyOf(node.arguments[0]);
      return key && !canReach(key, file)
        ? "자기 폴더나 조상 폴더가 정의한 store key 만 꺼낸다 — event 는 범위 밖에서도, infra 는 어디서나 꺼낸다 (state-key-within-scope)"
        : null;
    }),
    "state-only-in-presenter": callRule((node, _file, kind) =>
      kind.hook(node)
        ? "store 를 화면에서 꺼내는 것은 presenter 뿐이다 — 화면은 입력 묶음을 받는다 (state-only-in-presenter)"
        : null,
    ),
    "state-registers-in-state-folder": callRule((node, _file, kind) =>
      kind.create(node)
        ? "store 는 정의 파일이 등록한다 — _state/·_action/ 의 *.state.ts(위젯은 state/), 바깥 도구는 infrastructure/<이름>/ 의 *.state.ts (state-registers-in-state-folder)"
        : null,
    ),
    // 근사 검사 — creator 맨 위(안쪽 함수 밖)와 그 자리의 createResource·createEvent 정의 함수 맨 위에서
    // ctx(…) 로 꺼낸 값은 짓는 순간의 값이라 곧 낡는다. 조회·바꾸기 함수 안은 맨 위가 아니다. 그 자리에서 ctx 를 쓰는 것은 event 에 on·exempt 를 거는 일 하나다. ctx 를 이름으로 알아보므로(creator 의 셋째 인자 이름)
    // 구조 분해하거나 다른 이름에 옮겨 담은 ctx 는 보지 못한다
    "ctx-at-top-binds-event-only": callRule((node, _file, kind) => {
      if (!kind.ctx(node) || !kind.top(node)) return null;
      const member = node.parent;
      const binds =
        member.type === "MemberExpression" &&
        member.object === node &&
        ["on", "exempt"].includes(member.property.name) &&
        member.parent.type === "CallExpression" &&
        member.parent.callee === member;
      return binds
        ? null
        : "creator·자원 정의 함수의 맨 위에서 ctx 로 꺼낸 것은 event 의 on·exempt 를 거는 데만 쓴다 — 값은 함수 안에서 필요한 순간에 꺼낸다 (ctx-at-top-binds-event-only)";
    }),
  },
};

// styles-owned-by-its-screen — 서식의 주인은 폴더가 정한다. 판정이 둘이다.
// (1) X.styles 를 가져올 수 있는 파일은 폴더 X 의 index.tsx 와 같은 폴더의 X.styles.test.ts 뿐이다. 다른 화면이 쓰면 소비자를 세어
//     공통 조상으로 올린다 (fractal-view-promotion §3 소유물의 자리). 상대 경로 ./X.styles 꼴만 알아본다.
// (2) 파일 이름이 X.styles.ts 이면 그 파일이 선 폴더의 이름이 X 여야 한다 — 서식을 가진 뷰는 폴더로 승격한다.
// 정적 import 선언만 본다 — 재내보내기(export … from)와 동적 import() 는 검사하지 않는다.
// vault 골조가 이 규칙을 개정 중이다(vault 브랜치 styles-folder+, docs/superpowers/plans/2026-10-23-styles-promote-view.md).
// 개정이 dev 에 들어가기 전까지 이 저장소가 먼저 따른다.
const STYLE_OWNERS = {
  rules: {
    "styles-owned-by-its-screen": {
      meta: { type: "problem", schema: [] },
      create(context) {
        const parts = context.filename.split(/[\\/]/);
        const base = parts.at(-1);
        const folder = parts.at(-2);
        return {
          Program(node) {
            const own = /^(.+)\.styles\.ts$/.exec(base);
            if (own && own[1] !== folder) {
              context.report({
                node,
                message: `서식 파일 ${base} 는 폴더 ${own[1]} 안에 둔다 — 서식을 가진 뷰는 폴더로 승격한다 (styles-owned-by-its-screen)`,
              });
            }
          },
          ImportDeclaration(node) {
            const hit = /^(?:(\.\/)|.*\/)([^/]+)\.styles(?:\.js)?$/.exec(node.source.value);
            if (!hit) return;
            const name = hit[2];
            const owner =
              hit[1] !== undefined &&
              ((base === "index.tsx" && folder === name) || base === `${name}.styles.test.ts`);
            if (!owner) {
              context.report({
                node,
                message: `${name}.styles.ts 는 폴더 ${name} 의 index.tsx 와 ${name}.styles.test.ts 만 쓴다 — 다른 화면이 쓰면 소비자를 세어 공통 조상으로 올린다 (fractal-view-promotion §3 소유물의 자리, styles-owned-by-its-screen)`,
              });
            }
          },
        };
      },
    },
  },
};

// no-root-alias
const ROOT_ALIAS = {
  regex: "^@/",
  message: "층 별칭을 쓴다 (frontend-app-layers §3 층 별칭)",
};

// style-tools-through-lib — tailwind-variants·tailwind-merge 는 shared/lib/style/{cn,tv}.ts 만 직접 가져온다.
// 이 저장소의 토큰 이름을 아는 합치기가 그쪽뿐이라, 다른 곳에서 가져오면 토큰끼리 부딪혀도 합쳐지지 않는다.
const STYLE_TOOLS = {
  group: ["tailwind-variants", "tailwind-variants/*", "tailwind-merge", "tailwind-merge/*"],
  message: "@lib/style/tv·@lib/style/cn 을 쓴다 — 이 저장소의 토큰 이름을 아는 합치기는 그쪽뿐이다 (style-tools-through-lib)",
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
// 정의 파일 — 공통 상태(_state/)·자원과 event(_action/)·바깥 도구(infrastructure/<이름>/)
const STATE_FILES = [
  "src/app/**/_state/*.state.ts",
  "src/app/**/_action/*.state.ts",
  "src/widgets/**/state/*.state.ts",
  "src/infrastructure/**/*.state.ts",
];
// 시험은 overrideStore 로 갈아 끼우고 it 안에서 등록할 수 있다 — 등록 자리 검사 둘(store-registers-at-top-level·state-registers-in-state-folder)에서 뺀다.
// 자원 시험은 화면 없이 useStore 로 자원을 직접 꺼내 보므로 state-only-in-presenter 에서도 뺀다
const TEST_FILES = ["src/**/*.test.{ts,tsx}"];
const PRESENTER_FILES = ["src/**/*.presenter.{ts,tsx}"];

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    plugins: { store: STORE_KEYS, style: STYLE_OWNERS },
    rules: {
      "no-restricted-imports": ["error", { patterns: [ROOT_ALIAS, STYLE_TOOLS] }],
      "no-restricted-syntax": ["error", STORE_REGISTER_NESTED, STORE_NAMESPACE_IMPORT],
      "store/state-key-literal": "error",
      "style/styles-owned-by-its-screen": "error",
    },
  },
  {
    // 규칙 이름이 같으면 뒤 블록이 앞 블록을 통째로 덮는다 — ROOT_ALIAS 를 함께 싣는다
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [ROOT_ALIAS, STYLE_TOOLS, ...VIEW_FOLDER_SURFACE] }],
    },
  },
  {
    // 두 도구 파일만 라이브러리를 직접 가져온다 — 규칙 이름이 같으므로 ROOT_ALIAS 는 다시 싣는다
    files: ["src/shared/lib/style/{cn,tv}.ts"],
    rules: { "no-restricted-imports": ["error", { patterns: [ROOT_ALIAS] }] },
  },
  {
    // 규칙 이름이 같으면 뒤 블록이 앞 블록을 통째로 덮는다 — 블록마다 걸릴 선택자를 전부 싣는다
    files: [`${SCREEN}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-syntax": ["error", VIEWMODEL_SPREAD, STORE_REGISTER_NESTED, STORE_NAMESPACE_IMPORT],
    },
  },
  {
    files: [`${SCREEN}/**/*.tsx`],
    ignores: [`${SCREEN}/**/*.presenter.tsx`], // JSX 를 담은 presenter 는 화면이 아니다
    rules: {
      "no-restricted-syntax": [
        "error",
        VIEW_STATE,
        VIEW_STATE_MEMBER,
        VIEWMODEL_SPREAD,
        STORE_REGISTER_NESTED,
        STORE_NAMESPACE_IMPORT,
      ],
    },
  },
  // store key 검사 — 규칙마다 이름이 달라 서로 덮지 않는다. 글롭은 그 규칙이 울어야 할 자리를 그대로 짚는다.
  // 꺼내기 검사는 화면 쪽 코드에만 건다
  {
    files: [`${SCREEN}/**/*.{ts,tsx}`],
    ignores: [...PRESENTER_FILES, ...TEST_FILES],
    rules: { "store/state-only-in-presenter": "error" },
  },
  // 등록 자리는 앱 전체에서 본다 — infrastructure/ 의 정의 파일 밖에서 바깥 도구를 등록하는 것도 막는다
  { files: ["src/**/*.{ts,tsx}"], ignores: [...STATE_FILES, ...TEST_FILES], rules: { "store/state-registers-in-state-folder": "error" } },
  { files: STATE_FILES, rules: { "store/state-key-matches-folder": "error", "store/ctx-at-top-binds-event-only": "error" } },
  // presenter 는 useStore 로, 정의 파일은 ctx 로 꺼낸다 — 둘 다 닿는 범위를 잰다
  { files: [...PRESENTER_FILES, ...STATE_FILES], rules: { "store/state-key-within-scope": "error" } },
  // 시험에서는 store-registers-at-top-level(STORE_REGISTER_NESTED)을 뺀다. 규칙 이름이 같으면 뒤 블록이 덮으므로 선택자를 다시 싣는다
  { files: TEST_FILES, rules: { "no-restricted-syntax": "off" } },
  { files: [`${SCREEN}/**/*.test.{ts,tsx}`], rules: { "no-restricted-syntax": ["error", VIEWMODEL_SPREAD] } },
);
