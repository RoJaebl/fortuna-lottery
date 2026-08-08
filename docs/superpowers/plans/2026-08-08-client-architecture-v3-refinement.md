# 클라이언트 아키텍처 v3 보정 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/web/src/modules/**`의 7개 모듈과 App 셸을 `action / model / mapper / view` 4폴더 구조로 재편하고, ViewModel을 파생값을 소유하는 class로 승격시켜 View에서 로직을 0으로 만든다.

**Architecture:** View는 레이아웃만 그리고, Presenter가 자식별 props 번들을 만들며, Action이 서버 상태(`ActionState<T>`)와 Model↔ViewModel 경계를 독점하고, mapper가 DTO↔Model 변환만 담당한다. ViewModel은 `implements Model`인 class로서 파생값을 prototype getter로 소유한다.

**Tech Stack:** TypeScript 5.8 · React 19 · Next.js 15 (App Router) · Vitest 3 (+ jsdom · @testing-library/react) · ESLint 9 flat config (typescript-eslint)

**근거 스펙:** `docs/superpowers/specs/2026-08-08-fortuna-lottery-client-architecture-v3-refinement-design.md`
(선행: `2026-08-05-...-client-architecture-v3-design.md` — §0·§3·§5.1·§5.2·§5.3·§6이 보정 문서로 개정됨)

---

## 이 계획을 실행하기 전에 알아야 할 것

### 용어 한 줄 요약

| 이름 | 파일 | 하는 일 |
|---|---|---|
| **View** | `view/<name>.tsx` | JSX 레이아웃 + 번들 spread. **로직 0** |
| **Presenter** | `view/<domain>.presenter.ts` | React 상태 해석 · 자식별 props 번들 조립 · Action 간 순서 조합 · `now` 의존 값 |
| **Action** | `action/<verb><Noun>.action.ts` | 서버 호출 + `ActionState<T>` 소유 + **Model→ViewModel 승격** |
| **Mapper** | `mapper/<domain>.mapper.ts` | Model↔DTO 변환만. **DTO를 import하는 유일한 폴더** |
| **Model** | `model/<domain>.model.ts` | interface. 로직 없음 |
| **ViewModel** | `model/<domain>.viewmodel.ts` | `implements Model`인 **class**. 파생값을 getter로 소유 |

### 반복해서 지킬 규칙 6개

1. **파생값은 저장 필드가 아니라 prototype getter.** 원본과 파생이 어긋날 수 없게 하기 위함이다.
2. **메서드는 `method() {}`.** 인스턴스 화살표 프로퍼티 `method = () => {}` 는 금지.
3. **인스턴스 상태를 안 쓰는 함수는 `static`** (팩토리 `from`·`fromAll`, 순수 헬퍼).
4. **저장 필드는 서버 원본 데이터와 UI 상태에만 허용.**
5. **폴더 밖에서는 배럴 경로로만 import**(`../model`, `../action`). **같은 폴더 안에서는 형제 파일을 직접 import**(`./pick.model`) — 배럴 경유는 순환을 만든다.
6. **상태를 바꾸는 Action은 `setState` 외에 결과를 반환한다.** React 상태는 다음 렌더에서야 갱신되므로, 호출 직후 `action.data`를 읽으면 이전 값을 본다.

### props 번들 타입을 어디에 선언하는가

- **실제 자식 컴포넌트**(`view/component/*.tsx`)가 있으면: 그 자식이 자기 props interface를 `export`하고 **Presenter가 그것을 import**한다(단방향 — 반대는 순환).
- **대표 View 자신의 렌더링 슬롯**(자식 컴포넌트로 쪼개지 않은 조각)이면: 번들 interface를 **Presenter 파일 안에 선언**한다. 대표 View는 자식이 아니므로 import할 props 타입이 없고, View가 Presenter를 import하는 구조에서 반대 방향 import는 순환이 된다.

### 스펙과 의도적으로 다르게 가는 3가지 (실행 중 판단하지 말 것 — 이미 결정됐다)

1. **`PickModel`의 필드명은 `createdAt: Date`를 유지한다.** 스펙 §3.4 스니펫은 `savedAt!: string`으로 쓰여 있지만 그건 예시이고, `createdAt`은 `PickResponse` DTO의 필드명과 일치한다. 스펙 §3.2가 요구하는 것은 **getter 이름이 `savedAtLabel`인 것**이며 그것만 지킨다.
2. **`lotterietus` Presenter 번들에 `cta`·`error`를 추가한다.** 스펙 §2.2 표는 데이터 번들(`countdown`·`drawInfo`)만 열거한 것인데, 이 카드에는 생성기 토글 CTA 버튼과 에러 표시 슬롯이 실제로 있다.
3. **모듈 공개 배럴(`modules/<d>/index.ts`)은 하위 배럴 경로에서 가져오되, 다른 모듈이 실제로 쓰는 심볼만 재export한다.** 스펙 §5-4의 "하위 배럴을 재export"는 경로 규칙이고, 무엇을 공개할지는 별개 축이다 — 전부 쏟아내면 모듈 경계가 무의미해진다.

### 스펙 내부의 모순 하나 (이미 판정했다)

스펙 §7.2 표는 results에 `checkResultsRequest · checkResultsResponse` 둘 다 적어놨지만, 바로 아래 문단은
"파라미터 없는 GET은 Response mapper만 둔다"고 규정한다. `/api/results`는 **본문도 파라미터도 없는 GET**이므로
**Response mapper만 만든다.** 표 쪽이 오기다.

### 진행 순서 (스펙 §11)

`identity → results → simulation → lotterietus → generator → picks → statistics → App 셸`

한 모듈을 완전히 전환하고 `pnpm --filter web test` + `lint` + `build`를 통과시킨 뒤 다음으로 넘어간다.
class ViewModel 패턴은 **`results`에서 처음 실질적으로 검증**된다 — 여기서 어긋나면 나머지 5개로 확산하기 전에 잡는다.

### 브랜치 주의 (CLAUDE.md known quirk)

이 저장소는 OneDrive 동기화 폴더 안에 있다. 브랜치/워크트리가 필요하면 **raw `git worktree add` 금지** — Orca 네이티브 워크트리 생성(`EnterWorktree` 도구 또는 `orca worktree create`)을 쓴다.

---

## 파일 구조 (최종 상태)

```
packages/contract/                         ← Task 1 신규
  package.json · tsconfig.json
  src/<domain>/<domain>.dto.ts · index.ts   generator·lotterietus·picks·results·simulation·statistics

apps/web/src/
  app/
    page.tsx                               모듈 조립만 (프레임워크 규약 파일명 유지)
    home.presenter.ts                      useHomePresenter — currentNumbers·isGeneratorOpen·activeTab
  modules/
    identity/
      model/  index.ts · identity.model.ts · identity.viewmodel.ts
      view/   index.ts · identityBadge.tsx · identity.presenter.ts
      index.ts                             action·mapper 없음 (서버 호출 없는 스텁)
    results/
      action/ index.ts · checkResults.action.ts
      model/  index.ts · results.model.ts · results.viewmodel.ts · results.viewmodel.test.ts
      mapper/ index.ts · results.mapper.ts
      view/   index.ts · resultsCard.tsx · results.presenter.ts
      index.ts
    simulation/
      action/ index.ts · backtest.action.ts
      model/  index.ts · simulation.model.ts · simulation.viewmodel.ts · simulation.viewmodel.test.ts
      mapper/ index.ts · simulation.mapper.ts
      view/   index.ts · simulationCard.tsx · simulation.presenter.ts
      index.ts
    lotterietus/
      action/ index.ts · getLotterietusStatus.action.ts · getLotterietusStatus.action.test.ts
      model/  index.ts · lotterietus.model.ts · lotterietus.viewmodel.ts · lotterietus.viewmodel.test.ts
      mapper/ index.ts · lotterietus.mapper.ts
      view/   index.ts · lotterietusCard.tsx · lotterietus.presenter.ts · lotterietus.presenter.test.ts
      index.ts
    generator/
      action/ index.ts · generateCombination.action.ts
      model/  index.ts · generator.model.ts · generator.viewmodel.ts · generator.viewmodel.test.ts
      mapper/ index.ts · generator.mapper.ts
      view/   index.ts · generatorCard.tsx · generator.presenter.ts
              component/ index.ts · modeSelector.tsx · numberPad.tsx · generatedResult.tsx
      index.ts
    picks/
      action/ index.ts · getPicks.action.ts · savePick.action.ts · deletePick.action.ts
      model/  index.ts · pick.model.ts · pick.viewmodel.ts · pick.viewmodel.test.ts
      mapper/ index.ts · picks.mapper.ts · picks.mapper.test.ts
      view/   index.ts · picksCard.tsx · picks.presenter.ts
              component/ index.ts · pickRow.tsx
      index.ts
    statistics/
      action/ index.ts · getStatistics.action.ts
      model/  index.ts · statistics.model.ts · statistics.viewmodel.ts · statistics.viewmodel.test.ts
      mapper/ index.ts · statistics.mapper.ts
      view/   index.ts · statisticsPanel.tsx · statistics.presenter.ts · statistics.presenter.test.ts
              component/ index.ts + 8개 서브뷰
      index.ts
  shared/
    lib/ fetcher.ts · lotto-colors.ts · actionState.ts   ← actionState.ts Task 2 신규
    ui/  (변경 없음)
```

전 모듈에서 `api/` · `viewmodel/` · `transport/` 폴더가 사라진다.

---

## Task 1: `packages/contract` 분리 — DTO를 core에서 떼어낸다

**왜 먼저인가:** 이 리팩터는 모든 mapper의 DTO import 경로를 만진다. 백엔드 v4 전환(동반 문서 §10 1단계)도 같은 경로를 바꾼다. 지금 한 번만 만지고 끝낸다.

**주의 — statistics DTO는 평탄화해야 한다.** 현재 `statistics.dto.ts`가 `../application/readmodel/statistics.readmodel`을 import해서 `extends`하고 있다. 계약 패키지는 core에 의존할 수 없으므로 필드를 인라인으로 펼쳐 선언한다.

**Files:**
- Create: `packages/contract/package.json`, `packages/contract/tsconfig.json`
- Create: `packages/contract/src/{generator,lotterietus,picks,results,simulation,statistics}/*.dto.ts` + 각 `index.ts`
- Delete: `packages/core/src/*/dto/` (6개 폴더)
- Modify: `packages/core/package.json`, `apps/web/package.json`
- Modify: core·web에서 `@fortuna-lottery/core/*/dto`를 import하던 모든 파일

---

- [ ] **Step 1: 계약 패키지 뼈대 생성**

`packages/contract/package.json`:

```json
{
  "name": "@fortuna-lottery/contract",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    "./*": "./src/*/index.ts"
  },
  "scripts": {
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.8.0"
  }
}
```

`packages/contract/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 2: DTO 6개 도메인을 계약 패키지로 옮긴다**

`packages/contract/src/generator/generator.dto.ts`:

```ts
/** 조합 생성 요청 DTO — 자동(빈 fixed) / 부분 선택 / 직접 입력(6개 fixed) */
export interface GenerateRequest {
  fixedNumbers?: number[];
  excludedNumbers?: number[];
}

export interface GenerateResponse {
  numbers: number[];
}
```

`packages/contract/src/generator/index.ts`:

```ts
export * from "./generator.dto";
```

`packages/contract/src/lotterietus/lotterietus.dto.ts`:

```ts
/** 회차 조회 응답 DTO — 와이어 계약 (클라이언트 무관, results 도메인도 사용) */
export interface DrawResponse {
  round: number;
  numbers: number[];
  bonus: number;
  drawnAt: string;
}

/** 로또 현황 응답 DTO — 최근 회차 + 다음 추첨 정보 */
export interface LotterietusStatusResponse {
  round: number;
  numbers: number[];
  bonus: number;
  drawnAt: string;
  nextRound: number;
  nextDrawAt: string;
}
```

`packages/contract/src/lotterietus/index.ts`:

```ts
export * from "./lotterietus.dto";
```

`packages/contract/src/picks/pick.dto.ts`:

```ts
export interface SavePickRequest {
  numbers: number[];
}

export interface PickResponse {
  id: string;
  numbers: number[];
  createdAt: string;
}
```

`packages/contract/src/picks/index.ts`:

```ts
export * from "./pick.dto";
```

`packages/contract/src/results/results.dto.ts` — **패키지 내부 상호 참조는 상대 경로**로 쓴다(subpath export 경유는 자기 패키지 안에서 순환 해석을 만든다):

```ts
import type { DrawResponse } from "../lotterietus/lotterietus.dto";

export interface ResultItemResponse {
  pickId: string;
  numbers: number[];
  matchedNumbers: number[];
  matchedCount: number;
  bonusMatched: boolean;
  /** 0 = 낙첨, 1~5 = 등수 */
  rank: number;
}

/** 당첨 대조 응답 DTO — 대조 기준 회차 + 픽별 채점 결과 */
export interface ResultsResponse {
  draw: DrawResponse | null;
  items: ResultItemResponse[];
}
```

`packages/contract/src/results/index.ts`:

```ts
export * from "./results.dto";
```

`packages/contract/src/simulation/simulation.dto.ts`:

```ts
export interface SimulationRequest {
  numbers: number[];
}

/** 백테스트 응답 DTO — 등수별 횟수 + 당첨 회차 목록 (사실 그대로) */
export interface SimulationResponse {
  totalDraws: number;
  /** index = 등수 (0 = 낙첨) */
  rankCounts: number[];
  wins: { round: number; rank: number; matchedCount: number }[];
}
```

`packages/contract/src/simulation/index.ts`:

```ts
export * from "./simulation.dto";
```

`packages/contract/src/statistics/statistics.dto.ts` — **`StatisticsReadModel` extends를 풀고 필드를 인라인으로 펼친다**:

```ts
/**
 * 통계 응답 DTO — 와이어 계약. 백엔드의 파생 모델을 extends하지 않고 필드를 직접 선언한다
 * (계약 패키지는 백엔드에 의존하지 않는다).
 */
export interface StatisticsResponse {
  totalDraws: number;
  latestRound: number;
  /** index 0 = 번호 1 */
  frequency: number[];
  sumDistribution: { sum: number; count: number }[];
  /** index = 홀수 개수 0~6 */
  oddCountDist: number[];
  /** index = 저구간(1~22) 개수 0~6 */
  lowCountDist: number[];
  /** 구간(1-10·11-20·21-30·31-40·41-45)별 총 출현 */
  zoneCounts: number[];
  hotCold: { number: number; count: number; gap: number }[];
  topPairs: { a: number; b: number; count: number }[];
  /** 잔디밭 시각화용 최근 회차 (오름차순) */
  recentGrid: { round: number; numbers: number[] }[];
  /** 6/45 전체 조합 수 = 8,145,060 (고정 — 정직성 장치) */
  totalCombinations: number;
}
```

`packages/contract/src/statistics/index.ts`:

```ts
export * from "./statistics.dto";
```

- [ ] **Step 3: 구 DTO 폴더를 지우고 패키지 의존을 연결한다**

```bash
cd "$(git rev-parse --show-toplevel)"
rm -rf packages/core/src/generator/dto packages/core/src/lotterietus/dto \
       packages/core/src/picks/dto packages/core/src/results/dto \
       packages/core/src/simulation/dto packages/core/src/statistics/dto
```

`packages/core/package.json` — `exports`에서 `"./*/dto"` 줄을 지우고 `dependencies`에 계약 패키지를 추가한다:

```json
  "exports": {
    "./shared": "./src/shared/index.ts",
    "./*/domain": "./src/*/domain/index.ts",
    "./*/application": "./src/*/application/index.ts",
    "./*/infrastructure": "./src/*/infrastructure/index.ts"
  },
```

```json
  "dependencies": {
    "@fortuna-lottery/contract": "workspace:*",
    "@prisma/client": "6.19.3"
  }
