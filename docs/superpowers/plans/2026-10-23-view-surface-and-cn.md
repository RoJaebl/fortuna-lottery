# 뷰 공개 표면 정리와 서식 도구(`tv`·`cn`) 도입 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자식 뷰 `index.tsx` 가 내보내던 모델 타입을 지운다. 서식 도구 `tv`(tailwind-variants)와 `cn`(clsx + tailwind-merge)을 `shared/lib/style/` 에 들이고, 조건으로 갈리는 className 을 화면 곁 `<화면>.styles.ts` 의 variants 로 옮긴다.

**Architecture:**
- 모델 타입 내보내기는 `modules/` 배럴 시절의 잔재라 지운다. 뷰 폴더는 밖에 뷰만 보인다.
- 서식 도구는 editor 저장소와 같은 셋이다(`clsx`·`tailwind-merge`·`tailwind-variants`). 쓰는 꼴도 editor 를 따른다.
  - 서식은 화면 곁의 `<화면>.styles.ts` 가 `tv({ slots, variants })` 로 정의하고, 화면은 `s.slot({ … })` 를 부르기만 한다.
  - `cn` 은 부모가 내린 `className` 을 자기 기본값과 합칠 때만 쓴다.
- editor 와 다른 점이 하나 있다. tailwind-merge 에 이 저장소의 토큰 이름을 알리는 설정 `twMergeConfig` 를 `cn` 과 `tv` 가 함께 쓴다.
  - editor 는 `tv` 를 `tailwind-variants` 에서 바로 가져와 그 설정이 `tv` 안의 합치기에 닿지 않는다.
  - 이 저장소는 `tv` 를 `createTV({ twMergeConfig })` 로 내고, 다른 자리에서 두 라이브러리를 직접 가져오지 못하게 ESLint 로 막는다.
- 폴더 구조는 골조 그대로다. 서식 파일은 소유물이 아니라 presenter 처럼 뷰 곁에 서는 파일이다. 새 폴더를 만들지 않고, 서식 파일이 생겨도 뷰를 승격하지 않는다.

**Tech Stack:** Next.js · Tailwind CSS 4.3.2 · clsx 2.1.1 · tailwind-merge 3.7.0 · tailwind-variants 3.3.1 · vitest · ESLint