```

`apps/web/package.json` — `dependencies`에 추가:

```json
  "dependencies": {
    "@fortuna-lottery/contract": "workspace:*",
    "@fortuna-lottery/core": "workspace:*",
    "next": "^15.3.4",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
```

`apps/web/next.config.ts` — 계약 패키지도 TS 소스 그대로 참조하므로 transpile 대상에 넣는다:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // packages/core·contract는 순수 TS 소스 그대로 참조한다 (빌드 스텝 없음)
  transpilePackages: ["@fortuna-lottery/core", "@fortuna-lottery/contract"],
  // Prisma는 네이티브 엔진을 쓰므로 서버 번들에 넣지 않고 런타임에 그대로 require 한다
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
```

```bash
pnpm install
```

- [ ] **Step 4: import 경로를 일괄 교체한다**

`@fortuna-lottery/core/<domain>/dto` → `@fortuna-lottery/contract/<domain>` 로 바꾼다.

```bash
cd "$(git rev-parse --show-toplevel)"
grep -rl "@fortuna-lottery/core/[a-z]*/dto" packages/core/src apps/web/src \
  | xargs perl -i -pe 's{\@fortuna-lottery/core/([a-z]+)/dto}{\@fortuna-lottery/contract/$1}g'
```

`packages/core` 안에서 상대 경로로 DTO를 import하던 파일 6곳도 바꾼다:

| 파일 | 이전 | 이후 |
|---|---|---|
| `src/generator/application/usecases/generate-combination.ts` | `../../dto/generator.dto` | `@fortuna-lottery/contract/generator` |
| `src/lotterietus/application/usecases/get-lotterietus-status.ts` | `../../dto/lotterietus.dto` | `@fortuna-lottery/contract/lotterietus` |
| `src/picks/application/usecases/list-picks.ts` | `../../dto/pick.dto` | `@fortuna-lottery/contract/picks` |
| `src/picks/application/usecases/save-pick.ts` | `../../dto/pick.dto` | `@fortuna-lottery/contract/picks` |
| `src/results/application/usecases/check-results.ts` | `../../dto/results.dto` | `@fortuna-lottery/contract/results` |
| `src/statistics/application/usecases/get-statistics.ts` | `../../dto/statistics.dto` | `@fortuna-lottery/contract/statistics` |

```bash
grep -rl '\.\./\.\./dto/' packages/core/src | xargs perl -i -pe '
  s{"\.\./\.\./dto/generator\.dto"}{"\@fortuna-lottery/contract/generator"};
  s{"\.\./\.\./dto/lotterietus\.dto"}{"\@fortuna-lottery/contract/lotterietus"};
  s{"\.\./\.\./dto/pick\.dto"}{"\@fortuna-lottery/contract/picks"};
  s{"\.\./\.\./dto/results\.dto"}{"\@fortuna-lottery/contract/results"};
  s{"\.\./\.\./dto/statistics\.dto"}{"\@fortuna-lottery/contract/statistics"};
'
```

`packages/core/src/statistics/application/index.ts` 는 그대로 두고(ReadModel은 아직 core 소유), 잔여 참조가 없는지 확인한다:

```bash
grep -rn "core/[a-z]*/dto\|\.\./\.\./dto/" packages/core/src apps/web/src ; echo "exit=$?"
```

Expected: 출력 없음 (`exit=1`).

- [ ] **Step 5: 전체 검증**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: 전부 통과. `packages/core` 44개 + `apps/web` 10개 테스트 통과.

- [ ] **Step 6: 커밋**

```bash
git add packages/contract packages/core apps/web pnpm-lock.yaml
git commit -m "refactor(contract): DTO를 packages/contract로 분리 — FE·BE 공유 지점 단일화"
```

---

## Task 2: 테스트 인프라(jsdom + RTL)와 `ActionState<T>`

**Files:**
- Modify: `apps/web/package.json`, `apps/web/vitest.config.ts`
- Create: `apps/web/src/shared/lib/actionState.ts`

- [ ] **Step 1: devDependency 추가**

```bash
pnpm --filter web add -D jsdom@^27.0.0 @testing-library/react@^16.3.0 @testing-library/dom@^10.4.0
```

- [ ] **Step 2: vitest 환경을 jsdom으로 바꾼다**

`apps/web/vitest.config.ts` 전체:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    // Action 훅·Presenter 훅 테스트가 renderHook을 쓰므로 DOM 환경이 필요하다
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: 기존 테스트가 jsdom에서도 통과하는지 확인**

```bash
pnpm --filter web test
```

Expected: PASS — 3개 파일 10개 테스트 (환경만 바뀌었고 대상은 순수 함수라 결과 동일).

- [ ] **Step 4: `ActionState<T>` 공통 타입을 만든다**

`apps/web/src/shared/lib/actionState.ts`:

```ts
/**
 * Action 훅이 소유하는 서버 상태 — 모든 모듈이 같은 형태를 쓴다.
 * 판별 유니온이므로 `status`로 좁히면 `data`·`error` 접근이 타입 안전하다.
 */
export type ActionState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };
```

- [ ] **Step 5: 커밋**

```bash
git add apps/web/package.json apps/web/vitest.config.ts apps/web/src/shared/lib/actionState.ts pnpm-lock.yaml
git commit -m "test(web): jsdom+RTL 훅 테스트 인프라 도입 및 ActionState<T> 공통 타입 추가"
```

---

## Task 3: ESLint 경계 규칙 (스펙 §9)

**왜 지금인가:** 규칙의 `files` 글롭이 **새 폴더 이름**(`view/`·`model/`·`action/`)만 겨냥하므로, 아직 남아 있는 `api/`·`transport/`·`viewmodel/` 폴더는 매치되지 않는다. 즉 지금 넣어도 기존 코드를 깨지 않고, 모듈을 전환하는 즉시 그 모듈이 규칙의 보호를 받는다.

**Files:**
- Modify: `apps/web/eslint.config.mjs`

- [ ] **Step 1: 경계 규칙을 다시 쓴다**

`apps/web/eslint.config.mjs` 전체:

```js
// 아키텍처 경계 규칙 (클라이언트 v3 보정 설계 §9) — 위반 = 빌드 실패
import tseslint from "typescript-eslint";

/** FE가 백엔드 내부(도메인/유스케이스/인프라)에 접근하는 것을 금지 */
const backendInternalPatterns = [
  {
    group: [
      "@fortuna-lottery/core/*/application",
      "@fortuna-lottery/core/*/domain",
      "@fortuna-lottery/core/*/infrastructure",
      "@fortuna-lottery/core/shared",
    ],
    message:
      "FE는 백엔드 내부에 접근할 수 없습니다. 계약(@fortuna-lottery/contract)과 API route만 사용하세요.",
  },
  {
    group: ["@/server/*", "@/server"],
    message: "FE 모듈은 서버 컴포지션 루트에 접근할 수 없습니다. action(HTTP)을 통하세요.",
  },
];

/** 모듈 간 deep import 금지 — 공개 index.ts로만 소통 */
const deepImportPattern = {
  group: ["@/modules/*/*"],
  message: "모듈 간에는 공개 API(@/modules/<name>)로만 import하세요 (deep import 금지).",
};

/** DTO(계약) — mapper만 자유롭게, action은 타입만, 그 외는 금지 (§9-4) */
const contractPattern = {
  group: ["@fortuna-lottery/contract", "@fortuna-lottery/contract/*"],
  message:
    "DTO는 mapper/**에서만 import합니다 (action/**은 fetcher 제네릭용 타입 import만 허용).",
};

/** view는 mapper를 직접 보지 않는다 — action을 통해서만 (§9-2) */
const mapperPattern = {
  group: [
    "../mapper",
    "../mapper/*",
    "../../mapper",
    "../../mapper/*",
    "**/mapper",
    "**/mapper/*",
  ],
  message: "view는 mapper를 직접 import할 수 없습니다. action/**을 통해서만 접근하세요.",
};

const base = [...backendInternalPatterns, deepImportPattern];

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  {
    files: ["src/modules/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": ["error", { patterns: base }],
    },
  },
  {
    // 라우트/페이지는 모듈 조립만 — 백엔드 직접 접근 금지 (api/는 예외: 인프라 계층)
    files: ["src/app/**/*.{ts,tsx}"],
    ignores: ["src/app/api/**"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": ["error", { patterns: base }],
    },
  },
  {
    // view·model은 mapper도 DTO도 보지 않는다
    files: ["src/modules/*/view/**/*.{ts,tsx}", "src/modules/*/model/**/*.ts"],
    languageOptions: { parser: tseslint.parser },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": [
        "error",
        { patterns: [...base, contractPattern, mapperPattern] },
      ],
    },
  },
  {
    // action은 DTO를 fetcher 제네릭에 넘기므로 타입 import만 허용
    files: ["src/modules/*/action/**/*.ts"],
    languageOptions: { parser: tseslint.parser },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": [
        "error",
        { patterns: [...base, { ...contractPattern, allowTypeImports: true }] },
      ],
    },
  },
);
```

- [ ] **Step 2: 기존 코드가 여전히 통과하는지 확인**

```bash
pnpm --filter web lint
```

Expected: 통과(출력 없음). 아직 `action/`·`mapper/` 폴더가 없고, 남아 있는 `view/` 파일들은 mapper·DTO를 import하지 않는다.

- [ ] **Step 3: 규칙이 실제로 물리는지 확인 (일부러 위반)**

```bash
cat > apps/web/src/modules/identity/view/__boundary-probe.ts <<'EOF'
import type { PickResponse } from "@fortuna-lottery/contract/picks";
export type Probe = PickResponse;
EOF
pnpm --filter web lint; echo "exit=$?"
```

Expected: `exit=1`, 메시지 "DTO는 mapper/**에서만 import합니다".

```bash
rm apps/web/src/modules/identity/view/__boundary-probe.ts
pnpm --filter web lint
```

Expected: 다시 통과.

- [ ] **Step 4: 커밋**

```bash
git add apps/web/eslint.config.mjs
git commit -m "chore(web): view→mapper·DTO 차단 등 v3 보정 경계 규칙 ESLint 반영"
```

---

## Task 4: `identity` 모듈 전환 (가장 단순 — 구조 확립용)

서버 호출이 없으므로 `action/`·`mapper/`가 없다. 이 태스크의 목적은 **폴더·배럴·Presenter 골격을 확정**하는 것이다.

**Files:**
- Create: `apps/web/src/modules/identity/model/identity.model.ts`, `identity.viewmodel.ts`, `index.ts`
- Create: `apps/web/src/modules/identity/view/identityBadge.tsx`, `identity.presenter.ts`, `index.ts`
- Modify: `apps/web/src/modules/identity/index.ts`
- Delete: `apps/web/src/modules/identity/viewmodel/use-identity.viewmodel.ts`, `apps/web/src/modules/identity/view/identity-badge.tsx`

---

- [ ] **Step 1: Model과 ViewModel(class)을 만든다**

`apps/web/src/modules/identity/model/identity.model.ts`:

```ts
/** FE 모델 원형 — 현재 사용자 신원 (MVP: 게스트 고정) */
export interface IdentityModel {
  isGuest: boolean;
}
```

`apps/web/src/modules/identity/model/identity.viewmodel.ts` — 같은 폴더이므로 형제 파일 직접 import:

```ts
import type { IdentityModel } from "./identity.model";

/** 신원 ViewModel — 표시 라벨은 저장 필드가 아니라 getter로 파생한다 */
export class IdentityViewModel implements IdentityModel {
  /** MVP: 게스트 고정 — 후속 Supabase Auth 연동 시 서버에서 채운다 */
  isGuest = true;

  static from(model: IdentityModel): IdentityViewModel {
    return Object.assign(new IdentityViewModel(), model);
  }

  get label(): string {
    return this.isGuest ? "게스트 모드" : "로그인됨";
  }
}
```

`apps/web/src/modules/identity/model/index.ts`:

```ts
export * from "./identity.model";
export * from "./identity.viewmodel";
```

- [ ] **Step 2: Presenter를 만든다**

`apps/web/src/modules/identity/view/identity.presenter.ts` — 대표 View 자신의 슬롯이므로 번들 타입을 여기 선언한다:

```ts
"use client";
import { IdentityViewModel } from "../model";

export interface IdentityBadgeBundle {
  label: string;
}

/**
 * 정책 2(대표 View는 예외 없이 자기 Presenter를 갖는다)에 따라 만든다.
 * 서버 호출도 상태도 없어 거의 비어 있지만, 예외를 두면 "이 모듈은 왜 다른가"를 매번 판단해야 한다.
 */
export function useIdentityPresenter(): { badge: IdentityBadgeBundle } {
  const vm = new IdentityViewModel();
  return { badge: { label: vm.label } };
}
```

- [ ] **Step 3: View를 만든다 (로직 0)**

`apps/web/src/modules/identity/view/identityBadge.tsx`:

```tsx
"use client";
import { useIdentityPresenter } from "./identity.presenter";

export function IdentityBadge() {
  const p = useIdentityPresenter();
  return (
    <span className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-500">
      {p.badge.label}
    </span>
  );
}
```

`apps/web/src/modules/identity/view/index.ts` — Presenter는 배럴에 넣지 않는다(§2.1-6):

```ts
export * from "./identityBadge";
```

- [ ] **Step 4: 모듈 공개 배럴을 하위 배럴 경로로 바꾸고 구 파일을 지운다**

`apps/web/src/modules/identity/index.ts`:

```ts
export { IdentityBadge } from "./view";
export type { IdentityModel } from "./model";
```

```bash
cd "$(git rev-parse --show-toplevel)"
rm -rf apps/web/src/modules/identity/viewmodel
rm apps/web/src/modules/identity/view/identity-badge.tsx
```

- [ ] **Step 5: 검증**

```bash
pnpm --filter web test && pnpm --filter web lint && pnpm --filter web build
```

Expected: 전부 통과.

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/modules/identity
git commit -m "refactor(identity): model/view 2폴더 + class ViewModel + Presenter 구조로 전환"
```

---

## Task 5: `results` 모듈 전환 (class ViewModel 패턴 첫 실검증)

**Files:**
- Create: `apps/web/src/modules/results/model/results.viewmodel.ts`, `results.viewmodel.test.ts`, `index.ts`
- Create: `apps/web/src/modules/results/mapper/results.mapper.ts`, `index.ts`
- Create: `apps/web/src/modules/results/action/checkResults.action.ts`, `index.ts`
- Create: `apps/web/src/modules/results/view/resultsCard.tsx`, `results.presenter.ts`, `index.ts`
- Modify: `apps/web/src/modules/results/index.ts`
- Delete: `results/api/`, `results/transport/`, `results/viewmodel/`, `results/view/results-card.tsx`

---

- [ ] **Step 1: 실패하는 ViewModel 테스트를 먼저 쓴다**

`apps/web/src/modules/results/model/results.viewmodel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ResultItemModel } from "./results.model";
import { ResultItemViewModel, ResultsViewModel } from "./results.viewmodel";

const item = (over: Partial<ResultItemModel> = {}): ResultItemModel => ({
  pickId: "p1",
  numbers: [1, 2, 3, 4, 5, 6],
  matchedNumbers: [],
  matchedCount: 0,
  bonusMatched: false,
  rank: 0,
  ...over,
});

describe("ResultItemViewModel.rankLabel (구 resultLabel)", () => {
  it("당첨이면 등수만 말한다", () => {
    expect(ResultItemViewModel.from(item({ rank: 3, matchedCount: 5 })).rankLabel).toBe("3등");
  });

  it("낙첨이면 일치 개수를 사실대로 말한다", () => {
    expect(ResultItemViewModel.from(item({ matchedCount: 2 })).rankLabel).toBe("2개 일치 — 낙첨");
  });

  it("보너스 일치도 사실대로 덧붙인다", () => {
    expect(
      ResultItemViewModel.from(item({ matchedCount: 2, bonusMatched: true })).rankLabel,
    ).toBe("2개 일치 + 보너스 — 낙첨");
  });

  it("보너스만 일치 / 일치 없음", () => {
    expect(ResultItemViewModel.from(item({ bonusMatched: true })).rankLabel).toBe(
      "보너스만 일치 — 낙첨",
    );
    expect(ResultItemViewModel.from(item()).rankLabel).toBe("일치 없음 — 낙첨");
  });

  it("isMatched — 일치 번호 판별", () => {
    const vm = ResultItemViewModel.from(item({ matchedNumbers: [3, 5] }));
    expect(vm.isMatched(3)).toBe(true);
    expect(vm.isMatched(4)).toBe(false);
  });
});

describe("ResultsViewModel", () => {
  it("items를 ResultItemViewModel로 승격한다", () => {
    const vm = ResultsViewModel.from({ draw: null, items: [item()] });
    expect(vm.items[0]).toBeInstanceOf(ResultItemViewModel);
  });

  it("subtitle — 대조한 회차가 있으면 회차를 말한다", () => {
    const vm = ResultsViewModel.from({
      draw: { round: 1182, numbers: [1, 2, 3, 4, 5, 6], bonus: 7 },
      items: [],
    });
    expect(vm.subtitle).toBe("제1182회 당첨 번호와 대조");
    expect(vm.isEmpty).toBe(true);
  });

  it("subtitle — 대조 전 기본 문구", () => {
    expect(ResultsViewModel.from({ draw: null, items: [] }).subtitle).toBe(
      "저장한 번호를 최신 회차와 대조합니다",
    );
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm --filter web exec vitest run src/modules/results/model/results.viewmodel.test.ts
```

Expected: FAIL — `Failed to resolve import "./results.viewmodel"`.

- [ ] **Step 3: ViewModel class를 만든다**

`apps/web/src/modules/results/model/results.viewmodel.ts`:

```ts
import type { ResultItemModel, ResultsModel } from "./results.model";

/** 픽 1건의 대조 결과 — 등수 표기는 사실 그대로, 과장 없음 (정직성 원칙) */
export class ResultItemViewModel implements ResultItemModel {
  pickId = "";
  numbers: number[] = [];
  matchedNumbers: number[] = [];
  matchedCount = 0;
  bonusMatched = false;
  rank = 0;

  static from(model: ResultItemModel): ResultItemViewModel {
    return Object.assign(new ResultItemViewModel(), model);
  }

  static fromAll(models: ResultItemModel[]): ResultItemViewModel[] {
    return models.map(ResultItemViewModel.from);
  }

  get rankLabel(): string {
    if (this.rank >= 1) return `${this.rank}등`;
    if (this.matchedCount > 0) {
      return `${this.matchedCount}개 일치${this.bonusMatched ? " + 보너스" : ""} — 낙첨`;
    }
    return this.bonusMatched ? "보너스만 일치 — 낙첨" : "일치 없음 — 낙첨";
  }

  /** 당첨(1~5등) 여부 — 강조 색을 쓸지 판단하는 데이터 */
  get isWinner(): boolean {
    return this.rank >= 1;
  }

  isMatched(n: number): boolean {
    return this.matchedNumbers.includes(n);
  }
}

export class ResultsViewModel implements ResultsModel {
  draw: ResultsModel["draw"] = null;
  items: ResultItemViewModel[] = [];

  static from(model: ResultsModel): ResultsViewModel {
    const vm = new ResultsViewModel();
    vm.draw = model.draw;
    vm.items = ResultItemViewModel.fromAll(model.items);
    return vm;
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  get subtitle(): string {
    return this.draw
      ? `제${this.draw.round}회 당첨 번호와 대조`
      : "저장한 번호를 최신 회차와 대조합니다";
  }
}
```

`apps/web/src/modules/results/model/index.ts`:

```ts
export * from "./results.model";
export * from "./results.viewmodel";
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
pnpm --filter web exec vitest run src/modules/results/model/results.viewmodel.test.ts
```

Expected: PASS — 7 tests.

- [ ] **Step 5: mapper를 만든다 (`transport/assembler` 대체)**

`apps/web/src/modules/results/mapper/results.mapper.ts` — 어간은 짝 Action(`useCheckResultsAction`)에서 `use`·`Action`을 뗀 `checkResults`:

```ts
import type { ResultsResponse } from "@fortuna-lottery/contract/results";
import type { ResultsModel } from "../model";

/** 응답 DTO → Model (와이어 이음새). ViewModel 승격은 Action이 한다 */
export function checkResultsResponse(dto: ResultsResponse): ResultsModel {
  return {
    draw: dto.draw
      ? { round: dto.draw.round, numbers: [...dto.draw.numbers], bonus: dto.draw.bonus }
      : null,
    items: dto.items.map((item) => ({
      pickId: item.pickId,
      numbers: [...item.numbers],
      matchedNumbers: [...item.matchedNumbers],
      matchedCount: item.matchedCount,
      bonusMatched: item.bonusMatched,
      rank: item.rank,
    })),
  };
}
```

`apps/web/src/modules/results/mapper/index.ts`:

```ts
export * from "./results.mapper";
```

- [ ] **Step 6: Action을 만든다**

`apps/web/src/modules/results/action/checkResults.action.ts`:

```ts
"use client";
import { useState } from "react";
import type { ResultsResponse } from "@fortuna-lottery/contract/results";
import type { ActionState } from "@/shared/lib/actionState";
import { apiGet } from "@/shared/lib/fetcher";
import { checkResultsResponse } from "../mapper";
import { ResultsViewModel } from "../model";

export function useCheckResultsAction() {
  const [state, setState] = useState<ActionState<ResultsViewModel>>({ status: "idle" });

  /** 성공 시 갱신된 VM을 반환한다 — 호출부가 setState 반영을 기다리지 않도록 */
  const check = async (): Promise<ResultsViewModel | null> => {
    setState({ status: "loading" });
    try {
      const dto = await apiGet<ResultsResponse>("/api/results");
      const next = ResultsViewModel.from(checkResultsResponse(dto));
      setState({ status: "success", data: next });
      return next;
    } catch (e) {
      setState({
        status: "error",
        error: e instanceof Error ? e.message : "결과 확인에 실패했습니다",
      });
      return null;
    }
  };

  return { ...state, check };
}
```

`apps/web/src/modules/results/action/index.ts`:

```ts
export * from "./checkResults.action";
```

- [ ] **Step 7: Presenter를 만든다 (번들 `{ form, summary, rows }`)**

`apps/web/src/modules/results/view/results.presenter.ts`:

```ts
"use client";
import { useCheckResultsAction } from "../action";

export interface ResultsFormBundle {
  busy: boolean;
  error: string | null;
  onCheck: () => void;
}

export interface ResultsSummaryBundle {
  subtitle: string;
  draw: { numbers: number[]; bonus: number } | null;
  /** 아직 대조 전이면 null, 대조했는데 저장된 픽이 없으면 true */
  empty: boolean | null;
}

export interface ResultsRowBundle {
  pickId: string;
  numbers: number[];
  rankLabel: string;
  highlighted: boolean;
  matched: boolean[];
}

export function useResultsPresenter(): {
  form: ResultsFormBundle;
  summary: ResultsSummaryBundle;
  rows: ResultsRowBundle[];
} {
  const action = useCheckResultsAction();
  // 인터랙티브 상태가 없는 모듈 — Action의 data가 유일한 VM이다 (VM 소유권 규칙)
  const vm = action.status === "success" ? action.data : null;

  return {
    form: {
      busy: action.status === "loading",
      error: action.status === "error" ? action.error : null,
      onCheck: () => {
        void action.check();
      },
    },
    summary: {
      subtitle: vm ? vm.subtitle : "저장한 번호를 최신 회차와 대조합니다",
      draw: vm?.draw ? { numbers: vm.draw.numbers, bonus: vm.draw.bonus } : null,
      empty: vm ? vm.isEmpty : null,
    },
    rows: (vm?.items ?? []).map((item) => ({
      pickId: item.pickId,
      numbers: item.numbers,
      rankLabel: item.rankLabel,
      highlighted: item.isWinner,
      matched: item.numbers.map((n) => item.isMatched(n)),
    })),
  };
}
```

- [ ] **Step 8: View를 만든다 (레이아웃과 번들 spread만)**

`apps/web/src/modules/results/view/resultsCard.tsx`:

```tsx
"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import { useResultsPresenter } from "./results.presenter";

export function ResultsCard() {
  const p = useResultsPresenter();

  return (
    <Card title="결과 확인" subtitle={p.summary.subtitle}>
      <button
        type="button"
        onClick={p.form.onCheck}
        disabled={p.form.busy}
        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-600 disabled:opacity-40"
      >
        {p.form.busy ? "대조 중…" : "당첨 대조"}
      </button>

      {p.form.error ? <p className="mt-3 text-sm text-red-600">{p.form.error}</p> : null}

      {p.summary.empty === true ? (
        <p className="mt-4 text-sm text-slate-500">저장한 번호가 없습니다.</p>
      ) : null}

      {p.summary.empty === false ? (
        <div className="mt-4 space-y-4">
          {p.summary.draw ? (
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
              <span className="mr-1 text-xs text-slate-500">당첨</span>
              {p.summary.draw.numbers.map((n) => (
                <Ball key={n} n={n} size="sm" />
              ))}
              <span className="text-slate-500">+</span>
              <Ball n={p.summary.draw.bonus} size="sm" />
            </div>
          ) : null}
          <ul className="space-y-2.5">
            {p.rows.map((row) => (
              <li key={row.pickId} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  {row.numbers.map((n, i) => (
                    <Ball key={n} n={n} size="sm" ring={row.matched[i]} dimmed={!row.matched[i]} />
                  ))}
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold ${
                    row.highlighted ? "text-amber-600" : "text-slate-500"
                  }`}
                >
                  {row.rankLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
```

`apps/web/src/modules/results/view/index.ts`:

```ts
export * from "./resultsCard";
```

- [ ] **Step 9: 공개 배럴 갱신 + 구 폴더 삭제**

`apps/web/src/modules/results/index.ts`:

```ts
export { ResultsCard } from "./view";
export type { ResultItemModel, ResultsModel } from "./model";
```

```bash
cd "$(git rev-parse --show-toplevel)"
rm -rf apps/web/src/modules/results/api apps/web/src/modules/results/transport \
       apps/web/src/modules/results/viewmodel
rm apps/web/src/modules/results/view/results-card.tsx
```

- [ ] **Step 10: 검증**

```bash
pnpm --filter web test && pnpm --filter web lint && pnpm --filter web build
```

Expected: 전부 통과.

- [ ] **Step 11: 커밋**

```bash
git add apps/web/src/modules/results
git commit -m "refactor(results): action/model/mapper/view 구조 + class ViewModel(rankLabel) 전환"
```

---

## Task 6: `simulation` 모듈 전환

**Files:**
- Create: `simulation/model/simulation.viewmodel.ts`, `simulation.viewmodel.test.ts`, `index.ts`
- Create: `simulation/mapper/simulation.mapper.ts`, `index.ts`
- Create: `simulation/action/backtest.action.ts`, `index.ts`
- Create: `simulation/view/simulationCard.tsx`, `simulation.presenter.ts`, `index.ts`
- Modify: `simulation/index.ts`
- Delete: `simulation/api/`, `simulation/transport/`, `simulation/viewmodel/`, `simulation/view/simulation-card.tsx`

---

- [ ] **Step 1: 실패하는 ViewModel 테스트를 먼저 쓴다**

`apps/web/src/modules/simulation/model/simulation.viewmodel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { BacktestModel } from "./simulation.model";
import { BacktestViewModel } from "./simulation.viewmodel";

const model = (over: Partial<BacktestModel> = {}): BacktestModel => ({
  totalDraws: 1182,
  rankCounts: [1180, 0, 0, 0, 1, 1],
  wins: [
    { round: 10, rank: 5, matchedCount: 3 },
    { round: 20, rank: 4, matchedCount: 4 },
  ],
  ...over,
});

describe("BacktestViewModel", () => {
  it("rankSummary — 당첨이 있는 등수만 라벨과 함께 준다", () => {
    expect(BacktestViewModel.from(model()).rankSummary).toEqual([
      { rank: 4, label: "4등", count: 1 },
      { rank: 5, label: "5등", count: 1 },
    ]);
  });

  it("rankSummary — 당첨이 하나도 없으면 빈 배열", () => {
    const vm = BacktestViewModel.from(model({ rankCounts: [1182, 0, 0, 0, 0, 0], wins: [] }));
    expect(vm.rankSummary).toEqual([]);
  });

  it("summaryLine — 당첨이 있으면 횟수를 사실대로 말한다", () => {
    expect(BacktestViewModel.from(model()).summaryLine).toBe(
      "전 1,182회차 중 2번 당첨되었을 조합입니다 (5등 이상).",
    );
  });

  it("summaryLine — 당첨이 없으면 없다고 말한다", () => {
    expect(BacktestViewModel.from(model({ wins: [] })).summaryLine).toBe(
      "전 1,182회차에서 5등 이상 당첨이 없었습니다.",
    );
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm --filter web exec vitest run src/modules/simulation/model/simulation.viewmodel.test.ts
```

Expected: FAIL — `Failed to resolve import "./simulation.viewmodel"`.

- [ ] **Step 3: ViewModel class를 만든다**

`apps/web/src/modules/simulation/model/simulation.viewmodel.ts`:

```ts
import type { BacktestModel } from "./simulation.model";

/** 백테스트 결과 ViewModel — 등수 라벨·요약 문구를 파생값으로 소유한다 */
export class BacktestViewModel implements BacktestModel {
  totalDraws = 0;
  rankCounts: number[] = [];
  wins: BacktestModel["wins"] = [];

  private static readonly RANK_LABELS = ["낙첨", "1등", "2등", "3등", "4등", "5등"] as const;

  static from(model: BacktestModel): BacktestViewModel {
    return Object.assign(new BacktestViewModel(), model);
  }

  /** 당첨이 있는 등수만 (사실 기반 — 없는 등수를 0으로 나열하지 않는다) */
  get rankSummary(): { rank: number; label: string; count: number }[] {
    return [1, 2, 3, 4, 5]
      .map((rank) => ({
        rank,
        label: BacktestViewModel.RANK_LABELS[rank] as string,
        count: this.rankCounts[rank] ?? 0,
      }))
      .filter((row) => row.count > 0);
  }

  /** 정직한 한 줄 요약 — 과거 사실만 말하고 미래를 암시하지 않는다 */
  get summaryLine(): string {
    const totalWins = this.wins.length;
    if (totalWins === 0) {
      return `전 ${this.totalDraws.toLocaleString()}회차에서 5등 이상 당첨이 없었습니다.`;
    }
    return `전 ${this.totalDraws.toLocaleString()}회차 중 ${totalWins.toLocaleString()}번 당첨되었을 조합입니다 (5등 이상).`;
  }
}
```

`apps/web/src/modules/simulation/model/index.ts`:

```ts
export * from "./simulation.model";
export * from "./simulation.viewmodel";
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
pnpm --filter web exec vitest run src/modules/simulation/model/simulation.viewmodel.test.ts
```

Expected: PASS — 4 tests.

- [ ] **Step 5: mapper를 만든다**

`apps/web/src/modules/simulation/mapper/simulation.mapper.ts`:

```ts
import type { SimulationRequest, SimulationResponse } from "@fortuna-lottery/contract/simulation";
import type { BacktestModel } from "../model";

/** 대입할 조합 → 요청 DTO */
export function backtestRequest(numbers: number[]): SimulationRequest {
  return { numbers: [...numbers] };
}

/** 응답 DTO → Model */
export function backtestResponse(dto: SimulationResponse): BacktestModel {
  return {
    totalDraws: dto.totalDraws,
    rankCounts: [...dto.rankCounts],
    wins: dto.wins.map((w) => ({ ...w })),
  };
}
```

`apps/web/src/modules/simulation/mapper/index.ts`:

```ts
export * from "./simulation.mapper";
```

- [ ] **Step 6: Action을 만든다**

`apps/web/src/modules/simulation/action/backtest.action.ts`:

```ts
"use client";
import { useState } from "react";
import type { SimulationResponse } from "@fortuna-lottery/contract/simulation";
import type { ActionState } from "@/shared/lib/actionState";
import { apiPost } from "@/shared/lib/fetcher";
import { backtestRequest, backtestResponse } from "../mapper";
import { BacktestViewModel } from "../model";

export function useBacktestAction() {
  const [state, setState] = useState<ActionState<BacktestViewModel>>({ status: "idle" });

  const run = async (numbers: number[]): Promise<BacktestViewModel | null> => {
    setState({ status: "loading" });
    try {
      const dto = await apiPost<SimulationResponse>("/api/simulation", backtestRequest(numbers));
      const next = BacktestViewModel.from(backtestResponse(dto));
      setState({ status: "success", data: next });
      return next;
    } catch (e) {
      setState({
        status: "error",
        error: e instanceof Error ? e.message : "시뮬레이션에 실패했습니다",
      });
      return null;
    }
  };

  return { ...state, run };
}
```

`apps/web/src/modules/simulation/action/index.ts`:

```ts
export * from "./backtest.action";
```

- [ ] **Step 7: Presenter를 만든다 (번들 `{ form, result }`)**

`apps/web/src/modules/simulation/view/simulation.presenter.ts`:

```ts
"use client";
import { useBacktestAction } from "../action";

export interface SimulationFormBundle {
  label: string;
  enabled: boolean;
  error: string | null;
  onRun: () => void;
}

export interface SimulationRankChip {
  rank: number;
  label: string;
  count: number;
  /** 1·2등은 다른 색으로 — 표시 강조일 뿐 확률과 무관 */
  emphasized: boolean;
}

export interface SimulationResultBundle {
  summaryLine: string;
  chips: SimulationRankChip[];
}

export function useSimulationPresenter(ctx: { numbers: number[] | null }): {
  form: SimulationFormBundle;
  result: SimulationResultBundle | null;
} {
  const action = useBacktestAction();
  const vm = action.status === "success" ? action.data : null;
  const busy = action.status === "loading";

  return {
    form: {
      label: busy ? "확인 중…" : ctx.numbers ? "과거 전 회차 대입" : "먼저 번호를 생성하세요",
      enabled: ctx.numbers !== null && !busy,
      error: action.status === "error" ? action.error : null,
      onRun: () => {
        if (!ctx.numbers) return;
        void action.run(ctx.numbers);
      },
    },
    result: vm
      ? {
          summaryLine: vm.summaryLine,
          chips: vm.rankSummary.map((row) => ({ ...row, emphasized: row.rank <= 2 })),
        }
      : null,
  };
}
```

- [ ] **Step 8: View를 만든다**

`apps/web/src/modules/simulation/view/simulationCard.tsx`:

```tsx
"use client";
import { Card } from "@/shared/ui/card";
import { useSimulationPresenter } from "./simulation.presenter";

export interface SimulationCardProps {
  numbers: number[] | null;
}

export function SimulationCard(props: SimulationCardProps) {
  const p = useSimulationPresenter(props);

  return (
    <Card
      title="타임머신 시뮬레이션"
      subtitle="이 번호를 과거 전 회차에 넣었다면?"
      footnote="과거 결과는 사실이지만, 다음 회차의 당첨 확률은 언제나 동일합니다 (미래 예측 아님)."
    >
      <button
        type="button"
        onClick={p.form.onRun}
        disabled={!p.form.enabled}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {p.form.label}
      </button>

      {p.form.error ? <p className="mt-3 text-sm text-red-600">{p.form.error}</p> : null}

      {p.result ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-700">{p.result.summaryLine}</p>
          {p.result.chips.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {p.result.chips.map((chip) => (
                <li
                  key={chip.rank}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    chip.emphasized
                      ? "border border-amber-200 bg-amber-50 text-amber-600"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {chip.label} × {chip.count.toLocaleString()}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
```

`apps/web/src/modules/simulation/view/index.ts`:

```ts
export * from "./simulationCard";
```

- [ ] **Step 9: 공개 배럴 갱신 + 구 폴더 삭제**

`apps/web/src/modules/simulation/index.ts`:

```ts
export { SimulationCard, type SimulationCardProps } from "./view";
export type { BacktestModel } from "./model";
```

```bash
cd "$(git rev-parse --show-toplevel)"
rm -rf apps/web/src/modules/simulation/api apps/web/src/modules/simulation/transport \
       apps/web/src/modules/simulation/viewmodel
rm apps/web/src/modules/simulation/view/simulation-card.tsx
```

- [ ] **Step 10: 검증**

```bash
pnpm --filter web test && pnpm --filter web lint && pnpm --filter web build
```

Expected: 전부 통과.

- [ ] **Step 11: 커밋**

```bash
git add apps/web/src/modules/simulation
git commit -m "refactor(simulation): action/model/mapper/view 구조 + BacktestViewModel 파생값 전환"
```

---

## Task 7: `lotterietus` 모듈 전환 (Presenter가 `now`를 소유하는 첫 사례)

**핵심 판단:** `formatRemaining`은 ViewModel로 가지 **않는다.** 남은 시간은 데이터가 아니라 "지금이 언제인가"에 의존하므로 Presenter 소유다(스펙 §3.2). `formatDrawDate`는 데이터에서 기계적으로 나오므로 `LotterietusViewModel.drawDateLabel` getter가 된다.

**Files:**
- Create: `lotterietus/model/lotterietus.viewmodel.ts`, `lotterietus.viewmodel.test.ts`, `index.ts`
- Create: `lotterietus/mapper/lotterietus.mapper.ts`, `index.ts`
- Create: `lotterietus/action/getLotterietusStatus.action.ts`, `getLotterietusStatus.action.test.ts`, `index.ts`
- Create: `lotterietus/view/lotterietusCard.tsx`, `lotterietus.presenter.ts`, `lotterietus.presenter.test.ts`, `index.ts`
- Modify: `lotterietus/index.ts`
- Delete: `lotterietus/api/`, `lotterietus/transport/`, `lotterietus/viewmodel/`, `lotterietus/view/lotterietus-card.tsx`

---

- [ ] **Step 1: 실패하는 ViewModel 테스트를 먼저 쓴다**

`apps/web/src/modules/lotterietus/model/lotterietus.viewmodel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LotterietusViewModel } from "./lotterietus.viewmodel";

describe("LotterietusViewModel.drawDateLabel (구 formatDrawDate)", () => {
  it("추첨일을 YYYY.MM.DD로 표기한다", () => {
    const vm = LotterietusViewModel.from({
      round: 1182,
      numbers: [1, 2, 3, 4, 5, 6],
      bonus: 7,
      drawnAt: new Date(2026, 7, 1, 20, 35),
      nextRound: 1183,
      nextDrawAt: new Date(2026, 7, 8, 20, 35),
    });
    expect(vm.drawDateLabel).toBe("2026.08.01");
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm --filter web exec vitest run src/modules/lotterietus/model/lotterietus.viewmodel.test.ts
```

Expected: FAIL — `Failed to resolve import "./lotterietus.viewmodel"`.

- [ ] **Step 3: ViewModel class를 만든다**

`apps/web/src/modules/lotterietus/model/lotterietus.viewmodel.ts`:

```ts
import type { LotterietusModel } from "./lotterietus.model";

/**
 * 로또 현황 ViewModel.
 * 남은 시간(`formatRemaining`)은 `now`에 의존하므로 여기 두지 않는다 — Presenter 소유다.
 */
export class LotterietusViewModel implements LotterietusModel {
  round = 0;
  numbers: number[] = [];
  bonus = 0;
  drawnAt = new Date(0);
  nextRound = 0;
  nextDrawAt = new Date(0);

  static from(model: LotterietusModel): LotterietusViewModel {
    return Object.assign(new LotterietusViewModel(), model);
  }

  get drawDateLabel(): string {
    const y = this.drawnAt.getFullYear();
    const mo = String(this.drawnAt.getMonth() + 1).padStart(2, "0");
    const d = String(this.drawnAt.getDate()).padStart(2, "0");
    return `${y}.${mo}.${d}`;
  }

  /** 다음 추첨 시각 (epoch ms) — Presenter가 `now`와 빼서 남은 시간을 만든다 */
  get nextDrawAtMs(): number {
    return this.nextDrawAt.getTime();
  }
}
```

`apps/web/src/modules/lotterietus/model/index.ts`:

```ts
export * from "./lotterietus.model";
export * from "./lotterietus.viewmodel";
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
pnpm --filter web exec vitest run src/modules/lotterietus/model/lotterietus.viewmodel.test.ts
```

Expected: PASS — 1 test.

- [ ] **Step 5: mapper를 만든다**

`apps/web/src/modules/lotterietus/mapper/lotterietus.mapper.ts`:

```ts
import type { LotterietusStatusResponse } from "@fortuna-lottery/contract/lotterietus";
import type { LotterietusModel } from "../model";

/** 응답 DTO → Model (와이어 이음새 — ISO 문자열을 Date로) */
export function getLotterietusStatusResponse(dto: LotterietusStatusResponse): LotterietusModel {
  return {
    round: dto.round,
    numbers: [...dto.numbers],
    bonus: dto.bonus,
    drawnAt: new Date(dto.drawnAt),
    nextRound: dto.nextRound,
    nextDrawAt: new Date(dto.nextDrawAt),
  };
}
```

`apps/web/src/modules/lotterietus/mapper/index.ts`:

```ts
export * from "./lotterietus.mapper";
```

- [ ] **Step 6: Action을 만든다 — 마운트 시 1회 호출되므로 `useCallback`으로 identity를 고정한다**

`apps/web/src/modules/lotterietus/action/getLotterietusStatus.action.ts`:

```ts
"use client";
import { useCallback, useState } from "react";
import type { LotterietusStatusResponse } from "@fortuna-lottery/contract/lotterietus";
import type { ActionState } from "@/shared/lib/actionState";
import { apiGet } from "@/shared/lib/fetcher";
import { getLotterietusStatusResponse } from "../mapper";
import { LotterietusViewModel } from "../model";

export function useGetLotterietusStatusAction() {
  const [state, setState] = useState<ActionState<LotterietusViewModel>>({ status: "idle" });

  /** Presenter의 useEffect 의존성에 넣을 수 있도록 identity를 고정한다 */
  const load = useCallback(async (): Promise<LotterietusViewModel | null> => {
    setState({ status: "loading" });
    try {
      const dto = await apiGet<LotterietusStatusResponse>("/api/lotterietus");
      const next = LotterietusViewModel.from(getLotterietusStatusResponse(dto));
      setState({ status: "success", data: next });
      return next;
    } catch (e) {
      setState({
        status: "error",
        error: e instanceof Error ? e.message : "회차 정보를 불러오지 못했습니다",
      });
      return null;
    }
  }, []);

  return { ...state, load };
}
```

`apps/web/src/modules/lotterietus/action/index.ts`:

```ts
export * from "./getLotterietusStatus.action";
```

- [ ] **Step 7: Action 훅 테스트를 쓴다 (상태 전이 + 반환값이 ViewModel 인스턴스인지)**

`apps/web/src/modules/lotterietus/action/getLotterietusStatus.action.test.ts`:

```ts
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LotterietusViewModel } from "../model";
import { useGetLotterietusStatusAction } from "./getLotterietusStatus.action";

const DTO = {
  round: 1182,
  numbers: [1, 2, 3, 4, 5, 6],
  bonus: 7,
  drawnAt: "2026-08-01T11:35:00.000Z",
  nextRound: 1183,
  nextDrawAt: "2026-08-08T11:35:00.000Z",
};

/** fetcher가 쓰는 최소 표면(ok·status·json)만 흉내낸다 */
const stubFetch = (body: unknown, ok: boolean, status: number) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, status, json: async () => body }) as unknown as Response),
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useGetLotterietusStatusAction", () => {
  it("idle → success 로 전이하고 ViewModel 인스턴스를 반환한다", async () => {
    stubFetch(DTO, true, 200);
    const { result } = renderHook(() => useGetLotterietusStatusAction());
    expect(result.current.status).toBe("idle");

    const returned: (LotterietusViewModel | null)[] = [];
    await act(async () => {
      returned.push(await result.current.load());
    });

    expect(returned[0]).toBeInstanceOf(LotterietusViewModel);
    await waitFor(() => expect(result.current.status).toBe("success"));
  });

  it("실패하면 error 로 전이하고 null을 반환한다", async () => {
    stubFetch({ error: "회차 조회 실패" }, false, 500);
    const { result } = renderHook(() => useGetLotterietusStatusAction());

    const returned: (LotterietusViewModel | null)[] = [];
    await act(async () => {
      returned.push(await result.current.load());
    });

    expect(returned[0]).toBeNull();
    await waitFor(() => expect(result.current.status).toBe("error"));
  });
});
```

```bash
pnpm --filter web exec vitest run src/modules/lotterietus/action/getLotterietusStatus.action.test.ts
```

Expected: PASS — 2 tests.

- [ ] **Step 8: Presenter를 만든다 (`now` 틱 소유 + `formatRemaining`)**

`apps/web/src/modules/lotterietus/view/lotterietus.presenter.ts`:

```ts
"use client";
import { useEffect, useState } from "react";
import { useGetLotterietusStatusAction } from "../action";

/**
 * 남은 시간(ms) → "D-3 12:34:56".
 * `now` 의존이므로 ViewModel이 아니라 Presenter 소유다 (스펙 §3.2).
 * 단위 테스트 대상이라 export하지만 `view/index.ts` 배럴에는 넣지 않는다 (§2.1-6).
 */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "추첨 시간!";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const h = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return days > 0 ? `D-${days} ${h}:${m}:${s}` : `${h}:${m}:${s}`;
}

export interface LotterietusDrawInfoBundle {
  round: number;
  numbers: number[];
  bonus: number;
  drawDateLabel: string;
}

export interface LotterietusCountdownBundle {
  nextRound: number;
  remaining: string;
}

export interface LotterietusCtaBundle {
  label: string;
  expanded: boolean;
  onClick: () => void;
}

export function useLotterietusPresenter(ctx: {
  generatorOpen: boolean;
  onToggleGenerator: () => void;
}): {
  drawInfo: LotterietusDrawInfoBundle | null;
  countdown: LotterietusCountdownBundle | null;
  cta: LotterietusCtaBundle;
  error: string | null;
  loading: boolean;
} {
  const action = useGetLotterietusStatusAction();
  const { load } = action;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    void load();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [load]);

  const vm = action.status === "success" ? action.data : null;

  return {
    drawInfo: vm
      ? {
          round: vm.round,
          numbers: vm.numbers,
          bonus: vm.bonus,
          drawDateLabel: vm.drawDateLabel,
        }
      : null,
    countdown: vm
      ? { nextRound: vm.nextRound, remaining: formatRemaining(vm.nextDrawAtMs - now) }
      : null,
    cta: {
      label: ctx.generatorOpen ? "생성기 닫기" : "번호 생성하기",
      expanded: ctx.generatorOpen,
      onClick: ctx.onToggleGenerator,
    },
    error: action.status === "error" ? action.error : null,
    loading: action.status === "idle" || action.status === "loading",
  };
}
```

- [ ] **Step 9: `format-remaining.test.ts`를 Presenter 테스트로 옮긴다**

`apps/web/src/modules/lotterietus/view/lotterietus.presenter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatRemaining } from "./lotterietus.presenter";

describe("formatRemaining (카운트다운 — now 의존이라 Presenter 소유)", () => {
  it("일 단위가 있으면 D-표기", () => {
    const ms = (3 * 86400 + 2 * 3600 + 4 * 60 + 5) * 1000;
    expect(formatRemaining(ms)).toBe("D-3 02:04:05");
  });

  it("하루 미만이면 시:분:초", () => {
    expect(formatRemaining(3661 * 1000)).toBe("01:01:01");
  });

  it("0 이하이면 추첨 시간", () => {
    expect(formatRemaining(0)).toBe("추첨 시간!");
    expect(formatRemaining(-100)).toBe("추첨 시간!");
  });
});
```

- [ ] **Step 10: View를 만든다**

`apps/web/src/modules/lotterietus/view/lotterietusCard.tsx`:

```tsx
"use client";
import { Ball } from "@/shared/ui/ball";
import { useLotterietusPresenter } from "./lotterietus.presenter";

export interface LotterietusCardProps {
  /** 생성기 패널이 펼쳐져 있는지 — CTA 라벨과 aria-expanded에 사용 */
  generatorOpen: boolean;
  onToggleGenerator: () => void;
}

/** 홈 최상단 Hero — 최근 회차와 다음 추첨 카운트다운을 동등한 비중으로 보여주고 생성기 CTA를 제공 */
export function LotterietusCard(props: LotterietusCardProps) {
  const p = useLotterietusPresenter(props);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {p.error ? <p className="text-sm text-red-600">{p.error}</p> : null}

      {p.drawInfo && p.countdown ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">
              최근 회차 · 제{p.drawInfo.round}회 · {p.drawInfo.drawDateLabel} 추첨
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {p.drawInfo.numbers.map((n) => (
                <Ball key={n} n={n} size="lg" />
              ))}
              <span className="mx-1 text-slate-400">+</span>
              <Ball n={p.drawInfo.bonus} size="md" />
            </div>
          </div>

          <div className="sm:border-l sm:border-slate-200 sm:pl-6">
            <p className="text-xs text-slate-500">
              다음 추첨까지 · 제{p.countdown.nextRound}회 · 매주 토요일 20:35
            </p>
            <p className="mt-3 text-4xl font-bold tabular-nums text-sky-600">
              {p.countdown.remaining}
            </p>
          </div>
        </div>
      ) : null}

      {p.loading ? <p className="text-sm text-slate-500">불러오는 중…</p> : null}

      <button
        type="button"
        onClick={p.cta.onClick}
        aria-expanded={p.cta.expanded}
        className="mt-6 w-full rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-500 sm:w-auto"
      >
        {p.cta.label}
      </button>
    </section>
  );
}
```

`apps/web/src/modules/lotterietus/view/index.ts`:

```ts
export * from "./lotterietusCard";
```

- [ ] **Step 11: 공개 배럴 갱신 + 구 폴더 삭제**

`apps/web/src/modules/lotterietus/index.ts`:

```ts
export { LotterietusCard, type LotterietusCardProps } from "./view";
export type { LotterietusModel } from "./model";
```

```bash
cd "$(git rev-parse --show-toplevel)"
rm -rf apps/web/src/modules/lotterietus/api apps/web/src/modules/lotterietus/transport \
       apps/web/src/modules/lotterietus/viewmodel
rm apps/web/src/modules/lotterietus/view/lotterietus-card.tsx
```

- [ ] **Step 12: 검증**

```bash
pnpm --filter web test && pnpm --filter web lint && pnpm --filter web build
```

Expected: 전부 통과. `format-remaining.test.ts`가 사라지고 `lotterietus.presenter.test.ts`가 같은 3개 테스트를 갖는다.

- [ ] **Step 13: 커밋**

```bash
git add apps/web/src/modules/lotterietus
git commit -m "refactor(lotterietus): action/model/mapper/view 전환 — now 의존 카운트다운은 Presenter 소유"
```

---

## Task 8: `generator` 모듈 전환 (Presenter가 VM의 단일 소유자인 첫 사례)

**VM 소유권:** `generator`는 사용자가 요청을 편집하는 인터랙티브 모듈이므로 **Presenter가 VM의 단일 소유자**이고, Action의 `data`는 읽지 않는다(`status`·`error`만 읽는다).

**보존해야 할 기존 동작 3가지:**
1. 모드를 바꾸면 선택이 초기화되고 **에러도 지워진다** → Action에 `reset()`을 두고 Presenter의 `changeMode`가 호출한다.
2. 선택 개수 상한: `manual` 6개, `semi` 5개.
3. `canGenerate`: `auto`는 항상 true, `semi`는 1~5개, `manual`은 정확히 6개.

**Files:**
- Create: `generator/model/generator.viewmodel.ts`, `generator.viewmodel.test.ts`, `index.ts`
- Create: `generator/mapper/generator.mapper.ts`, `index.ts`
- Create: `generator/action/generateCombination.action.ts`, `index.ts`
- Create: `generator/view/generatorCard.tsx`, `generator.presenter.ts`, `index.ts`
- Create: `generator/view/component/modeSelector.tsx`, `numberPad.tsx`, `generatedResult.tsx`, `index.ts`
- Modify: `generator/index.ts`
- Delete: `generator/api/`, `generator/transport/`, `generator/viewmodel/`, `generator/view/generator-card.tsx`

---

- [ ] **Step 1: 실패하는 ViewModel 테스트를 먼저 쓴다**

`apps/web/src/modules/generator/model/generator.viewmodel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GeneratorViewModel } from "./generator.viewmodel";

describe("GeneratorViewModel.canGenerate", () => {
  it("auto는 선택과 무관하게 항상 가능", () => {
    expect(new GeneratorViewModel().canGenerate).toBe(true);
  });

  it("semi는 1~5개일 때만 가능", () => {
    const semi = new GeneratorViewModel().withMode("semi");
    expect(semi.canGenerate).toBe(false);
    expect(semi.withToggled(1).canGenerate).toBe(true);
  });

  it("manual은 정확히 6개일 때만 가능", () => {
    let vm = new GeneratorViewModel().withMode("manual");
    for (const n of [1, 2, 3, 4, 5]) vm = vm.withToggled(n);
    expect(vm.canGenerate).toBe(false);
    expect(vm.withToggled(6).canGenerate).toBe(true);
  });
});

describe("GeneratorViewModel.withToggled (불변 갱신 + 상한)", () => {
  it("semi는 5개를 넘겨 선택할 수 없다", () => {
    let vm = new GeneratorViewModel().withMode("semi");
    for (const n of [1, 2, 3, 4, 5, 6]) vm = vm.withToggled(n);
    expect(vm.selected).toEqual([1, 2, 3, 4, 5]);
  });

  it("이미 선택된 번호는 해제된다", () => {
    const vm = new GeneratorViewModel().withMode("semi").withToggled(7).withToggled(7);
    expect(vm.selected).toEqual([]);
  });

  it("원본 인스턴스를 변경하지 않는다", () => {
    const base = new GeneratorViewModel().withMode("semi");
    base.withToggled(7);
    expect(base.selected).toEqual([]);
  });
});

describe("GeneratorViewModel.withMode / hint / withResult", () => {
  it("모드를 바꾸면 선택이 비워진다", () => {
    const vm = new GeneratorViewModel().withMode("semi").withToggled(7).withMode("manual");
    expect(vm.mode).toBe("manual");
    expect(vm.selected).toEqual([]);
  });

  it("hint는 모드와 선택 개수를 사실대로 말한다", () => {
    expect(new GeneratorViewModel().hint).toBe("6개 번호를 무작위로 생성합니다");
    expect(new GeneratorViewModel().withMode("semi").withToggled(7).hint).toBe(
      "포함할 번호를 1~5개 선택하세요 (1개 선택됨)",
    );
    expect(new GeneratorViewModel().withMode("manual").hint).toBe(
      "6개 번호를 직접 선택하세요 (0/6)",
    );
  });

  it("withResult는 모드·선택을 유지한 채 결과만 붙인다", () => {
    const vm = new GeneratorViewModel()
      .withMode("semi")
      .withToggled(7)
      .withResult({ numbers: [1, 2, 3, 4, 5, 6] });
    expect(vm.mode).toBe("semi");
    expect(vm.selected).toEqual([7]);
    expect(vm.result).toEqual({ numbers: [1, 2, 3, 4, 5, 6] });
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm --filter web exec vitest run src/modules/generator/model/generator.viewmodel.test.ts
```

Expected: FAIL — `Failed to resolve import "./generator.viewmodel"`.

- [ ] **Step 3: ViewModel class를 만든다**

`apps/web/src/modules/generator/model/generator.viewmodel.ts`:

```ts
import type {
  GeneratedCombinationModel,
  GeneratorMode,
  GeneratorRequestModel,
} from "./generator.model";

/** 생성기 ViewModel — 요청 유효성·안내 문구를 파생값으로 소유하고, 갱신은 불변으로 한다 */
export class GeneratorViewModel implements GeneratorRequestModel {
  mode: GeneratorMode = "auto";
  /** UI 상태 — 저장 필드 허용 (규칙 5) */
  selected: number[] = [];
  /** 서버 원본 — 저장 필드 허용 */
  result: GeneratedCombinationModel | null = null;

  /** 모드별 선택 상한 */
  private static readonly SELECT_LIMIT: Record<GeneratorMode, number> = {
    auto: 0,
    semi: 5,
    manual: 6,
  };

  static from(model: GeneratorRequestModel): GeneratorViewModel {
    return Object.assign(new GeneratorViewModel(), {
      mode: model.mode,
      selected: [...model.selected],
    });
  }

  get canGenerate(): boolean {
    if (this.mode === "auto") return true;
    if (this.mode === "semi") return this.selected.length >= 1 && this.selected.length <= 5;
    return this.selected.length === 6;
  }

  get hint(): string {
    if (this.mode === "auto") return "6개 번호를 무작위로 생성합니다";
    if (this.mode === "semi") {
      return `포함할 번호를 1~5개 선택하세요 (${this.selected.length}개 선택됨)`;
    }
    return `6개 번호를 직접 선택하세요 (${this.selected.length}/6)`;
  }

  get isPickingNumbers(): boolean {
    return this.mode !== "auto";
  }

  isSelected(n: number): boolean {
    return this.selected.includes(n);
  }

  /** 모드 전환 — 선택을 비운다 (기존 changeMode 동작 보존) */
  withMode(mode: GeneratorMode): GeneratorViewModel {
    const next = GeneratorViewModel.from({ mode, selected: [] });
    next.result = this.result;
    return next;
  }

  withToggled(n: number): GeneratorViewModel {
    const limit = GeneratorViewModel.SELECT_LIMIT[this.mode];
    let selected: number[];
    if (this.selected.includes(n)) {
      selected = this.selected.filter((x) => x !== n);
    } else if (this.selected.length < limit) {
      selected = [...this.selected, n];
    } else {
      return this;
    }
    const next = GeneratorViewModel.from({ mode: this.mode, selected });
    next.result = this.result;
    return next;
  }

  withResult(result: GeneratedCombinationModel): GeneratorViewModel {
    const next = GeneratorViewModel.from({ mode: this.mode, selected: this.selected });
    next.result = result;
    return next;
  }
}
```

`apps/web/src/modules/generator/model/generator.model.ts` — 요청 Model(`GeneratorRequestModel`)이 없으므로 파일 전체를 아래로 교체한다:

```ts
export type GeneratorMode = "auto" | "semi" | "manual";

/** FE 모델 원형 — 생성 요청 (모드 + 포함할 번호) */
export interface GeneratorRequestModel {
  mode: GeneratorMode;
  selected: number[];
}

/** FE 모델 원형 — 생성된 조합 */
export interface GeneratedCombinationModel {
  numbers: number[];
}
```

`apps/web/src/modules/generator/model/index.ts`:

```ts
export * from "./generator.model";
export * from "./generator.viewmodel";
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
pnpm --filter web exec vitest run src/modules/generator/model/generator.viewmodel.test.ts
```

Expected: PASS — 9 tests.

- [ ] **Step 5: mapper를 만든다 (파라미터는 Model — VM이 흘러와도 VM 멤버는 보이지 않는다)**

`apps/web/src/modules/generator/mapper/generator.mapper.ts`:

```ts
import type { GenerateRequest, GenerateResponse } from "@fortuna-lottery/contract/generator";
import type { GeneratedCombinationModel, GeneratorRequestModel } from "../model";

/** Model → 요청 DTO — 자동/부분/직접 모두 같은 계약으로 수렴한다 */
export function generateCombinationRequest(model: GeneratorRequestModel): GenerateRequest {
  if (model.mode === "auto") return {};
  return { fixedNumbers: [...model.selected] };
}

/** 응답 DTO → Model */
export function generateCombinationResponse(dto: GenerateResponse): GeneratedCombinationModel {
  return { numbers: [...dto.numbers] };
}
```

`apps/web/src/modules/generator/mapper/index.ts`:

```ts
export * from "./generator.mapper";
```

- [ ] **Step 6: Action을 만든다 (VM 입력 → VM 출력)**

`apps/web/src/modules/generator/action/generateCombination.action.ts`:

```ts
"use client";
import { useState } from "react";
import type { GenerateResponse } from "@fortuna-lottery/contract/generator";
import type { ActionState } from "@/shared/lib/actionState";
import { apiPost } from "@/shared/lib/fetcher";
import { generateCombinationRequest, generateCombinationResponse } from "../mapper";
import { GeneratorViewModel } from "../model";

export function useGenerateCombinationAction() {
  const [state, setState] = useState<ActionState<GeneratorViewModel>>({ status: "idle" });

  /** 성공 시 결과가 주입된 VM을 반환한다 — 호출부가 setState 반영을 기다리지 않도록 */
  const generate = async (vm: GeneratorViewModel): Promise<GeneratorViewModel | null> => {
    setState({ status: "loading" });
    try {
      const dto = await apiPost<GenerateResponse>(
        "/api/generator",
        generateCombinationRequest(vm), // VM → (업캐스트) → Model 시그니처 → DTO
      );
      const next = vm.withResult(generateCombinationResponse(dto));
      setState({ status: "success", data: next });
      return next;
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : "생성에 실패했습니다" });
      return null;
    }
  };

  /** 모드 전환 시 이전 에러를 지운다 (기존 changeMode 동작 보존) */
  const reset = () => setState({ status: "idle" });

  return { ...state, generate, reset };
}
```

`apps/web/src/modules/generator/action/index.ts`:

```ts
export * from "./generateCombination.action";
```

- [ ] **Step 7: 전용 자식 컴포넌트 3개를 만든다 (각자 props interface를 export)**

`apps/web/src/modules/generator/view/component/modeSelector.tsx`:

```tsx
"use client";
import type { GeneratorMode } from "../../model";

const MODES: { key: GeneratorMode; label: string }[] = [
  { key: "auto", label: "자동" },
  { key: "semi", label: "부분 선택" },
  { key: "manual", label: "직접 입력" },
];

export interface ModeSelectorProps {
  mode: GeneratorMode;
  onChange: (mode: GeneratorMode) => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="mb-4 flex gap-2">
      {MODES.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === key
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

`apps/web/src/modules/generator/view/component/numberPad.tsx`:

```tsx
"use client";

const ALL_NUMBERS = Array.from({ length: 45 }, (_, i) => i + 1);

export interface NumberPadProps {
  /** 숨김 여부 — auto 모드에서는 렌더하지 않는다 */
  visible: boolean;
  isSelected: (n: number) => boolean;
  onToggle: (n: number) => void;
}

export function NumberPad({ visible, isSelected, onToggle }: NumberPadProps) {
  if (!visible) return null;
  return (
    <div className="mb-4 grid grid-cols-9 gap-1.5">
      {ALL_NUMBERS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onToggle(n)}
          className={`rounded-md py-1 text-xs font-semibold tabular-nums transition-colors ${
            isSelected(n)
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
```

`apps/web/src/modules/generator/view/component/generatedResult.tsx`:

```tsx
"use client";
import { Ball } from "@/shared/ui/ball";

export interface GeneratedResultProps {
  numbers: number[] | null;
  error: string | null;
}

export function GeneratedResult({ numbers, error }: GeneratedResultProps) {
  return (
    <>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {numbers ? (
        <div className="mt-4 flex items-center gap-1.5">
          {numbers.map((n) => (
            <Ball key={n} n={n} size="lg" />
          ))}
        </div>
      ) : null}
    </>
  );
}
```

`apps/web/src/modules/generator/view/component/index.ts`:

```ts
export * from "./modeSelector";
export * from "./numberPad";
export * from "./generatedResult";
```

- [ ] **Step 8: Presenter를 만든다 (자식 props 타입을 import — 단방향)**

`apps/web/src/modules/generator/view/generator.presenter.ts`:

```ts
"use client";
import { useState } from "react";
import { useGenerateCombinationAction } from "../action";
import { GeneratorViewModel, type GeneratorMode } from "../model";
import type { GeneratedResultProps, ModeSelectorProps, NumberPadProps } from "./component";

/** 생성 버튼은 자식 컴포넌트로 쪼개지 않았으므로 번들 타입을 여기 선언한다 */
export interface GenerateButtonBundle {
  enabled: boolean;
  hint: string;
  busy: boolean;
  label: string;
  onClick: () => void;
}

export function useGeneratorPresenter(ctx: { onGenerated: (numbers: number[]) => void }): {
  modeSelector: ModeSelectorProps;
  numberPad: NumberPadProps;
  generateButton: GenerateButtonBundle;
  result: GeneratedResultProps;
} {
  // 인터랙티브 모듈 — Presenter가 VM의 단일 소유자다 (VM 소유권 규칙)
  const [vm, setVm] = useState(() => new GeneratorViewModel());
  const action = useGenerateCombinationAction();
  const busy = action.status === "loading";

  const changeMode = (mode: GeneratorMode) => {
    action.reset();
    setVm((v) => v.withMode(mode));
  };

  const toggleNumber = (n: number) => setVm((v) => v.withToggled(n));

  const generate = async () => {
    const next = await action.generate(vm); // 반환값을 쓴다 — action.data를 읽지 않는다
    if (!next?.result) return;
    setVm(next);
    ctx.onGenerated(next.result.numbers);
  };

  return {
    modeSelector: { mode: vm.mode, onChange: changeMode },
    numberPad: {
      visible: vm.isPickingNumbers,
      isSelected: (n: number) => vm.isSelected(n),
      onToggle: toggleNumber,
    },
    generateButton: {
      enabled: vm.canGenerate && !busy,
      hint: vm.hint,
      busy,
      label: busy ? "생성 중…" : "번호 생성",
      onClick: () => {
        void generate();
      },
    },
    result: {
      numbers: vm.result?.numbers ?? null,
      error: action.status === "error" ? action.error : null,
    },
  };
}
```

- [ ] **Step 9: Presenter 번들 테스트를 쓴다 (번들 형태와 자식 props 타입 일치 — 스펙 §10)**

`apps/web/src/modules/generator/view/generator.presenter.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ModeSelectorProps, NumberPadProps } from "./component";
import { useGeneratorPresenter } from "./generator.presenter";

describe("useGeneratorPresenter — 자식별 props 번들", () => {
  it("번들이 자식 props 타입과 정확히 맞물린다", () => {
    const { result } = renderHook(() => useGeneratorPresenter({ onGenerated: vi.fn() }));

    // 타입 수준 확인 — 자식 props 타입에 그대로 대입되면 spread가 성립한다
    const modeSelector: ModeSelectorProps = result.current.modeSelector;
    const numberPad: NumberPadProps = result.current.numberPad;

    expect(modeSelector.mode).toBe("auto");
    expect(numberPad.visible).toBe(false); // auto 모드에서는 번호판을 숨긴다
    expect(result.current.generateButton.enabled).toBe(true);
    expect(result.current.result).toEqual({ numbers: null, error: null });
  });

  it("모드를 바꾸면 번호판이 열리고 생성 버튼이 잠긴다", () => {
    const { result } = renderHook(() => useGeneratorPresenter({ onGenerated: vi.fn() }));

    act(() => {
      result.current.modeSelector.onChange("manual");
    });

    expect(result.current.numberPad.visible).toBe(true);
    expect(result.current.generateButton.enabled).toBe(false);
    expect(result.current.generateButton.hint).toBe("6개 번호를 직접 선택하세요 (0/6)");
  });

  it("번호를 토글하면 선택 상태가 번들에 반영된다", () => {
    const { result } = renderHook(() => useGeneratorPresenter({ onGenerated: vi.fn() }));

    act(() => {
      result.current.modeSelector.onChange("semi");
    });
    act(() => {
      result.current.numberPad.onToggle(7);
    });

    expect(result.current.numberPad.isSelected(7)).toBe(true);
    expect(result.current.generateButton.enabled).toBe(true);
  });
});
```

```bash
pnpm --filter web exec vitest run src/modules/generator/view/generator.presenter.test.ts
```

Expected: PASS — 3 tests.

- [ ] **Step 10: View를 만든다 (로직 0, 레이아웃만)**

`apps/web/src/modules/generator/view/generatorCard.tsx`:

```tsx
"use client";
import { Card } from "@/shared/ui/card";
import { GeneratedResult, ModeSelector, NumberPad } from "./component";
import { useGeneratorPresenter } from "./generator.presenter";

export interface GeneratorCardProps {
  onGenerated: (numbers: number[]) => void;
}

export function GeneratorCard(props: GeneratorCardProps) {
  const p = useGeneratorPresenter(props);

  return (
    <Card title="번호 만들기" subtitle={p.generateButton.hint}>
      <ModeSelector {...p.modeSelector} />
      <NumberPad {...p.numberPad} />
      <button
        type="button"
        onClick={p.generateButton.onClick}
        disabled={!p.generateButton.enabled}
        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {p.generateButton.label}
      </button>
      <GeneratedResult {...p.result} />
    </Card>
  );
}
```

`apps/web/src/modules/generator/view/index.ts`:

```ts
export * from "./generatorCard";
```

- [ ] **Step 11: 공개 배럴 갱신 + 구 폴더 삭제**

`apps/web/src/modules/generator/index.ts`:

```ts
export { GeneratorCard, type GeneratorCardProps } from "./view";
export type { GeneratedCombinationModel, GeneratorMode } from "./model";
```

```bash
cd "$(git rev-parse --show-toplevel)"
rm -rf apps/web/src/modules/generator/api apps/web/src/modules/generator/transport \
       apps/web/src/modules/generator/viewmodel
rm apps/web/src/modules/generator/view/generator-card.tsx
```

- [ ] **Step 12: 검증**

```bash
pnpm --filter web test && pnpm --filter web lint && pnpm --filter web build
```

Expected: 전부 통과.

- [ ] **Step 13: 커밋**

```bash
git add apps/web/src/modules/generator
git commit -m "refactor(generator): Presenter가 VM 단일 소유 + view/component 자식 3개로 전환"
```

---

## Task 9: `picks` 모듈 전환 (Action 3개의 순서 조합)

**핵심:** Action 훅끼리 서로 호출하는 암묵적 의존은 **금지**다. "저장 후 재조회" 같은 순서 조합은 **Presenter 안에서만** 한다(스펙 §1.3).

**Files:**
- Create: `picks/model/pick.viewmodel.ts`, `pick.viewmodel.test.ts`, `index.ts`
- Create: `picks/mapper/picks.mapper.ts`, `picks.mapper.test.ts`, `index.ts`
- Create: `picks/action/getPicks.action.ts`, `savePick.action.ts`, `deletePick.action.ts`, `index.ts`
- Create: `picks/view/picksCard.tsx`, `picks.presenter.ts`, `index.ts`, `component/pickRow.tsx`, `component/index.ts`
- Modify: `picks/index.ts`
- Delete: `picks/api/`, `picks/transport/`, `picks/viewmodel/`, `picks/view/picks-card.tsx`

---

- [ ] **Step 1: 실패하는 ViewModel 테스트를 먼저 쓴다**

`apps/web/src/modules/picks/model/pick.viewmodel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PickViewModel } from "./pick.viewmodel";

describe("PickViewModel.savedAtLabel (구 formatSavedAt)", () => {
  it("저장 시각을 YYYY.MM.DD HH:mm 로 표기한다", () => {
    const vm = PickViewModel.from({
      id: "p1",
      numbers: [1, 2, 3, 4, 5, 6],
      createdAt: new Date(2026, 7, 8, 9, 5),
    });
    expect(vm.savedAtLabel).toBe("2026.08.08 09:05");
  });

  it("fromAll — 목록 전체를 승격한다", () => {
    const vms = PickViewModel.fromAll([
      { id: "p1", numbers: [1, 2, 3, 4, 5, 6], createdAt: new Date(0) },
      { id: "p2", numbers: [7, 8, 9, 10, 11, 12], createdAt: new Date(0) },
    ]);
    expect(vms).toHaveLength(2);
    expect(vms[0]).toBeInstanceOf(PickViewModel);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm --filter web exec vitest run src/modules/picks/model/pick.viewmodel.test.ts
```

Expected: FAIL — `Failed to resolve import "./pick.viewmodel"`.

- [ ] **Step 3: ViewModel class를 만든다**

`apps/web/src/modules/picks/model/pick.viewmodel.ts`:

```ts
import type { PickModel } from "./pick.model";

/** 저장된 픽 ViewModel — 표시용 시각 문자열을 파생값으로 소유한다 */
export class PickViewModel implements PickModel {
  id = "";
  numbers: number[] = [];
  createdAt = new Date(0);

  static from(model: PickModel): PickViewModel {
    return Object.assign(new PickViewModel(), model);
  }

  static fromAll(models: PickModel[]): PickViewModel[] {
    return models.map(PickViewModel.from);
  }

  get savedAtLabel(): string {
    const d = this.createdAt;
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${y}.${mo}.${day} ${h}:${mi}`;
  }
}
```

`apps/web/src/modules/picks/model/index.ts`:

```ts
export * from "./pick.model";
export * from "./pick.viewmodel";
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
pnpm --filter web exec vitest run src/modules/picks/model/pick.viewmodel.test.ts
```

Expected: PASS — 2 tests.

- [ ] **Step 5: mapper와 그 테스트를 만든다 (`pick-transport.test.ts` 이전)**

`apps/web/src/modules/picks/mapper/picks.mapper.ts`:

```ts
import type { PickResponse, SavePickRequest } from "@fortuna-lottery/contract/picks";
import type { PickModel } from "../model";

/** 공통 변환 — 두 Response mapper가 같은 규칙을 쓰되 이름은 Action 어간을 따른다 */
function toPickModel(dto: PickResponse): PickModel {
  return {
    id: dto.id,
    numbers: [...dto.numbers],
    createdAt: new Date(dto.createdAt),
  };
}

/** 목록 응답 DTO → Model 목록 */
export function getPicksResponse(dtos: PickResponse[]): PickModel[] {
  return dtos.map(toPickModel);
}

/** 저장할 조합 → 요청 DTO */
export function savePickRequest(numbers: number[]): SavePickRequest {
  return { numbers: [...numbers] };
}

/** 저장 응답 DTO → Model */
export function savePickResponse(dto: PickResponse): PickModel {
  return toPickModel(dto);
}

/** 삭제 대상 식별자 → 경로 세그먼트 (반환 데이터가 없으므로 Request만 둔다) */
export function deletePickRequest(id: string): string {
  return encodeURIComponent(id);
}
```

`apps/web/src/modules/picks/mapper/index.ts`:

```ts
export * from "./picks.mapper";
```

`apps/web/src/modules/picks/mapper/picks.mapper.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  deletePickRequest,
  getPicksResponse,
  savePickRequest,
  savePickResponse,
} from "./picks.mapper";

describe("picks 와이어 이음새 (mapper)", () => {
  it("savePickRequest — FE 배열을 요청 DTO로 (원본 비공유 복사)", () => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const req = savePickRequest(numbers);
    expect(req).toEqual({ numbers: [1, 2, 3, 4, 5, 6] });
    expect(req.numbers).not.toBe(numbers);
  });

  it("savePickResponse — 응답 DTO를 Model로 (날짜 파싱)", () => {
    const model = savePickResponse({
      id: "p1",
      numbers: [1, 2, 3, 4, 5, 6],
      createdAt: "2026-07-03T12:00:00.000Z",
    });
    expect(model.id).toBe("p1");
    expect(model.createdAt).toBeInstanceOf(Date);
    expect(model.createdAt.toISOString()).toBe("2026-07-03T12:00:00.000Z");
  });

  it("getPicksResponse — 목록 전체를 변환한다", () => {
    const models = getPicksResponse([
      { id: "p1", numbers: [1, 2, 3, 4, 5, 6], createdAt: "2026-07-03T12:00:00.000Z" },
      { id: "p2", numbers: [7, 8, 9, 10, 11, 12], createdAt: "2026-07-04T12:00:00.000Z" },
    ]);
    expect(models.map((m) => m.id)).toEqual(["p1", "p2"]);
  });

  it("deletePickRequest — 경로에 안전한 세그먼트를 만든다", () => {
    expect(deletePickRequest("pick_a/b")).toBe("pick_a%2Fb");
  });
});
```

```bash
pnpm --filter web exec vitest run src/modules/picks/mapper/picks.mapper.test.ts
```

Expected: PASS — 4 tests.

- [ ] **Step 6: Action 3개를 만든다**

`apps/web/src/modules/picks/action/getPicks.action.ts`:

```ts
"use client";
import { useCallback, useState } from "react";
import type { PickResponse } from "@fortuna-lottery/contract/picks";
import type { ActionState } from "@/shared/lib/actionState";
import { apiGet } from "@/shared/lib/fetcher";
import { getPicksResponse } from "../mapper";
import { PickViewModel } from "../model";

export function useGetPicksAction() {
  const [state, setState] = useState<ActionState<PickViewModel[]>>({ status: "idle" });

  const load = useCallback(async (): Promise<PickViewModel[] | null> => {
    setState({ status: "loading" });
    try {
      const dtos = await apiGet<PickResponse[]>("/api/picks");
      const next = PickViewModel.fromAll(getPicksResponse(dtos));
      setState({ status: "success", data: next });
      return next;
    } catch (e) {
      setState({
        status: "error",
        error: e instanceof Error ? e.message : "목록을 불러오지 못했습니다",
      });
      return null;
    }
  }, []);

  return { ...state, load };
}
```

`apps/web/src/modules/picks/action/savePick.action.ts`:

```ts
"use client";
import { useState } from "react";
import type { PickResponse } from "@fortuna-lottery/contract/picks";
import type { ActionState } from "@/shared/lib/actionState";
import { apiPost } from "@/shared/lib/fetcher";
import { savePickRequest, savePickResponse } from "../mapper";
import { PickViewModel } from "../model";

export function useSavePickAction() {
  const [state, setState] = useState<ActionState<PickViewModel>>({ status: "idle" });

  const save = async (numbers: number[]): Promise<PickViewModel | null> => {
    setState({ status: "loading" });
    try {
      const dto = await apiPost<PickResponse>("/api/picks", savePickRequest(numbers));
      const next = PickViewModel.from(savePickResponse(dto));
      setState({ status: "success", data: next });
      return next;
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : "저장에 실패했습니다" });
      return null;
    }
  };

  return { ...state, save };
}
```

`apps/web/src/modules/picks/action/deletePick.action.ts`:

```ts
"use client";
import { useState } from "react";
import type { ActionState } from "@/shared/lib/actionState";
import { apiDelete } from "@/shared/lib/fetcher";
import { deletePickRequest } from "../mapper";

export function useDeletePickAction() {
  const [state, setState] = useState<ActionState<void>>({ status: "idle" });

  /** 반환 데이터가 없는 트리거 — 성공 여부만 돌려준다 (§1.2 예외) */
  const remove = async (id: string): Promise<boolean> => {
    setState({ status: "loading" });
    try {
      await apiDelete<{ deleted: true }>(`/api/picks/${deletePickRequest(id)}`);
      setState({ status: "success", data: undefined });
      return true;
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : "삭제에 실패했습니다" });
      return false;
    }
  };

  return { ...state, remove };
}
```

`apps/web/src/modules/picks/action/index.ts`:

```ts
export * from "./getPicks.action";
export * from "./savePick.action";
export * from "./deletePick.action";
```

- [ ] **Step 7: 자식 컴포넌트 `PickRow`를 만든다**

`apps/web/src/modules/picks/view/component/pickRow.tsx`:

```tsx
"use client";
import { Ball } from "@/shared/ui/ball";

export interface PickRowProps {
  pickId: string;
  numbers: number[];
  savedAtLabel: string;
  onRemove: (id: string) => void;
}

export function PickRow({ pickId, numbers, savedAtLabel, onRemove }: PickRowProps) {
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        {numbers.map((n) => (
          <Ball key={n} n={n} size="sm" />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500">{savedAtLabel}</span>
        <button
          type="button"
          onClick={() => onRemove(pickId)}
          className="rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
          aria-label="삭제"
        >
          삭제
        </button>
      </div>
    </li>
  );
}
```

`apps/web/src/modules/picks/view/component/index.ts`:

```ts
export * from "./pickRow";
```

- [ ] **Step 8: Presenter를 만든다 (Action 3개의 순서 조합이 여기 모인다)**

`apps/web/src/modules/picks/view/picks.presenter.ts`:

```ts
"use client";
import { useEffect } from "react";
import { useDeletePickAction, useGetPicksAction, useSavePickAction } from "../action";
import type { PickRowProps } from "./component";

export interface PicksSaveButtonBundle {
  label: string;
  enabled: boolean;
  error: string | null;
  onClick: () => void;
}

export interface PicksEmptyStateBundle {
  visible: boolean;
  message: string;
}

export function usePicksPresenter(ctx: { currentNumbers: number[] | null }): {
  list: PickRowProps[];
  saveButton: PicksSaveButtonBundle;
  emptyState: PicksEmptyStateBundle;
} {
  const getAction = useGetPicksAction();
  const saveAction = useSavePickAction();
  const deleteAction = useDeletePickAction();
  const { load } = getAction;

  useEffect(() => {
    void load();
  }, [load]);

  const picks = getAction.status === "success" ? getAction.data : [];
  const busy = saveAction.status === "loading";

  // Action 훅끼리 서로 호출하지 않는다 — 순서 조합은 Presenter에서만 한다 (§1.3)
  const save = async () => {
    if (!ctx.currentNumbers) return;
    const saved = await saveAction.save(ctx.currentNumbers);
    if (!saved) return;
    await load();
  };

  const remove = async (id: string) => {
    const removed = await deleteAction.remove(id);
    if (!removed) return;
    await load();
  };

  const error =
    saveAction.status === "error"
      ? saveAction.error
      : deleteAction.status === "error"
        ? deleteAction.error
        : getAction.status === "error"
          ? getAction.error
          : null;

  return {
    list: picks.map((pick) => ({
      pickId: pick.id,
      numbers: pick.numbers,
      savedAtLabel: pick.savedAtLabel,
      onRemove: (id: string) => {
        void remove(id);
      },
    })),
    saveButton: {
      label: busy ? "저장 중…" : ctx.currentNumbers ? "현재 번호 저장" : "먼저 번호를 생성하세요",
      enabled: ctx.currentNumbers !== null && !busy,
      error,
      onClick: () => {
        void save();
      },
    },
    emptyState: {
      visible: picks.length === 0,
      message: "아직 저장한 번호가 없습니다.",
    },
  };
}
```

- [ ] **Step 9: View를 만든다**

`apps/web/src/modules/picks/view/picksCard.tsx`:

```tsx
"use client";
import { Card } from "@/shared/ui/card";
import { PickRow } from "./component";
import { usePicksPresenter } from "./picks.presenter";

export interface PicksCardProps {
  /** 현재 생성된 조합 (없으면 저장 버튼 비활성) */
  currentNumbers: number[] | null;
}

export function PicksCard(props: PicksCardProps) {
  const p = usePicksPresenter(props);

  return (
    <Card
      title="내 번호"
      subtitle="저장한 조합은 매주 추첨 결과와 자동 대조됩니다"
      footnote="MVP는 게스트 모드로 서버 메모리에 저장됩니다 (재시작 시 초기화)."
    >
      <button
        type="button"
        onClick={p.saveButton.onClick}
        disabled={!p.saveButton.enabled}
        className="mb-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {p.saveButton.label}
      </button>

      {p.saveButton.error ? (
        <p className="mb-3 text-sm text-red-600">{p.saveButton.error}</p>
      ) : null}

      {p.emptyState.visible ? (
        <p className="text-sm text-slate-500">{p.emptyState.message}</p>
      ) : (
        <ul className="space-y-2.5">
          {p.list.map((row) => (
            <PickRow key={row.pickId} {...row} />
          ))}
        </ul>
      )}
    </Card>
  );
}
```

`apps/web/src/modules/picks/view/index.ts`:

```ts
export * from "./picksCard";
```

- [ ] **Step 10: 공개 배럴 갱신 + 구 폴더 삭제**

`apps/web/src/modules/picks/index.ts`:

```ts
export { PicksCard, type PicksCardProps } from "./view";
export type { PickModel } from "./model";
```

```bash
cd "$(git rev-parse --show-toplevel)"
rm -rf apps/web/src/modules/picks/api apps/web/src/modules/picks/transport \
       apps/web/src/modules/picks/viewmodel
rm apps/web/src/modules/picks/view/picks-card.tsx
```

- [ ] **Step 11: 검증**

```bash
pnpm --filter web test && pnpm --filter web lint && pnpm --filter web build
```

Expected: 전부 통과. `pick-transport.test.ts`가 사라지고 `picks.mapper.test.ts`가 그 자리를 대신한다.

- [ ] **Step 12: 커밋**

```bash
git add apps/web/src/modules/picks
git commit -m "refactor(picks): Action 3개 분리 + Presenter가 저장/삭제 후 재조회를 조합"
```

---

## Task 10: `statistics` 모듈 전환 (8개 서브뷰를 `view/component/`로)

**변경 범위가 가장 넓다.** `viewmodel/presenters.ts`의 9개 순수 함수가 두 갈래로 나뉜다:
- **행/셀 단위 파생값** → `StatisticsViewModel`의 getter·메서드
- **차트 축·눈금** → `statistics.presenter.ts`

8개 서브뷰는 `stats: StatisticsModel`을 통째로 받는 대신 **계산이 끝난 props**를 받는다. 공 색(`ballColor`)은 `shared/lib`이므로 컴포넌트가 직접 써도 된다(렌더링 세부사항).

**Files:**
- Create: `statistics/model/statistics.viewmodel.ts`, `statistics.viewmodel.test.ts`, `index.ts`
- Create: `statistics/mapper/statistics.mapper.ts`, `index.ts`
- Create: `statistics/action/getStatistics.action.ts`, `index.ts`
- Create: `statistics/view/statisticsPanel.tsx`, `statistics.presenter.ts`, `statistics.presenter.test.ts`, `index.ts`
- Create: `statistics/view/component/{probabilityReality,sumDistributionChart,frequencyHeatmap,patternDistribution,hotColdBoard,topPairsList,numberFrequencyBars,recentGrid}.tsx`, `component/index.ts`
- Modify: `statistics/index.ts`
- Delete: `statistics/api/`, `statistics/transport/`, `statistics/viewmodel/`, `statistics/view/*.tsx`(구 8개 + 패널)

---

- [ ] **Step 1: 실패하는 ViewModel 테스트를 먼저 쓴다 (`presenters.test.ts`의 파생값 절반)**

`apps/web/src/modules/statistics/model/statistics.viewmodel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { StatisticsModel } from "./statistics.model";
import { StatisticsViewModel } from "./statistics.viewmodel";

const vm = (over: Partial<StatisticsModel> = {}): StatisticsViewModel =>
  StatisticsViewModel.from({
    totalDraws: 100,
    latestRound: 100,
    frequency: [],
    sumDistribution: [],
    oddCountDist: [0, 0, 10, 30, 40, 15, 5],
    lowCountDist: [],
    zoneCounts: [],
    hotCold: [],
    topPairs: [],
    recentGrid: [],
    totalCombinations: 8_145_060,
    ...over,
  });

describe("StatisticsViewModel — 정적 순수 헬퍼", () => {
  it("glowIntensity — min~max를 0~1로 정규화", () => {
    expect(StatisticsViewModel.glowIntensity(10, 10, 20)).toBe(0);
    expect(StatisticsViewModel.glowIntensity(20, 10, 20)).toBe(1);
    expect(StatisticsViewModel.glowIntensity(15, 10, 20)).toBe(0.5);
    expect(StatisticsViewModel.glowIntensity(5, 5, 5)).toBe(0.5); // 편차 없음 → 중간값
  });

  it("sumOf / oddCountOf / lowCountOf", () => {
    expect(StatisticsViewModel.sumOf([1, 2, 3, 4, 5, 6])).toBe(21);
    expect(StatisticsViewModel.oddCountOf([1, 2, 3, 4, 5, 6])).toBe(3);
    expect(StatisticsViewModel.lowCountOf([1, 22, 23, 30, 40, 45])).toBe(2);
  });
});

describe("StatisticsViewModel — 내 조합 기준 파생값", () => {
  it("rarityOf — 내 홀짝 패턴의 과거 출현 비율", () => {
    const r = vm().rarityOf([1, 3, 5, 7, 2, 4]); // 홀 4
    expect(r.label).toBe("홀 4 : 짝 2");
    expect(r.percent).toBe(40);
  });

  it("sumPositionOf — 내 합계보다 작은 과거 회차 비율", () => {
    const target = vm({
      sumDistribution: [
        { sum: 100, count: 30 },
        { sum: 120, count: 40 },
        { sum: 140, count: 30 },
      ],
    });
    expect(target.sumPositionOf([20, 30, 10, 25, 15, 20])).toEqual({
      mySum: 120,
      percentBelow: 30,
    });
  });

  it("probabilityFacts — 고정 분모 사실 서술", () => {
    const facts = vm().probabilityFacts;
    expect(facts[0]).toContain("8,145,060");
    expect(facts.some((f) => f.includes("동일"))).toBe(true);
  });
});

describe("StatisticsViewModel — 표시용 파생값", () => {
  it("frequencyCells — 번호·횟수·글로우 강도", () => {
    const cells = vm({ frequency: [10, 20] }).frequencyCells;
    expect(cells).toEqual([
      { number: 1, count: 10, glow: 0 },
      { number: 2, count: 20, glow: 1 },
    ]);
  });

  it("coldest / hottest — gap 기준 정렬 상위 n", () => {
    const target = vm({
      hotCold: [
        { number: 1, count: 5, gap: 0 },
        { number: 2, count: 5, gap: 30 },
        { number: 3, count: 5, gap: 10 },
      ],
    });
    expect(target.coldest(2).map((c) => c.number)).toEqual([2, 3]);
    expect(target.hottest(2).map((c) => c.number)).toEqual([1, 3]);
    expect(target.hottest(1)[0]?.gapLabel).toBe("최신");
    expect(target.coldest(1)[0]?.gapLabel).toBe("30회");
  });

  it("recentGridColumns — 회차별 1~45 출현 여부", () => {
    const cols = vm({ recentGrid: [{ round: 7, numbers: [1, 45] }] }).recentGridColumns;
    expect(cols).toHaveLength(1);
    expect(cols[0]?.cells).toHaveLength(45);
    expect(cols[0]?.cells[0]).toEqual({ n: 1, present: true });
    expect(cols[0]?.cells[1]).toEqual({ n: 2, present: false });
    expect(cols[0]?.cells[44]).toEqual({ n: 45, present: true });
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm --filter web exec vitest run src/modules/statistics/model/statistics.viewmodel.test.ts
```

Expected: FAIL — `Failed to resolve import "./statistics.viewmodel"`.

- [ ] **Step 3: ViewModel class를 만든다**

`apps/web/src/modules/statistics/model/statistics.viewmodel.ts`:

```ts
import type { StatisticsModel } from "./statistics.model";

/**
 * 통계 ViewModel — 행/셀 단위 파생값을 전부 소유한다.
 * 모든 표현은 과거 데이터의 사실만 말한다 (정직성 원칙).
 * 차트 축·눈금은 여기 없다 — `statistics.presenter.ts` 소관이다.
 */
export class StatisticsViewModel implements StatisticsModel {
  totalDraws = 0;
  latestRound = 0;
  frequency: number[] = [];
  sumDistribution: { sum: number; count: number }[] = [];
  oddCountDist: number[] = [];
  lowCountDist: number[] = [];
  zoneCounts: number[] = [];
  hotCold: { number: number; count: number; gap: number }[] = [];
  topPairs: { a: number; b: number; count: number }[] = [];
  recentGrid: { round: number; numbers: number[] }[] = [];
  totalCombinations = 0;

  static readonly ZONE_LABELS = ["1-10", "11-20", "21-30", "31-40", "41-45"] as const;
  private static readonly WEEKS_PER_YEAR = 52.18;
  private static readonly LOTTO_MAX = 45;

  static from(model: StatisticsModel): StatisticsViewModel {
    return Object.assign(new StatisticsViewModel(), model);
  }

  /** 빈도 → 글로우 강도(0~1) 정규화 — 공 색은 바꾸지 않고 주변 강조만 */
  static glowIntensity(count: number, min: number, max: number): number {
    if (max <= min) return 0.5;
    return (count - min) / (max - min);
  }

  static sumOf(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0);
  }

  static oddCountOf(numbers: number[]): number {
    return numbers.filter((n) => n % 2 === 1).length;
  }

  /** 저구간(1~22) 개수 */
  static lowCountOf(numbers: number[]): number {
    return numbers.filter((n) => n <= 22).length;
  }

  get totalDrawsLabel(): string {
    return this.totalDraws.toLocaleString();
  }

  get totalCombinationsLabel(): string {
    return this.totalCombinations.toLocaleString();
  }

  get frequencyCells(): { number: number; count: number; glow: number }[] {
    const min = Math.min(...this.frequency);
    const max = Math.max(...this.frequency);
    return this.frequency.map((count, i) => ({
      number: i + 1,
      count,
      glow: StatisticsViewModel.glowIntensity(count, min, max),
    }));
  }

  get frequencyBars(): { number: number; count: number; heightPercent: number; title: string }[] {
    const max = Math.max(...this.frequency, 1);
    const totalPicks = this.totalDraws * 6;
    return this.frequency.map((count, i) => {
      const share = totalPicks > 0 ? ((count / totalPicks) * 100).toFixed(2) : "0";
      return {
        number: i + 1,
        count,
        heightPercent: (count / max) * 100,
        title: `${i + 1}번 · ${count}회 (${share}%)`,
      };
    });
  }

  /** 당첨 확률의 현실 체감 서술 — 고정 분모 기반 사실만 */
  get probabilityFacts(): string[] {
    const years = Math.round(this.totalCombinations / StatisticsViewModel.WEEKS_PER_YEAR);
    return [
      `한 게임이 1등일 확률은 1 / ${this.totalCombinationsLabel} 입니다.`,
      `매주 1게임씩 산다면, 평균적으로 1등까지 약 ${years.toLocaleString()}년이 걸리는 확률입니다.`,
      `이 확률은 어떤 번호를 고르든 완전히 동일합니다.`,
    ];
  }

  get topPairRows(): { a: number; b: number; count: number; widthPercent: number }[] {
    const max = this.topPairs[0]?.count ?? 1;
    return this.topPairs.map(({ a, b, count }) => ({
      a,
      b,
      count,
      widthPercent: (count / max) * 100,
    }));
  }

  get recentGridColumns(): { round: number; cells: { n: number; present: boolean }[] }[] {
    return this.recentGrid.map(({ round, numbers }) => {
      const present = new Set(numbers);
      return {
        round,
        cells: Array.from({ length: StatisticsViewModel.LOTTO_MAX }, (_, i) => ({
          n: i + 1,
          present: present.has(i + 1),
        })),
      };
    });
  }

  get recentGridSubtitle(): string | undefined {
    const first = this.recentGrid[0]?.round;
    const last = this.recentGrid[this.recentGrid.length - 1]?.round;
    if (first === undefined || last === undefined) return undefined;
    return `제${first}회 ~ 제${last}회 (최근 ${this.recentGrid.length}회차)`;
  }

  /** gap 큰 순 = 오래 안 나온 번호 */
  coldest(n: number): { number: number; gap: number; gapLabel: string }[] {
    return [...this.hotCold]
      .sort((a, b) => b.gap - a.gap || a.number - b.number)
      .slice(0, n)
      .map((e) => ({ number: e.number, gap: e.gap, gapLabel: StatisticsViewModel.gapLabel(e.gap) }));
  }

  /** gap 작은 순 = 최근 나온 번호 */
  hottest(n: number): { number: number; gap: number; gapLabel: string }[] {
    return [...this.hotCold]
      .sort((a, b) => a.gap - b.gap || a.number - b.number)
      .slice(0, n)
      .map((e) => ({ number: e.number, gap: e.gap, gapLabel: StatisticsViewModel.gapLabel(e.gap) }));
  }

  private static gapLabel(gap: number): string {
    return gap === 0 ? "최신" : `${gap}회`;
  }

  /**
   * 패턴 희귀도 — 내 조합의 홀짝 패턴이 과거 회차에서 차지한 비율 (사실 기반).
   * "희귀함"은 좋고 나쁨이 아니라 출현 빈도의 서술일 뿐이다.
   */
  rarityOf(myNumbers: number[]): { label: string; percent: number } {
    const odd = StatisticsViewModel.oddCountOf(myNumbers);
    const count = this.oddCountDist[odd] ?? 0;
    const percent = this.totalDraws > 0 ? (count / this.totalDraws) * 100 : 0;
    return { label: `홀 ${odd} : 짝 ${6 - odd}`, percent: Math.round(percent * 10) / 10 };
  }

  /** 합계 분포에서 내 합계가 속한 위치 (과거 회차 대비) */
  sumPositionOf(myNumbers: number[]): { mySum: number; percentBelow: number } {
    const mySum = StatisticsViewModel.sumOf(myNumbers);
    let below = 0;
    let total = 0;
    for (const { sum, count } of this.sumDistribution) {
      total += count;
      if (sum < mySum) below += count;
    }
    return { mySum, percentBelow: total > 0 ? Math.round((below / total) * 1000) / 10 : 0 };
  }

  /** 홀짝·고저·구간 3개 그룹의 막대 — highlight는 내 조합이 있을 때만 */
  patternGroupsFor(myNumbers: number[] | null): {
    title: string;
    bars: { label: string; percentLabel: string; heightPx: number; highlighted: boolean }[];
  }[] {
    const zoneTotal = this.zoneCounts.reduce((a, b) => a + b, 0);
    return [
      {
        title: "홀수 개수 (0~6)",
        bars: StatisticsViewModel.barsOf(
          this.oddCountDist,
          this.totalDraws,
          myNumbers ? StatisticsViewModel.oddCountOf(myNumbers) : null,
          (i) => `홀${i}`,
        ),
      },
      {
        title: "저구간(1~22) 개수 (0~6)",
        bars: StatisticsViewModel.barsOf(
          this.lowCountDist,
          this.totalDraws,
          myNumbers ? StatisticsViewModel.lowCountOf(myNumbers) : null,
          (i) => `저${i}`,
        ),
      },
      {
        title: "구간별 총 출현",
        bars: StatisticsViewModel.barsOf(
          this.zoneCounts,
          zoneTotal,
          null,
          (i) => StatisticsViewModel.ZONE_LABELS[i] ?? "",
        ),
      },
    ];
  }

  private static barsOf(
    dist: number[],
    total: number,
    highlight: number | null,
    labelOf: (i: number) => string,
  ): { label: string; percentLabel: string; heightPx: number; highlighted: boolean }[] {
    const max = Math.max(...dist, 1);
    return dist.map((count, i) => ({
      label: labelOf(i),
      percentLabel: total > 0 ? `${Math.round((count / total) * 100)}%` : "0%",
      heightPx: 6 + (count / max) * 56,
      highlighted: i === highlight,
    }));
  }
}
```

`apps/web/src/modules/statistics/model/index.ts`:

```ts
export * from "./statistics.model";
export * from "./statistics.viewmodel";
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

```bash
pnpm --filter web exec vitest run src/modules/statistics/model/statistics.viewmodel.test.ts
```

Expected: PASS — 8 tests.

- [ ] **Step 5: mapper와 Action을 만든다**

`apps/web/src/modules/statistics/mapper/statistics.mapper.ts`:

```ts
import type { StatisticsResponse } from "@fortuna-lottery/contract/statistics";
import type { StatisticsModel } from "../model";

/** 응답 DTO → Model (와이어 이음새 — 배열은 전부 비공유 복사) */
export function getStatisticsResponse(dto: StatisticsResponse): StatisticsModel {
  return {
    totalDraws: dto.totalDraws,
    latestRound: dto.latestRound,
    frequency: [...dto.frequency],
    sumDistribution: dto.sumDistribution.map((e) => ({ ...e })),
    oddCountDist: [...dto.oddCountDist],
    lowCountDist: [...dto.lowCountDist],
    zoneCounts: [...dto.zoneCounts],
    hotCold: dto.hotCold.map((e) => ({ ...e })),
    topPairs: dto.topPairs.map((e) => ({ ...e })),
    recentGrid: dto.recentGrid.map((e) => ({ round: e.round, numbers: [...e.numbers] })),
    totalCombinations: dto.totalCombinations,
  };
}
```

`apps/web/src/modules/statistics/mapper/index.ts`:

```ts
export * from "./statistics.mapper";
```

`apps/web/src/modules/statistics/action/getStatistics.action.ts`:

```ts
"use client";
import { useCallback, useState } from "react";
import type { StatisticsResponse } from "@fortuna-lottery/contract/statistics";
import type { ActionState } from "@/shared/lib/actionState";
import { apiGet } from "@/shared/lib/fetcher";
import { getStatisticsResponse } from "../mapper";
import { StatisticsViewModel } from "../model";

export function useGetStatisticsAction() {
  const [state, setState] = useState<ActionState<StatisticsViewModel>>({ status: "idle" });

  const load = useCallback(async (): Promise<StatisticsViewModel | null> => {
    setState({ status: "loading" });
    try {
      const dto = await apiGet<StatisticsResponse>("/api/statistics");
      const next = StatisticsViewModel.from(getStatisticsResponse(dto));
      setState({ status: "success", data: next });
      return next;
    } catch (e) {
      setState({
        status: "error",
        error: e instanceof Error ? e.message : "통계를 불러오지 못했습니다",
      });
      return null;
    }
  }, []);

  return { ...state, load };
}
```

`apps/web/src/modules/statistics/action/index.ts`:

```ts
export * from "./getStatistics.action";
```

- [ ] **Step 6: 8개 서브뷰를 `view/component/`에 만든다 (각자 props interface를 export)**

`apps/web/src/modules/statistics/view/component/probabilityReality.tsx`:

```tsx
"use client";
import { Card } from "@/shared/ui/card";

export interface ProbabilityRealityProps {
  totalCombinationsLabel: string;
  facts: string[];
}

export function ProbabilityReality({ totalCombinationsLabel, facts }: ProbabilityRealityProps) {
  return (
    <Card title="당첨 확률, 있는 그대로" subtitle="이 서비스의 어떤 통계도 이 확률을 바꾸지 못합니다">
      <p className="mb-3 text-3xl font-bold tracking-tight text-slate-900">
        1 <span className="text-slate-500">/</span> {totalCombinationsLabel}
      </p>
      <ul className="space-y-1.5">
        {facts.map((fact) => (
          <li key={fact} className="text-sm leading-relaxed text-slate-500">
            · {fact}
          </li>
        ))}
      </ul>
    </Card>
  );
}
```

`apps/web/src/modules/statistics/view/component/frequencyHeatmap.tsx`:

```tsx
"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";

export interface FrequencyHeatmapProps {
  subtitle: string;
  cells: { number: number; count: number; glow: number }[];
}

export function FrequencyHeatmap({ subtitle, cells }: FrequencyHeatmapProps) {
  return (
    <Card
      title="출현 빈도 히트맵"
      subtitle={subtitle}
      footnote="과거 출현 빈도입니다. 각 번호가 다음 회차에 나올 확률은 모두 동일합니다."
    >
      <div className="grid grid-cols-9 justify-items-center gap-2.5">
        {cells.map((cell) => (
          <div key={cell.number} className="flex flex-col items-center gap-0.5">
            <Ball n={cell.number} size="sm" glow={cell.glow} />
            <span className="text-[10px] tabular-nums text-slate-500">{cell.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

`apps/web/src/modules/statistics/view/component/numberFrequencyBars.tsx`:

```tsx
"use client";
import { ballColor } from "@/shared/lib/lotto-colors";
import { Card } from "@/shared/ui/card";

export interface NumberFrequencyBarsProps {
  bars: { number: number; count: number; heightPercent: number; title: string }[];
}

export function NumberFrequencyBars({ bars }: NumberFrequencyBarsProps) {
  return (
    <Card
      title="번호별 출현 확률"
      subtitle="전 회차에서 각 번호가 뽑힌 비율"
      footnote="이론상 모든 번호의 기대 확률은 동일합니다 (6/45 ≈ 13.3%). 편차는 우연입니다."
    >
      <div className="flex h-36 items-end gap-[3px]">
        {bars.map((bar) => (
          <div
            key={bar.number}
            className="group relative flex-1 rounded-t"
            style={{
              height: `${bar.heightPercent}%`,
              backgroundColor: ballColor(bar.number).bg,
              opacity: 0.85,
            }}
            title={bar.title}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>1</span>
        <span>10</span>
        <span>20</span>
        <span>30</span>
        <span>40</span>
        <span>45</span>
      </div>
    </Card>
  );
}
```

`apps/web/src/modules/statistics/view/component/hotColdBoard.tsx`:

```tsx
"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";

export interface HotColdEntry {
  number: number;
  gapLabel: string;
}

export interface HotColdBoardProps {
  coldest: HotColdEntry[];
  hottest: HotColdEntry[];
}

export function HotColdBoard({ coldest, hottest }: HotColdBoardProps) {
  return (
    <Card
      title="미출현 기간 (핫/콜드)"
      subtitle="각 번호가 몇 회째 안 나왔는지"
      footnote="미출현 기간은 미래 출현 가능성을 높이지 않습니다 (매 회차 독립 사건)."
    >
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">오래 안 나온 번호 TOP 8</p>
          <div className="flex flex-wrap gap-2">
            {coldest.map((entry) => (
              <div key={entry.number} className="flex flex-col items-center gap-0.5">
                <Ball n={entry.number} size="sm" dimmed />
                <span className="text-[10px] tabular-nums text-slate-500">{entry.gapLabel}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">최근 나온 번호 TOP 8</p>
          <div className="flex flex-wrap gap-2">
            {hottest.map((entry) => (
              <div key={entry.number} className="flex flex-col items-center gap-0.5">
                <Ball n={entry.number} size="sm" glow={0.7} />
                <span className="text-[10px] tabular-nums text-slate-500">{entry.gapLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
```

`apps/web/src/modules/statistics/view/component/topPairsList.tsx`:

```tsx
"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";

export interface TopPairsListProps {
  rows: { a: number; b: number; count: number; widthPercent: number }[];
}

export function TopPairsList({ rows }: TopPairsListProps) {
  return (
    <Card title="동시 출현 페어 TOP 15" subtitle="함께 자주 나온 번호쌍">
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={`${row.a}-${row.b}`} className="flex items-center gap-2">
            <Ball n={row.a} size="sm" />
            <Ball n={row.b} size="sm" />
            <div className="h-2 flex-1 overflow-hidden rounded bg-slate-100">
              <div className="h-full rounded bg-sky-600" style={{ width: `${row.widthPercent}%` }} />
            </div>
            <span className="w-10 text-right text-xs tabular-nums text-slate-500">
              {row.count}회
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
```

`apps/web/src/modules/statistics/view/component/patternDistribution.tsx`:

```tsx
"use client";
import { Card } from "@/shared/ui/card";

export interface PatternBar {
  label: string;
  percentLabel: string;
  heightPx: number;
  highlighted: boolean;
}

export interface PatternGroup {
  title: string;
  bars: PatternBar[];
}

export interface PatternDistributionProps {
  subtitle: string;
  groups: PatternGroup[];
}

/** 그룹 하나의 막대 묶음 — 이 컴포넌트 전용 내부 부품이라 export하지 않는다 */
function DistBars({ bars }: { bars: PatternBar[] }) {
  return (
    <div className="flex items-end gap-1.5">
      {bars.map((bar) => (
        <div key={bar.label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] tabular-nums text-slate-500">{bar.percentLabel}</span>
          <div
            className={`w-full rounded-t ${bar.highlighted ? "bg-amber-600" : "bg-sky-600/70"}`}
            style={{ height: `${bar.heightPx}px` }}
          />
          <span
            className={`text-[10px] ${
              bar.highlighted ? "font-bold text-amber-600" : "text-slate-500"
            }`}
          >
            {bar.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PatternDistribution({ subtitle, groups }: PatternDistributionProps) {
  return (
    <Card
      title="홀짝 · 고저 · 구간 분포"
      subtitle={subtitle}
      footnote="패턴의 흔함/드묾은 과거 빈도의 서술일 뿐, 당첨 가능성과 무관합니다."
    >
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-xs font-medium text-slate-500">{group.title}</p>
            <DistBars bars={group.bars} />
          </div>
        ))}
      </div>
    </Card>
  );
}
```

`apps/web/src/modules/statistics/view/component/recentGrid.tsx`:

```tsx
"use client";
import { ballColor } from "@/shared/lib/lotto-colors";
import { Card } from "@/shared/ui/card";

export interface RecentGridProps {
  subtitle: string | undefined;
  columns: { round: number; cells: { n: number; present: boolean }[] }[];
}

/** 잔디밭 — 가로 회차 / 세로 1~45, 출현 번호 칸을 공 색으로 칠한다 */
export function RecentGrid({ subtitle, columns }: RecentGridProps) {
  return (
    <Card title="회차별 잔디밭" subtitle={subtitle}>
      <div className="overflow-x-auto">
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, 9px)`,
            gridTemplateRows: "repeat(45, 9px)",
            gridAutoFlow: "column",
          }}
        >
          {columns.map((column) =>
            column.cells.map((cell) => (
              <div
                key={`${column.round}-${cell.n}`}
                title={`제${column.round}회 · ${cell.n}번${cell.present ? " 출현" : ""}`}
                className="rounded-[1px]"
                style={{ backgroundColor: cell.present ? ballColor(cell.n).bg : "#e2e8f0" }}
              />
            )),
          )}
        </div>
      </div>
    </Card>
  );
}
```

`apps/web/src/modules/statistics/view/component/sumDistributionChart.tsx`:

```tsx
"use client";
import { Card } from "@/shared/ui/card";

export interface SumChartBar {
  sum: number;
  x: number;
  y: number;
  height: number;
}

export interface SumChartMarker {
  x: number;
  label: string;
}

export interface SumDistributionChartProps {
  subtitle: string;
  /** 분포가 비어 있으면 null — 그릴 것이 없다 */
  geometry: {
    width: number;
    height: number;
    bars: SumChartBar[];
    marker: SumChartMarker | null;
    minSumLabel: string;
    maxSumLabel: string;
  } | null;
}

export function SumDistributionChart({ subtitle, geometry }: SumDistributionChartProps) {
  if (!geometry) return null;
  const { width, height, bars, marker, minSumLabel, maxSumLabel } = geometry;

  return (
    <Card title="번호 합계 분포" subtitle={subtitle}>
      <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full">
        {bars.map((bar) => (
          <rect
            key={bar.sum}
            x={bar.x - 1}
            y={bar.y}
            width={2.4}
            height={bar.height}
            fill="#38bdf8"
            opacity={0.75}
          />
        ))}
        {marker ? (
          <g>
            <line x1={marker.x} y1={0} x2={marker.x} y2={height} stroke="#f59e0b" strokeWidth={2} />
            <text x={marker.x} y={height + 14} textAnchor="middle" fontSize={11} fill="#f59e0b">
              {marker.label}
            </text>
          </g>
        ) : null}
        <text x={0} y={height + 14} fontSize={10} fill="#64748b">
          {minSumLabel}
        </text>
        <text x={width} y={height + 14} textAnchor="end" fontSize={10} fill="#64748b">
          {maxSumLabel}
        </text>
      </svg>
    </Card>
  );
}
```

`apps/web/src/modules/statistics/view/component/index.ts`:

```ts
export * from "./probabilityReality";
export * from "./sumDistributionChart";
export * from "./frequencyHeatmap";
export * from "./patternDistribution";
export * from "./hotColdBoard";
export * from "./topPairsList";
export * from "./numberFrequencyBars";
export * from "./recentGrid";
```

- [ ] **Step 7: 차트 기하 계산 테스트를 먼저 쓴다 (Presenter 소관)**

`apps/web/src/modules/statistics/view/statistics.presenter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CHART_HEIGHT, CHART_WIDTH, sumChartGeometry } from "./statistics.presenter";

const dist = [
  { sum: 100, count: 10 },
  { sum: 150, count: 20 },
  { sum: 200, count: 5 },
];

describe("sumChartGeometry (차트 축·눈금 — Presenter 소관)", () => {
  it("분포가 비면 null", () => {
    expect(sumChartGeometry([], null)).toBeNull();
  });

  it("x는 최소 합계 0, 최대 합계 W에 매핑된다", () => {
    const g = sumChartGeometry(dist, null);
    expect(g?.bars[0]?.x).toBe(0);
    expect(g?.bars[2]?.x).toBe(CHART_WIDTH);
    expect(g?.minSumLabel).toBe("100");
    expect(g?.maxSumLabel).toBe("200");
  });

  it("y는 최대 count일 때 가장 위(10)로 간다", () => {
    const g = sumChartGeometry(dist, null);
    expect(g?.bars[1]?.y).toBe(10);
    expect(g?.bars[1]?.height).toBe(CHART_HEIGHT - 10);
  });

  it("내 합계가 있으면 마커를 만든다", () => {
    const g = sumChartGeometry(dist, 150);
    expect(g?.marker).toEqual({ x: CHART_WIDTH / 2, label: "내 합계 150" });
  });
});
```

```bash
pnpm --filter web exec vitest run src/modules/statistics/view/statistics.presenter.test.ts
```

Expected: FAIL — `Failed to resolve import "./statistics.presenter"`.

- [ ] **Step 8: Presenter를 만든다 (탭 상태 + 8개 서브뷰 props)**

`apps/web/src/modules/statistics/view/statistics.presenter.ts`:

```ts
"use client";
import { useEffect, useState } from "react";
import type { TabItem } from "@/shared/ui/tabs";
import { useGetStatisticsAction } from "../action";
import type {
  FrequencyHeatmapProps,
  HotColdBoardProps,
  NumberFrequencyBarsProps,
  PatternDistributionProps,
  ProbabilityRealityProps,
  RecentGridProps,
  SumDistributionChartProps,
  TopPairsListProps,
} from "./component";

export type StatView =
  | "probability"
  | "sum"
  | "heatmap"
  | "pattern"
  | "hotcold"
  | "pairs"
  | "frequency"
  | "recent";

/** 8개를 동등하게 나열한다 — 요약/우선순위 압축 없음 */
const STAT_VIEWS: readonly TabItem<StatView>[] = [
  { key: "probability", label: "확률 현실" },
  { key: "sum", label: "합계 분포" },
  { key: "heatmap", label: "히트맵" },
  { key: "pattern", label: "패턴 분포" },
  { key: "hotcold", label: "핫/콜드" },
  { key: "pairs", label: "상위 페어" },
  { key: "frequency", label: "빈도 바" },
  { key: "recent", label: "최근 그리드" },
];

const HOT_COLD_TOP = 8;
export const CHART_WIDTH = 560;
export const CHART_HEIGHT = 140;

/**
 * 합계 분포 차트의 축·눈금 계산 — 데이터가 아니라 그리기 좌표라서 Presenter 소관이다.
 * 단위 테스트 대상이라 export하지만 `view/index.ts` 배럴에는 넣지 않는다.
 */
export function sumChartGeometry(
  dist: { sum: number; count: number }[],
  mySum: number | null,
): SumDistributionChartProps["geometry"] {
  const first = dist[0];
  const last = dist[dist.length - 1];
  if (!first || !last) return null;

  const minSum = first.sum;
  const maxSum = last.sum;
  const maxCount = Math.max(...dist.map((d) => d.count));
  const x = (sum: number) => ((sum - minSum) / Math.max(1, maxSum - minSum)) * CHART_WIDTH;
  const y = (count: number) => CHART_HEIGHT - (count / maxCount) * (CHART_HEIGHT - 10);

  return {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    bars: dist.map(({ sum, count }) => ({
      sum,
      x: x(sum),
      y: y(count),
      height: CHART_HEIGHT - y(count),
    })),
    marker: mySum === null ? null : { x: x(mySum), label: `내 합계 ${mySum}` },
    minSumLabel: String(minSum),
    maxSumLabel: String(maxSum),
  };
}

export interface StatisticsTabsBundle {
  items: readonly TabItem<StatView>[];
  active: StatView;
  onChange: (key: StatView) => void;
  variant: "chip";
  label: string;
}

export interface StatisticsViewsBundle {
  probability: ProbabilityRealityProps;
  sum: SumDistributionChartProps;
  heatmap: FrequencyHeatmapProps;
  pattern: PatternDistributionProps;
  hotcold: HotColdBoardProps;
  pairs: TopPairsListProps;
  frequency: NumberFrequencyBarsProps;
  recent: RecentGridProps;
}

export function useStatisticsPresenter(ctx: { myNumbers: number[] | null }): {
  tabs: StatisticsTabsBundle;
  active: StatView;
  views: StatisticsViewsBundle | null;
  status: { error: string | null; loading: boolean };
} {
  const action = useGetStatisticsAction();
  const { load } = action;
  const [activeStatView, setActiveStatView] = useState<StatView>("probability");

  useEffect(() => {
    void load();
  }, [load]);

  const vm = action.status === "success" ? action.data : null;
  const tabs: StatisticsTabsBundle = {
    items: STAT_VIEWS,
    active: activeStatView,
    onChange: setActiveStatView,
    variant: "chip",
    label: "통계 항목",
  };
  const status = {
    error: action.status === "error" ? action.error : null,
    loading: action.status === "idle" || action.status === "loading",
  };

  if (!vm) return { tabs, active: activeStatView, views: null, status };

  const rarity = ctx.myNumbers ? vm.rarityOf(ctx.myNumbers) : null;
  const sumPosition = ctx.myNumbers ? vm.sumPositionOf(ctx.myNumbers) : null;

  return {
    tabs,
    active: activeStatView,
    status,
    views: {
      probability: {
        totalCombinationsLabel: vm.totalCombinationsLabel,
        facts: vm.probabilityFacts,
      },
      sum: {
        subtitle: sumPosition
          ? `내 조합 합계 ${sumPosition.mySum} — 과거 회차의 ${sumPosition.percentBelow}%가 이보다 작았습니다`
          : "전 회차 6개 번호 합계의 분포",
        geometry: sumChartGeometry(vm.sumDistribution, sumPosition?.mySum ?? null),
      },
      heatmap: {
        subtitle: `전 ${vm.totalDrawsLabel}회차 · 글로우가 강할수록 많이 나온 번호`,
        cells: vm.frequencyCells,
      },
      pattern: {
        subtitle: rarity
          ? `내 조합(${rarity.label})과 같은 홀짝 패턴은 과거 회차의 ${rarity.percent}%였습니다`
          : "내 조합이 과거 패턴과 얼마나 닮았는지 확인하세요",
        groups: vm.patternGroupsFor(ctx.myNumbers),
      },
      hotcold: {
        coldest: vm.coldest(HOT_COLD_TOP),
        hottest: vm.hottest(HOT_COLD_TOP),
      },
      pairs: { rows: vm.topPairRows },
      frequency: { bars: vm.frequencyBars },
      recent: { subtitle: vm.recentGridSubtitle, columns: vm.recentGridColumns },
    },
  };
}
```

```bash
pnpm --filter web exec vitest run src/modules/statistics/view/statistics.presenter.test.ts
```

Expected: PASS — 4 tests.

- [ ] **Step 9: 대표 View를 만든다 (조건부 렌더와 룩업 맵만)**

`apps/web/src/modules/statistics/view/statisticsPanel.tsx`:

```tsx
"use client";
import type { ReactNode } from "react";
import { Tabs } from "@/shared/ui/tabs";
import {
  FrequencyHeatmap,
  HotColdBoard,
  NumberFrequencyBars,
  PatternDistribution,
  ProbabilityReality,
  RecentGrid,
  SumDistributionChart,
  TopPairsList,
} from "./component";
import { useStatisticsPresenter, type StatView } from "./statistics.presenter";

export interface StatisticsPanelProps {
  /** 현재 조합 — 분포 위 내 위치 마커에 사용 */
  myNumbers: number[] | null;
}

export function StatisticsPanel(props: StatisticsPanelProps) {
  const p = useStatisticsPresenter(props);

  if (p.status.error) {
    return <p className="text-sm text-red-600">통계를 불러오지 못했습니다: {p.status.error}</p>;
  }
  if (!p.views) return <p className="text-sm text-slate-500">통계 계산 중…</p>;

  const panels: Record<StatView, ReactNode> = {
    probability: <ProbabilityReality {...p.views.probability} />,
    sum: <SumDistributionChart {...p.views.sum} />,
    heatmap: <FrequencyHeatmap {...p.views.heatmap} />,
    pattern: <PatternDistribution {...p.views.pattern} />,
    hotcold: <HotColdBoard {...p.views.hotcold} />,
    pairs: <TopPairsList {...p.views.pairs} />,
    frequency: <NumberFrequencyBars {...p.views.frequency} />,
    recent: <RecentGrid {...p.views.recent} />,
  };

  return (
    <div className="space-y-4">
      <Tabs {...p.tabs} />
      <div role="tabpanel">{panels[p.active]}</div>
    </div>
  );
}
```

`apps/web/src/modules/statistics/view/index.ts`:

```ts
export * from "./statisticsPanel";
```

- [ ] **Step 10: 공개 배럴 갱신 + 구 파일 삭제**

`apps/web/src/modules/statistics/index.ts`:

```ts
export { StatisticsPanel, type StatisticsPanelProps } from "./view";
export type { StatisticsModel } from "./model";
```

```bash
cd "$(git rev-parse --show-toplevel)"
rm -rf apps/web/src/modules/statistics/api apps/web/src/modules/statistics/transport \
       apps/web/src/modules/statistics/viewmodel
rm apps/web/src/modules/statistics/view/frequency-heatmap.tsx \
   apps/web/src/modules/statistics/view/hot-cold-board.tsx \
   apps/web/src/modules/statistics/view/number-frequency-bars.tsx \
   apps/web/src/modules/statistics/view/pattern-distribution.tsx \
   apps/web/src/modules/statistics/view/probability-reality.tsx \
   apps/web/src/modules/statistics/view/recent-grid.tsx \
   apps/web/src/modules/statistics/view/statistics-panel.tsx \
   apps/web/src/modules/statistics/view/sum-distribution-chart.tsx \
   apps/web/src/modules/statistics/view/top-pairs-list.tsx
```

- [ ] **Step 11: 검증**

```bash
pnpm --filter web test && pnpm --filter web lint && pnpm --filter web build
```

Expected: 전부 통과. 구 `presenters.test.ts`가 사라지고 `statistics.viewmodel.test.ts`(8) + `statistics.presenter.test.ts`(4)로 나뉜다.

- [ ] **Step 12: 커밋**

```bash
git add apps/web/src/modules/statistics
git commit -m "refactor(statistics): 8개 서브뷰를 view/component로 이동 + 파생값을 ViewModel로 이관"
```

---

## Task 11: App 셸 — `home.presenter.ts` + `page.tsx`

7개 모듈의 공개 표면이 확정된 뒤에야 조립할 수 있으므로 마지막이다.

**스펙 §2.2 번들과의 대응:** `identity`·`results`는 props가 없어 번들이 없다. 대신 셸 자체의 상태 슬롯(`generatorOpen` · `tabs` · `activeTab`)이 번들에 들어간다.

**Files:**
- Create: `apps/web/src/app/home.presenter.ts`
- Modify: `apps/web/src/app/page.tsx`

---

- [ ] **Step 1: Presenter를 만든다 (셸 상태 3개를 소유)**

`apps/web/src/app/home.presenter.ts`:

```ts
"use client";
import { useState } from "react";
import type { GeneratorCardProps } from "@/modules/generator";
import type { LotterietusCardProps } from "@/modules/lotterietus";
import type { PicksCardProps } from "@/modules/picks";
import type { SimulationCardProps } from "@/modules/simulation";
import type { StatisticsPanelProps } from "@/modules/statistics";
import type { TabItem } from "@/shared/ui/tabs";

export type TabKey = "statistics" | "simulation" | "picks" | "results";

/** 각 카드의 기존 title을 탭 라벨로 그대로 사용 */
const TABS: readonly TabItem<TabKey>[] = [
  { key: "statistics", label: "통계" },
  { key: "simulation", label: "시뮬레이션" },
  { key: "picks", label: "내 번호" },
  { key: "results", label: "결과 확인" },
];

export interface HomeTabsBundle {
  items: readonly TabItem<TabKey>[];
  active: TabKey;
  onChange: (key: TabKey) => void;
  label: string;
}

/**
 * App 셸 Presenter — 모듈 간 데이터 흐름(현재 조합)과 화면 전환 상태를 중개한다.
 * `identity`·`results`는 props가 없어 번들이 없다.
 */
export function useHomePresenter(): {
  lotterietus: LotterietusCardProps;
  generatorOpen: boolean;
  generator: GeneratorCardProps;
  tabs: HomeTabsBundle;
  activeTab: TabKey;
  picks: PicksCardProps;
  simulation: SimulationCardProps;
  statistics: StatisticsPanelProps;
} {
  const [currentNumbers, setCurrentNumbers] = useState<number[] | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("statistics");

  return {
    lotterietus: {
      generatorOpen: isGeneratorOpen,
      onToggleGenerator: () => setIsGeneratorOpen((open) => !open),
    },
    generatorOpen: isGeneratorOpen,
    generator: { onGenerated: setCurrentNumbers },
    tabs: { items: TABS, active: activeTab, onChange: setActiveTab, label: "주요 화면" },
    activeTab,
    picks: { currentNumbers },
    simulation: { numbers: currentNumbers },
    statistics: { myNumbers: currentNumbers },
  };
}
```

- [ ] **Step 2: `page.tsx`를 조립만 하도록 다시 쓴다**

`apps/web/src/app/page.tsx`:

```tsx
"use client";
// 라우트 = 모듈 조립만 (경계 규칙). 상태와 번들 조립은 전부 home.presenter.ts에 있다.
import type { ReactNode } from "react";
import { GeneratorCard } from "@/modules/generator";
import { IdentityBadge } from "@/modules/identity";
import { LotterietusCard } from "@/modules/lotterietus";
import { PicksCard } from "@/modules/picks";
import { ResultsCard } from "@/modules/results";
import { SimulationCard } from "@/modules/simulation";
import { StatisticsPanel } from "@/modules/statistics";
import { Tabs } from "@/shared/ui/tabs";
import { useHomePresenter, type TabKey } from "./home.presenter";

export default function HomePage() {
  const p = useHomePresenter();

  const panels: Record<TabKey, ReactNode> = {
    statistics: <StatisticsPanel {...p.statistics} />,
    simulation: <SimulationCard {...p.simulation} />,
    picks: <PicksCard {...p.picks} />,
    results: <ResultsCard />,
  };

  return (
    <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            로또랩 <span className="text-emerald-600">Lotto Lab</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            사기 전에, 데이터로 확인하세요. 과거 통계는 미래 당첨 확률을 높이지 않습니다 — 저희는
            그 사실부터 정직하게 보여드립니다.
          </p>
        </div>
        <IdentityBadge />
      </header>

      <LotterietusCard {...p.lotterietus} />

      {p.generatorOpen ? (
        <div className="mt-4">
          <GeneratorCard {...p.generator} />
        </div>
      ) : null}

      <div className="mt-8">
        <Tabs {...p.tabs} />
      </div>

      <div role="tabpanel" className="mt-4">
        {panels[p.activeTab]}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 검증**

```bash
pnpm --filter web test && pnpm --filter web lint && pnpm --filter web build
```

Expected: 전부 통과.

- [ ] **Step 4: 앱을 띄워 MVP 기능 6종을 손으로 확인한다**

```bash
docker compose up -d
pnpm dev
```

`http://localhost:3000` 에서 확인:
1. Hero에 최근 회차 번호와 **1초마다 줄어드는 카운트다운**이 보인다.
2. "번호 생성하기" → 자동/부분/직접 3모드가 동작하고 6개 공이 나온다.
3. 통계 탭 8개가 전부 렌더된다(확률 현실 · 합계 분포 · 히트맵 · 패턴 분포 · 핫/콜드 · 상위 페어 · 빈도 바 · 최근 그리드).
4. 시뮬레이션 탭에서 "과거 전 회차 대입" → 요약 문장과 등수 칩이 나온다.
5. 내 번호 탭에서 저장 → 목록에 즉시 나타나고, 삭제 → 즉시 사라진다.
6. 결과 확인 탭에서 "당첨 대조" → 회차 번호와 등수 라벨이 나온다.

확인 후 `Ctrl+C`, `docker compose down`.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/app
git commit -m "refactor(app): home.presenter로 셸 상태 이관 — page.tsx는 모듈 조립만"
```

---

## Task 12: 잔재 제거 검증과 `CLAUDE.md` 갱신

**Files:**
- Modify: `CLAUDE.md`

---

- [ ] **Step 1: 완료 기준을 기계적으로 검증한다**

```bash
cd "$(git rev-parse --show-toplevel)"
echo "--- 구 폴더가 남아 있는가 (기대: 없음) ---"
find apps/web/src/modules -type d \( -name api -o -name viewmodel -o -name transport \)
echo "--- kebab-case 파일이 남아 있는가 (기대: 없음) ---"
find apps/web/src/modules apps/web/src/app -name "*-*.ts" -o -name "*-*.tsx" | grep -v node_modules
echo "--- map 접두 mapper가 남아 있는가 (기대: 없음) ---"
grep -rn "export function map[A-Z]" apps/web/src
echo "--- Assembler 용어가 남아 있는가 (기대: 없음) ---"
grep -rni "assembler" apps/web/src
echo "--- view가 DTO·mapper를 보는가 (기대: 없음) ---"
grep -rn "contract\|/mapper" apps/web/src/modules/*/view
echo "--- 인스턴스 화살표 프로퍼티가 있는가 (기대: 없음) ---"
grep -rn "^\s*[a-zA-Z]* = (.*) =>" apps/web/src/modules/*/model/*.viewmodel.ts
echo "--- 배럴이 전부 있는가 ---"
for d in apps/web/src/modules/*/; do
  for sub in action model mapper view view/component; do
    [ -d "$d$sub" ] && [ ! -f "$d$sub/index.ts" ] && echo "배럴 없음: $d$sub"
  done
done
echo "검증 끝"
```

Expected: `find`/`grep` 결과가 전부 비어 있고 "배럴 없음" 줄이 없다.
(`shared/lib/lotto-colors.ts`는 모듈 밖이라 kebab-case 검사 대상이 아니다 — 위 `find`가 `apps/web/src/modules`와 `apps/web/src/app`만 훑는 이유다.)

- [ ] **Step 2: `CLAUDE.md`의 프론트 관련 3개 절을 다시 쓴다**

`## 아키텍처: Next.js 위의 Lean Hexagonal` 절의 폴더 구조 블록에서 **`apps/web/src/` 부분만** 아래로 교체한다(`packages/core/src/<domain>/` 부분은 백엔드 v4 전환 계획에서 다룬다):

````markdown
```
apps/web/src/
├─ app/
│  ├─ page.tsx               라우트 — 모듈 조립만, 로직 없음
│  ├─ home.presenter.ts      셸 상태(currentNumbers·isGeneratorOpen·activeTab)
│  └─ api/<domain>/route.ts  HTTP 입구 — core의 application/infrastructure를 import할 수 있는 유일한 곳
├─ modules/<domain>/         View·Presenter·Action 삼각형 — 각 폴더에 index.ts 배럴
│  ├─ view/                  *Card·*Panel 컴포넌트(로직 0) + <domain>.presenter.ts
│  │  └─ component/          그 View 전용 자식 컴포넌트
│  ├─ action/                use*Action — 서버 상태(ActionState<T>) + Model→ViewModel 승격
│  ├─ mapper/                <domain>.mapper.ts — DTO를 import하는 유일한 폴더
│  ├─ model/                 *.model.ts(interface) + *.viewmodel.ts(class, 파생값 getter)
│  └─ index.ts               모듈의 유일한 공개 진입점
├─ server/                   컴포지션 루트 — 포트에 어댑터를 주입 (container.ts)
└─ shared/                   ui(디자인 시스템), lib(fetcher · actionState · lotto-colors)

packages/contract/src/<domain>/   DTO만 — FE·BE의 유일한 공유 지점
```
````

`### 모델 타입 용어` 표를 아래로 교체한다:

````markdown
### 모델 타입 용어 (이름 자체가 규칙이므로 임의로 다른 이름을 쓰지 않는다)

| 계층 | 타입 | 이름 규칙 | 역할 |
|---|---|---|---|
| Client | **View** | `*Card` / `*Panel` | JSX 레이아웃 + 번들 spread. **로직 0** |
| Client | **Presenter** | `use*Presenter` (`view/<domain>.presenter.ts`) | React 상태 해석, 자식별 props 번들 조립, Action 간 순서 조합, `now` 의존 값 |
| Client | **Action** | `use*Action` (`action/<verb><Noun>.action.ts`) | 서버 상태(`ActionState<T>`) 소유 + **Model↔ViewModel 경계의 유일한 통과 지점** |
| Client | **ViewModel** | `*ViewModel` (class) | `implements Model`. 파생값을 prototype getter로 소유 (`savedAtLabel`·`rankLabel`·`canGenerate`…) |
| Frontend | **Model** | `*Model` (interface) | ViewModel이 구현하는 계약; 로직 없음 |
| 전송 | **Mapper** | `<verb><Noun>Request` / `<verb><Noun>Response` | Model↔DTO 변환. 어간 = 짝 Action 훅에서 `use`·`Action`을 뗀 것 |
| 공유 | **DTO** | `*Request` / `*Response` | `packages/contract` — 클라이언트 무관 와이어 계약 |
| Backend 조합 | **VO** | `*VO` | 도메인 데이터를 조합·검증 (예: `CombinationVO` = 6개·1~45·중복 없음) |
| 영속 | **Entity** | `*Entity` | DB 테이블과 1:1, 단일 책임 |
| 파생 | **ReadModel** | `*ReadModel` | 순수 계산, 비영속 (통계·백테스트) |
| 인프라 | **Adapter** | `*Adapter` | 헥사고날 포트 구현체 전용 — 이 이름은 이 용도로만 예약됨 |

**ViewModel 작성 규칙:** 파생값은 저장 필드가 아니라 getter · 상수 lookup은 `static readonly` ·
메서드는 반드시 prototype 메서드(`method() {}`, 인스턴스 화살표 프로퍼티 금지) · 인스턴스 상태를
쓰지 않는 함수는 `static` · 저장 필드는 서버 원본과 UI 상태에만 허용.

**Presenter 정책:** 하나의 Presenter는 오직 하나의 View만 담당하고, 모듈 대표 View는 예외 없이 자기
Presenter를 갖는다. 자식 컴포넌트는 자기 소유 상태나 서버 데이터가 생기는 시점에만 Presenter를 갖는다.
````

`### import 경계 규칙` 절을 아래로 교체한다:

````markdown
### import 경계 규칙 — `apps/web/eslint.config.mjs`로 강제, lint 위반 = 빌드 실패

1. `modules/**`는 백엔드 내부(`core`의 `domain`/`application`/`infrastructure`/`shared`)와
   `@/server/*`를 import할 수 없다. FE는 계약(`@fortuna-lottery/contract`)과 HTTP만 쓴다.
2. `view/**`(및 `view/component/**`)는 자기 모듈의 `action/**` · `model/**`(+같은 폴더의
   `*.presenter.ts`) + `shared/ui` · `shared/lib`만 import한다. **`mapper/**`·DTO 직접 import 금지.**
3. **오직 `action/**`만 `mapper/**`를 import한다.**
4. **오직 `mapper/**`만 DTO를 값으로 import한다.** `action/**`은 fetcher 제네릭에 넘길 **타입 import만** 허용.
5. 모듈 간 소통은 공개 `index.ts`로만(deep import 금지). `app/`은 모듈 조립만, 로직 금지
   (셸 상태는 `app/home.presenter.ts`가 소유).
6. 폴더 밖에서는 배럴 경로로만 import하고, 같은 폴더 안에서는 형제 파일을 직접 import한다
   (순환 방지 — lint가 아니라 코드 리뷰 컨벤션으로 지킨다).
````

`## TDD` 절의 마지막 경로 예시를 갱신한다:

```markdown
구현 전에 대상 파일 옆에 `*.test.ts`를 먼저 작성한다 (`packages/core/src/**`,
`apps/web/src/modules/**/model/*.viewmodel.test.ts`, `.../mapper/*.mapper.test.ts`,
`.../view/*.presenter.test.ts` 아래 기존 `*.test.ts` 파일들 참고).
```

`## 명령어` 절의 테스트 개수 설명을 갱신한다:

```markdown
pnpm test     # turbo test — packages/core (vitest) + apps/web (vitest, jsdom 환경)
```

`## 설계 문서` 목록(파일 상단)에 보정 문서를 추가한다:

```markdown
- `docs/superpowers/specs/2026-08-08-fortuna-lottery-client-architecture-v3-refinement-design.md` — v3 보정: 프론트 View·Presenter·Action + class ViewModel (현재 프론트 구조의 SSOT)
```

- [ ] **Step 3: 전체 검증**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: 전부 통과.

- [ ] **Step 4: 커밋**

```bash
git add CLAUDE.md
git commit -m "docs(CLAUDE.md): 프론트 구조를 v3 보정(View·Presenter·Action·class ViewModel) 기준으로 갱신"
```

---

## 완료 기준 체크리스트 (스펙 §13)

Task 12 Step 1의 검증 스크립트가 아래를 기계적으로 확인한다. 스크립트로 확인되지 않는 항목은 코드 리뷰로 본다.

- [ ] 7개 모듈이 `action/model/mapper/view/index.ts` 구조이고 `viewmodel/`·`api/`·`transport/`가 사라졌다 — *스크립트*
- [ ] 모든 Action의 반환 타입이 `ActionState<ViewModel>`이다 (`useDeletePickAction`의 `ActionState<void>`만 예외) — *리뷰*
- [ ] 대표 View 7개 + App 셸이 각각 자기 Presenter를 갖고, View 파일에 레이아웃과 번들 spread 외에 로직이 없다 — *리뷰*
- [ ] 모든 ViewModel이 class이고 §3.2 표의 파생값이 전부 이동했으며 인스턴스 화살표 프로퍼티가 없다 — *스크립트*
- [ ] `statistics`의 8개 서브뷰가 `view/component/`로 이동했다 — *스크립트*
- [ ] 각 폴더에 배럴이 있다 — *스크립트*
- [ ] mapper 어간이 짝 Action 훅과 일치하고 `map` 접두가 사라졌다 — *스크립트*
- [ ] `view`에 mapper·DTO import가 0이고 `mapper`는 `action`에서만 import된다 — *ESLint*
- [ ] 전 모듈 파일이 camelCase + 점 구분 접미사를 따른다 (`page.tsx`/`index.ts` 예외) — *스크립트*
- [ ] MVP 기능 6종이 리팩터 후 동일하게 동작한다 — *Task 11 Step 4 수동 확인*
- [ ] `pnpm test` · `pnpm lint` · `pnpm build` 통과 — *Task 12 Step 3*
- [ ] `CLAUDE.md`가 갱신됐다 — *Task 12 Step 2*

---

## 다음 계획

이 계획이 끝나면 동반 계획 `2026-08-08-backend-architecture-v4.md`(백엔드 v4 · NestJS 4계층 전환)를 실행한다.
그 계획의 **1단계(`packages/contract` 분리)는 이 계획의 Task 1에서 이미 끝나 있다** — 백엔드 계획은 그 사실을 전제로 Task 1에서 확인만 한다.