**Spec:** 따로 없다. 결정은 2026-10-23 대화에서 했다.
- 본보기: editor 저장소의 `apps/web/src/shared/lib/cn.ts`(토큰 실측 주석), `apps/web/src/shared/ui/refBadge.styles.ts`(slots·variants 꼴, variants 차례가 승패를 정한다는 실측), `apps/web/src/shared/ui/button.styles.ts`(두 화면이 실제로 나눠 쓰는 것만 공용으로 올린다).
- 서식 파일 이름: [frontend-module-layout §10 파일 이름 — 역할을 점 접미로 적는다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md#10-파일-이름--역할을-점-접미로-적는다>)의 서식 `<화면>.styles.ts`.
- 서식 파일의 자리: [fractal-view-promotion §3 소유물의 자리 — 소비자를 세어 정한다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/fractal-view-promotion.md#3-소유물의-자리--소비자를-세어-정한다>). 한 뷰만 쓰면 그 뷰 곁, 화면 모듈을 넘어 나눠 쓰면 `shared/ui`.
- 이름이 쓰는 화면과 어긋나는 사례: [fractal-view-promotion 「소유물을 뷰 폴더 안으로 내린 이유」](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/fractal-view-promotion.md#소유물을-뷰-폴더-안으로-내린-이유>)의 `FileView.styles.ts`.
- 뷰 폴더의 공개 표면: [fractal-view-promotion §6 공개 표면 — 폴더 밖에서는 `index` 만 본다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/fractal-view-promotion.md#6-공개-표면--폴더-밖에서는-index-만-본다>).

## 세울 폴더 구조

```
apps/web/src/
  shared/lib/style/
    cn.ts            cn · twMergeConfig          @lib/style/cn
    tv.ts            tv = createTV({ twMergeConfig })   @lib/style/tv
  shared/ui/
    ball.tsx · ball.styles.ts
    card.tsx · card.styles.ts
    tabs.tsx · tabs.styles.ts
  app/(home)/
    GeneratorCard/    index.tsx · GeneratorCard.presenter.ts · GeneratorCard.styles.ts · _action/ _mapper/ _model/
    ResultsCard/      index.tsx · ResultsCard.presenter.ts · ResultsCard.styles.ts · …
    SimulationCard/   index.tsx · SimulationCard.presenter.ts · SimulationCard.styles.ts · …
    StatisticsPanel/
      index.tsx · StatisticsPanel.presenter.ts
      PatternDistribution.tsx · PatternDistribution.styles.ts   파일 뷰 곁에 둔다. 승격하지 않는다
```

## Global Constraints

- 매 Task 끝에 `pnpm check` 가 통과한다(typecheck → lint → lint:deps → lint:side-effects → test → test:tools).
- 새 의존 패키지는 `apps/web` 의 `dependencies` 에 셋만 고정 판본으로 들인다: `clsx` `2.1.1`, `tailwind-merge` `3.7.0`, `tailwind-variants` `3.3.1`(editor 와 같은 판본).
- 도구의 자리와 이름:
  - `apps/web/src/shared/lib/style/cn.ts`: `cn(...inputs: ClassValue[]): string` 과 `twMergeConfig` 를 낸다. 화면 쪽에서 가져오는 이름은 `@lib/style/cn`.
  - `apps/web/src/shared/lib/style/tv.ts`: `tv` 를 낸다. 화면 쪽에서 가져오는 이름은 `@lib/style/tv`.
  - `shared/ui` 안에서는 같은 `shared/` 안이므로 `../lib/style/tv`·`../lib/style/cn` 으로 가져온다(`ball.tsx` 의 `../lib/lotto-colors` 와 같은 꼴).
  - `tailwind-variants`·`tailwind-merge` 를 직접 가져오는 것은 이 두 파일뿐이다.
- tailwind-merge 에 알릴 토큰 이름은 `apps/web/src/app/globals.css` 의 `@theme inline` 이 정한 것 그대로다.
  - 글자 크기(`text-*`): `display`·`head`·`sub`·`read`·`body`·`small`·`micro`·`nano`
  - 모서리(`rounded-*`): `panel`·`card`·`box`·`button`·`pill`
  - 색(`bg-*`·`text-*`·`border-*`·`ring-*`)은 Task 2 시험으로 잰다. 기본 설정이 이미 색으로 읽으면 알리지 않는다.
- 서식 파일은 `<화면>.styles.ts` 이고, 그 화면 곁에 선다. 폴더 뷰는 폴더 이름을 쓴다(`GeneratorCard/index.tsx` 의 서식은 `GeneratorCard/GeneratorCard.styles.ts`). 내보내는 이름은 화면 이름의 camelCase 하나다(`generatorCard`, `ball`).
- 공용 서식 부품(조각 없이 서식만 있는 `shared/ui/*.styles.ts`)은 이번에 만들지 않는다. 생성기·시뮬레이션의 버튼 서식이 비슷해도 같은 화면 모듈 안이라 화면마다 따로 둔다. 같은 서식을 두 번째 화면이 쓰는 날 공통 조상으로 올린다.
- 이번에 `tv` 로 옮기는 것은 조건으로 갈리는 className 과 `shared/ui` 셋(`ball`·`card`·`tabs`)이다. 조건 없는 정적 `className="…"` 은 그대로 둔다.
- 화면에 걸리는 클래스 묶음은 바뀌지 않는다. 바뀌어도 되는 것은 문자열의 공백과 차례뿐이다. 서식 시험은 클래스를 `split(" ")` 한 집합으로 견준다.
- 코드 주석은 한국어, -다 말투. 커밋 메시지는 `refactor(web):`·`feat(web):`·`chore(checks):`·`docs:` 접두에 한국어 본문, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **글자 크기 토큰이 색으로 읽혀 지워진다.** `text-small` 을 tailwind-merge 가 색으로 읽으면 같은 자리의 `text-muted` 와 한 갈래로 묶여 `text-small` 이 사라진다. 글자가 기본 크기로 커진다. `cn` 에서도 `tv` 안에서도 같다. Task 2 시험 둘이 잡는다.
2. **부모가 내린 className 이 기본값을 이기지 못한다.** `Card` 에 `className="p-3"` 을 내려도 `p-5` 가 함께 남으면 어느 쪽이 걸릴지 CSS 차례가 정한다. Task 3 시험이 잡는다.
3. **variant 의 거짓 갈래가 빠진다.** 지금 화면은 조건이 거짓일 때도 클래스를 건다(`bg-said text-text hover:bg-inset`, `text-muted`, `bg-accent/70`). `tv` 의 boolean variant 는 `false` 키를 적지 않으면 거짓일 때 아무것도 걸지 않는다. Task 3·4 의 서식 시험이 참·거짓 두 갈래를 모두 견준다.
4. **탭의 `compoundVariants` 가 slot 에 닿지 않는다.** 탭은 `variant` 와 `selected` 의 짝마다 `item` 클래스가 다르다. 짝 넷이 모두 지금 화면과 같은 묶음을 내야 한다. Task 3 시험이 잡는다.
5. **`tailwind-variants` 를 직접 가져와 토큰 설정이 빠진다, 또는 서식 이름이 쓰는 화면과 어긋난다.** 앞의 것은 Task 2 의 ESLint 규칙이, 뒤의 것은 Task 5 의 ESLint 규칙이 위반 표본과 함께 잡는다.

---

### Task 1: 자식 뷰 `index.tsx` 의 모델 타입 내보내기를 지운다

**Files:**
- Modify: `apps/web/src/app/(home)/{GeneratorCard,HypothesisLab,LotterietusCard,PicksCard,ResultsCard,SimulationCard,StatisticsPanel}/index.tsx` — 파일 끝의 `export type { … } from "./_model/…";` 줄을 모두 지운다.

- [ ] **Step 1: 바깥에서 쓰는 곳이 없음을 확인한다**

Run: `git grep -nE "from \"(\./|\.\./)?(GeneratorCard|HypothesisLab|LotterietusCard|PicksCard|ResultsCard|SimulationCard|StatisticsPanel)\"" -- apps/web/src`
Expected: `app/(home)/page.tsx` 의 뷰 import 일곱 줄뿐이다. 모델·표시 모델 타입 이름을 가져오는 줄이 없다.

- [ ] **Step 2: 일곱 파일에서 `export type` 줄을 지운다.** 뷰 함수 `export function …` 은 그대로 둔다.

- [ ] **Step 3: 확인한다** — `git grep -n "export type" -- "apps/web/src/app/(home)/*/index.tsx"` → 0, `pnpm check` 통과.

- [ ] **Step 4: 커밋한다** — `refactor(web): 자식 뷰의 공개 표면에서 모델 타입 내보내기를 걷어낸다`

---

### Task 2: 서식 도구 `cn`·`tv` 를 `shared/lib/style/` 에 들인다

**Files:**
- Modify: `apps/web/package.json`(의존 셋), `pnpm-lock.yaml`, `apps/web/eslint.config.mjs`, `tools/checks/run-violations.sh`
- Create: `apps/web/src/shared/lib/style/cn.ts`, `apps/web/src/shared/lib/style/tv.ts`, `tools/checks/` 아래 위반 표본 하나
- Test: `apps/web/src/shared/lib/style/cn.test.ts`, `apps/web/src/shared/lib/style/tv.test.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string`·`twMergeConfig`(`@lib/style/cn`), `tv`(`@lib/style/tv`, `tailwind-variants` 의 `tv` 와 같은 서명). Task 3·4 가 쓴다.

- [ ] **Step 1: 의존을 들인다** — `pnpm --filter @fortuna-lottery/web add clsx@2.1.1 tailwind-merge@3.7.0 tailwind-variants@3.3.1 --save-exact`

- [ ] **Step 2: 실패하는 시험을 쓴다**

`cn.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("거짓 값은 지우고 빈 칸을 남기지 않는다", () => {
    expect(cn("p-5", false, undefined, null, "", "font-bold")).toBe("p-5 font-bold");
  });
  it("같은 갈래는 뒤엣것이 이긴다", () => {
    expect(cn("p-5", "p-3")).toBe("p-3");
    expect(cn("bg-panel", "bg-raised")).toBe("bg-raised");
  });
  it("글자 크기 토큰끼리는 뒤엣것이 이긴다", () => {
    expect(cn("text-small", "text-micro")).toBe("text-micro");
    expect(cn("text-display", "text-nano")).toBe("text-nano");
  });
  it("글자 크기 토큰과 색은 함께 남는다", () => {
    expect(cn("text-small", "text-muted")).toBe("text-small text-muted");
    expect(cn("text-nano", "font-bold", "text-warn")).toBe("text-nano font-bold text-warn");
  });
  it("모서리 토큰끼리는 뒤엣것이 이긴다", () => {
    expect(cn("rounded-card", "rounded-box")).toBe("rounded-box");
    expect(cn("rounded-full", "rounded-pill")).toBe("rounded-pill");
  });
  it("두께와 색은 함께 남는다", () => {
    expect(cn("border-b-2", "border-text")).toBe("border-b-2 border-text");
    expect(cn("ring-2", "ring-text")).toBe("ring-2 ring-text");
  });
});
```

`tv.test.ts` — `tv` 안의 합치기도 같은 설정을 받는지 본다:

```ts
import { describe, expect, it } from "vitest";
import { tv } from "./tv";

const probe = tv({
  base: "rounded-card text-small p-5",
  variants: { tone: { muted: "text-muted", tight: "rounded-box text-micro" } },
});

describe("tv", () => {
  it("variant 의 색이 base 의 글자 크기 토큰을 지우지 않는다", () => {
    expect(probe({ tone: "muted" })).toBe("rounded-card text-small p-5 text-muted");
  });
  it("variant 의 토큰이 base 의 같은 갈래 토큰을 이긴다", () => {
    expect(probe({ tone: "tight" })).toBe("p-5 rounded-box text-micro");
  });
  it("class 로 넘긴 값이 base 를 이긴다", () => {
    expect(probe({ class: "p-3" })).toBe("rounded-card text-small p-3");
  });
});
```

- [ ] **Step 3: 토큰 설정 없이 먼저 돌려 어긋남을 잰다.** `cn.ts` 는 `twMerge(clsx(inputs))`, `tv.ts` 는 `tailwind-variants` 의 `tv` 를 그대로 다시 내보내는 꼴로 쓰고 시험을 돌린다.

Run: `pnpm --filter @fortuna-lottery/web exec vitest run src/shared/lib/style`
Expected: 글자 크기·모서리 단언 중 일부가 FAIL 한다. 어느 단언이 무엇을 냈는지 보고에 적는다. 색 단언이 통과하면 그것이 색을 알리지 않는 근거다. 토큰과 무관하게 문자열 차례만 다르면(tailwind-merge 가 남기는 차례가 위와 다르면) 기대값을 실측 차례로 고치고, 고친 줄을 보고에 적는다.

- [ ] **Step 4: 토큰 이름을 알린다.**
  - `cn.ts`: `twMergeConfig` 를 `{ extend: { classGroups: { … } } }` 로 짓는다. 글자 크기 여덟을 `font-size` 갈래에, 모서리 다섯을 `rounded` 갈래에 더한다. Step 3 에서 색 단언이 실패했을 때만 색 이름도 더한다. `cn` 은 `extendTailwindMerge(twMergeConfig)` 로 지은 합치기를 쓴다.
  - `tv.ts`: `createTV({ twMergeConfig })` 로 지은 `tv` 를 낸다. `tailwind-variants` 3.3.1 의 실제 서명(`createTV` 와 그 설정 이름)을 설치된 타입에서 확인하고 그대로 쓴다.
  - `cn.ts` 머리 주석에 적는다.
    - Step 3 의 실측: 무엇이 어떻게 어긋났는지.
    - `globals.css` 의 `@theme` 에 토큰을 더하면 여기에도 더한다.
    - `cn` 을 쓰는 자리가 좁다: 부모가 내린 `className` 과 자기 기본값을 합칠 때, 두 정의의 결과를 겹쳐 쌓을 때. 서식 정의는 `tv` 가 맡는다.

- [ ] **Step 5: 시험이 통과한다** — 같은 명령, PASS.

- [ ] **Step 6: 직접 가져오기를 막는다.** `apps/web/eslint.config.mjs` 에 `no-restricted-imports` 하나를 건다.
  - `apps/web/src/**` 에서 `tailwind-variants`·`tailwind-merge` 를 가져오면 오류다. `src/shared/lib/style/{cn,tv}.ts` 두 파일만 뺀다.
  - 메시지: 「`@lib/style/tv`·`@lib/style/cn` 을 쓴다 — 이 저장소의 토큰 이름을 아는 합치기는 그쪽뿐이다」.
  - 규칙 이름은 이 저장소의 다른 규칙처럼 지어(예: `style-tools-through-lib`) 주석에 적는다.
  - `tools/checks/` 에 위반 표본 하나(`import { tv } from "tailwind-variants"`)와 `run-violations.sh` 의 EXPECT 한 줄을 더한다.

- [ ] **Step 7: 확인한다**
  - `pnpm check` 통과.
  - `tools/checks/run-violations.sh` 는 CRLF 라 LF 사본으로 돌린다(`tr -d '\r' < tools/checks/run-violations.sh > tools/checks/run-violations.lf.sh`, Git bash 로 실행한 뒤 사본을 지운다). 모든 줄이 OK.

- [ ] **Step 8: 커밋한다** — `feat(web): 서식 도구 tv·cn 을 shared/lib/style 에 들이고 토큰 이름을 알린다`

---

### Task 3: `shared/ui` 셋에 `tv` 를 적용한다

**Files:**
- Create: `apps/web/src/shared/ui/{ball,card,tabs}.styles.ts`
- Modify: `apps/web/src/shared/ui/{ball,card,tabs}.tsx`
- Test: `apps/web/src/shared/ui/{ball,tabs}.styles.test.ts`, `apps/web/src/shared/ui/card.test.tsx`

**Interfaces:**
- Consumes: Task 2 의 `tv`·`cn`(`../lib/style/tv`·`../lib/style/cn`).

서식 정의는 아래가 정한다. 클래스 값은 지금 화면의 것 그대로다.

```ts
// ball.styles.ts — ball.tsx 의 SIZES 와 조건 클래스를 옮긴다
export const ball = tv({
  base: "inline-flex items-center justify-center rounded-full font-bold tabular-nums select-none",
  variants: {
    size: { sm: "h-7 w-7 text-micro", md: "h-9 w-9 text-small", lg: "h-11 w-11 text-body" },
    dimmed: { true: "opacity-30" },
    ring: { true: "ring-2 ring-text" },
  },
  defaultVariants: { size: "md" },
});

// card.styles.ts — card.tsx 의 정적 클래스를 slot 으로 옮긴다
export const card = tv({
  slots: {
    root: "rounded-card border border-line bg-panel p-5",
    header: "mb-4",
    title: "text-body font-semibold text-text",
    subtitle: "mt-1 text-micro text-muted",
    footnote: "mt-4 border-t border-line pt-2 text-micro leading-relaxed text-warn",
  },
});

// tabs.styles.ts — tabs.tsx 의 UNDERLINE·CHIP 을 variant 와 compoundVariants 로 옮긴다
export const tabs = tv({
  slots: { list: "", item: "transition-colors" },
  variants: {
    variant: {
      underline: {
        list: "flex gap-1 border-b border-line",
        item: "-mb-px border-b-2 px-3 py-2 text-small font-medium",
      },
      chip: {
        list: "flex gap-2 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-gutter:stable] md:flex-wrap md:overflow-x-visible",
        item: "shrink-0 rounded-box px-3 py-2 text-micro font-semibold",
      },
    },
    selected: { true: {}, false: {} },
  },
  compoundVariants: [
    { variant: "underline", selected: true, class: { item: "border-text text-text" } },
    { variant: "underline", selected: false, class: { item: "border-transparent text-muted hover:text-text" } },
    { variant: "chip", selected: true, class: { item: "bg-text text-bg" } },
    { variant: "chip", selected: false, class: { item: "bg-said text-muted hover:bg-inset" } },
  ],
  defaultVariants: { variant: "underline", selected: false },
});
```

`compoundVariants` 에서 slot 을 가리키는 꼴(`class: { item: … }`)은 `tailwind-variants` 3.3.1 의 설치된 타입으로 확인하고, 다르면 그 판본의 꼴로 쓴다. 고친 꼴은 보고에 적는다.

- [ ] **Step 1: 실패하는 시험을 쓴다.** 견주기는 모두 `new Set(cls.split(" "))` 의 집합이다.
  - `ball.styles.test.ts`
    - `ball({ size: "sm", dimmed: true, ring: true })` 가 `inline-flex items-center justify-center rounded-full font-bold tabular-nums select-none h-7 w-7 text-micro opacity-30 ring-2 ring-text` 와 같은 집합이다.
    - `ball({})` 가 base 와 `h-9 w-9 text-small` 의 집합이고 `opacity-30`·`ring-2` 가 없다.
  - `tabs.styles.test.ts` — 짝 넷을 모두 본다. 각 짝의 `tabs({ variant }).item({ selected })` 가 지금 `tabs.tsx` 의 `${style.item} ${selected ? style.active : style.inactive}` 와 같은 집합이고, `tabs({ variant }).list()` 가 `style.list` 와 같은 집합이다.
  - `card.test.tsx`
    - 「부모가 내린 안쪽 여백이 기본 여백을 이긴다」: `render(<Card title="t" className="p-3">x</Card>)` 뒤 `section` 의 클래스에 `p-3` 이 있고 `p-5` 가 없다.
    - 「className 을 내리지 않으면 끝에 빈 칸이 없다」: `section.className` 이 `"rounded-card border border-line bg-panel p-5"` 와 같다.

- [ ] **Step 2: 실패를 확인한다** — `pnpm --filter @fortuna-lottery/web exec vitest run src/shared/ui` → FAIL(서식 파일이 없다, `Card` 는 `p-5` 를 남기고 끝에 빈 칸이 있다).

- [ ] **Step 3: 서식 파일 셋을 쓰고 화면을 바꾼다.**
  - `ball.tsx`: `className={ball({ size, dimmed, ring })}`. `SIZES` 상수를 지운다. `style` 의 인라인 색은 그대로 둔다(번호마다 값이 달라 유틸리티가 아니다).
  - `card.tsx`: `const s = card();` 뒤 `className={cn(s.root(), className)}`. `className` 의 기본값 `""` 을 없앤다. 나머지 요소는 `s.header()` 등으로 부른다.
  - `tabs.tsx`: `const s = tabs({ variant });` 뒤 목록은 `s.list()`, 버튼은 `s.item({ selected })`. `UNDERLINE`·`CHIP` 상수를 지운다.

- [ ] **Step 4: 확인한다** — 같은 명령 PASS, `pnpm check` 통과.

- [ ] **Step 5: 커밋한다** — `refactor(web): shared/ui 의 공·카드·탭 서식을 tv 로 옮긴다`

---

### Task 4: 화면 넷의 조건 className 에 `tv` 를 적용한다

**Files:**
- Create:
  - `apps/web/src/app/(home)/GeneratorCard/GeneratorCard.styles.ts`
  - `apps/web/src/app/(home)/ResultsCard/ResultsCard.styles.ts`
  - `apps/web/src/app/(home)/SimulationCard/SimulationCard.styles.ts`
  - `apps/web/src/app/(home)/StatisticsPanel/PatternDistribution.styles.ts`
- Modify: `GeneratorCard/index.tsx`, `ResultsCard/index.tsx`, `SimulationCard/index.tsx`, `StatisticsPanel/PatternDistribution.tsx`(모두 `apps/web/src/app/(home)/` 아래)
- Test: 서식 파일마다 곁에 `<화면>.styles.test.ts`

**Interfaces:**
- Consumes: Task 2 의 `tv`(`@lib/style/tv`).

서식 정의는 아래가 정한다. boolean variant 는 지금 화면이 거짓일 때도 클래스를 걸므로 `true`·`false` 두 키를 모두 적는다.

```ts
// GeneratorCard.styles.ts
export const generatorCard = tv({
  slots: {
    modeButton: "rounded-box px-3 py-2 text-small font-medium transition-colors",
    numberButton: "rounded-button py-1 text-micro font-semibold tabular-nums transition-colors",
  },
  variants: {
    active: {
      true: { modeButton: "bg-accent text-on-strong" },
      false: { modeButton: "bg-said text-text hover:bg-inset" },
    },
    selected: {
      true: { numberButton: "bg-accent text-on-strong" },
      false: { numberButton: "bg-said text-muted hover:bg-inset" },
    },
  },
});

// ResultsCard.styles.ts
export const resultsCard = tv({
  slots: { resultLabel: "shrink-0 text-micro font-semibold" },
  variants: { win: { true: { resultLabel: "text-warn" }, false: { resultLabel: "text-muted" } } },
});

// SimulationCard.styles.ts
export const simulationCard = tv({
  slots: { rankChip: "rounded-box px-3 py-2 text-small font-semibold" },
  variants: {
    emphasized: {
      true: { rankChip: "border border-warn text-warn" },
      false: { rankChip: "bg-said text-text" },
    },
  },
});

// PatternDistribution.styles.ts
export const patternDistribution = tv({
  slots: { bar: "w-full rounded-t", barLabel: "text-nano" },
  variants: {
    highlighted: {
      true: { bar: "bg-warn", barLabel: "font-bold text-warn" },
      false: { bar: "bg-accent/70", barLabel: "text-muted" },
    },
  },
});
```

- [ ] **Step 1: 실패하는 시험을 쓴다.** 서식 파일마다 곁의 `<화면>.styles.test.ts` 가, 각 slot 의 참·거짓 두 갈래가 지금 화면의 템플릿 문자열과 같은 집합을 내는지 본다. 예: `generatorCard().modeButton({ active: false })` 의 집합 = `rounded-box px-3 py-2 text-small font-medium transition-colors bg-said text-text hover:bg-inset`. 넷 모두 같은 꼴로 참·거짓을 쓴다(slot 다섯 × 두 갈래).

- [ ] **Step 2: 실패를 확인한다** — `pnpm --filter @fortuna-lottery/web exec vitest run "src/app/(home)"` → 새 시험 FAIL(서식 파일이 없다).

- [ ] **Step 3: 서식 파일 넷을 쓰고 화면을 바꾼다.**
  - 화면은 파일 머리에서 `const s = generatorCard();` 처럼 한 번 부르고, 요소마다 `className={s.modeButton({ active })}` 로 쓴다.
  - presenter·입력 묶음은 바꾸지 않는다. 화면이 이미 받는 `active`·`selected`·`isWin`·`emphasized`·`highlighted` 를 그대로 넘긴다(`win: item.isWin`).
  - 바꾼 뒤 `git grep -nE 'className=\{`' -- apps/web/src` → 0.

- [ ] **Step 4: 확인한다** — `"src/app/(home)"` 시험 PASS(기존 presenter 시험 포함), `pnpm check` 통과.

- [ ] **Step 5: 커밋한다** — `refactor(web): 화면 넷의 조건 className 을 화면 곁 styles 파일의 variants 로 옮긴다`

---

### Task 5: 서식 이름이 쓰는 화면과 어긋나지 않게 검사하고 문서에 적는다

**Files:**
- Modify: `apps/web/eslint.config.mjs`, `tools/checks/run-violations.sh`, `.claude/context/design-system.md`, `CLAUDE.md`
- Create: `tools/checks/` 아래 위반 표본 하나, 허용 표본 하나

- [ ] **Step 1: 규칙을 건다.** `eslint.config.mjs` 에 이 저장소의 다른 이름 규칙과 같은 꼴로 규칙 하나를 더한다(예: `styles-owned-by-its-screen`).
  - 판정: `X.styles`(확장자 유무 무관)를 가져올 수 있는 파일은 셋뿐이다.
    - 같은 폴더의 `X.tsx`
    - 폴더 이름이 `X` 인 폴더의 `index.tsx`
    - 같은 폴더의 `X.styles.test.ts`
  - 메시지: 「`X.styles.ts` 는 화면 `X` 만 쓴다 — 다른 화면이 쓰면 소비자를 세어 공통 조상으로 올린다(fractal-view-promotion §3)」.
  - 위반 표본: 형제 화면 `Other.tsx` 가 `./X.styles` 를 가져온다. 허용 표본: 폴더 뷰 `X/index.tsx` 가 `./X.styles` 를 가져온다. `run-violations.sh` 에 EXPECT 한 줄을 더한다.

- [ ] **Step 2: 확인한다** — `pnpm --filter @fortuna-lottery/web lint` 오류 0(Task 3·4 의 서식 일곱이 모두 규칙을 지킨다). run-violations 를 LF 사본으로 돌려 모든 줄이 OK.

- [ ] **Step 3: 문서에 적는다.**
  - `.claude/context/design-system.md` 「규칙」 절에 줄 셋:
    - 조건으로 갈리는 서식은 화면 곁 `<화면>.styles.ts` 에 `tv`(`@lib/style/tv`)로 정의한다. 부모가 내린 `className` 을 합칠 때만 `cn`(`@lib/style/cn`)을 쓴다.
    - 공용 서식 부품은 두 번째 화면이 같은 서식을 쓸 때 공통 조상으로 올린다. 화면 모듈을 넘으면 `shared/ui` 다.
    - `@theme inline` 에 글자 크기·모서리 토큰을 더하면 `shared/lib/style/cn.ts` 의 `twMergeConfig` 에도 더한다.
  - `CLAUDE.md`
    - 「이 저장소가 정한 것 — vault 골조가 답하지 않는 자리」에 한 줄: 서식 도구는 editor 저장소와 같은 셋이다. `tv` 를 `shared/lib/style/tv.ts` 의 `createTV({ twMergeConfig })` 로 내어 토큰 이름을 `tv` 안에도 알리는 것이 editor 와 다른 점이다.
    - 아키텍처 절의 ESLint 규칙 목록에 Task 2·5 의 규칙 이름 둘을 더한다.

- [ ] **Step 4: 확인한다** — `pnpm check` 통과, `pnpm --filter @fortuna-lottery/web build` 성공.

- [ ] **Step 5: 커밋한다** — `chore(checks): 서식 파일은 이름의 화면만 쓰게 검사하고 서식 규칙을 문서에 적는다`
