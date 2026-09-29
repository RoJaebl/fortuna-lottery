# 홈 레이아웃 재설계 ("앱 홈 + 탭 드릴다운") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카드 13개가 한 화면에 동시에 쌓이던 홈 페이지를, 상단 Hero(최근 회차 + 카운트다운 + 번호 생성 CTA) · 토글로 펼쳐지는 생성기 패널 · 4개 탭(통계/시뮬레이션/내 번호/결과 확인)으로 재구성하고, 통계 패널 내부 8개 뷰도 서브탭으로 하나씩만 보이게 바꾼다.

**Architecture:** `shared/ui/tabs.tsx`에 범용 탭 프리미티브를 하나 추가하고, 이를 최상단 내비게이션(underline 변형)과 통계 서브탭(chip 변형) 양쪽에서 재사용한다. `modules/lotterietus/view/lotterietus-card.tsx`는 `Card` 기반에서 배너형 Hero 마크업으로 교체되며 CTA 토글 상태를 prop으로 받는다. `modules/statistics/view/statistics-panel.tsx`는 8개 동시 그리드 렌더를 서브탭 렌더로 바꾸고 `activeStatView` 로컬 상태를 갖는다. `app/page.tsx`는 `currentNumbers` 중개 역할을 유지한 채 `isGeneratorOpen`/`activeTab` 상태를 추가해 전면 재작성한다. **`packages/core`와 모든 모듈의 `viewmodel`/`model`/`transport`/`api`는 한 줄도 바뀌지 않는다.**

**Tech Stack:** Next.js 15 (App Router, client component), React 19 `useState`, TypeScript(strict), Tailwind CSS v4, ESLint(경계 규칙), Vitest(회귀 확인용).

---

## Global Constraints

- **설계 문서**: `docs/superpowers/specs/2026-08-01-home-layout-redesign-design.md` — 이 계획의 유일한 근거. 라벨 문자열·기본 선택 탭·색상 클래스는 모두 이 문서와 정확히 일치해야 한다.
- **Node 버전 주의**: 이 저장소의 `pnpm`(homebrew, v11.x)은 Node 20에서 `node:sqlite` 오류로 실행되지 않는다. 모든 명령 전에 Node 22를 활성화한다:
  ```bash
  nvm use 22
  # 또는: export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"
  ```
  `node -v`가 `v22.x`인지 확인하고 진행한다.
- **TDD 예외 (설계 문서 §8)**: 이번 작업은 순수 프레젠테이션 변경이며 새로운 분기 로직·계산 로직이 없다. 이 저장소의 vitest 설정은 `include: ["src/**/*.test.ts"]`로 `.tsx`를 아예 수집하지 않고, jsdom·testing-library 의존성도 없다 (`apps/web/vitest.config.ts`, `apps/web/package.json` 확인). 따라서 red-green 사이클로 새 테스트를 작성하지 않는다. **검증 기준은 "기존 테스트가 그대로 통과하는 것"**이며, 각 Task는 lint → typecheck → test 순으로 확인하고 커밋한다.
- **import 경계 규칙** (`apps/web/eslint.config.mjs`, 위반 = 빌드 실패):
  - `modules/**`와 `app/**`(단, `app/api/**` 제외)은 core의 `application`/`domain`/`infrastructure`/`shared`를 import할 수 없다.
  - 모듈 간 deep import 금지 — `@/modules/<name>`(index.ts)로만 import한다.
  - `@/shared/**` import는 모듈·라우트 모두에서 허용된다. 새 `Tabs`는 `@/shared/ui/tabs`에 두므로 `page.tsx`와 `statistics-panel.tsx` 양쪽에서 문제없이 import된다.
- **색상 토큰** (설계 문서 §7, `.claude/context/design-system.md`): 새 색상 값을 만들지 않는다.
  - CTA/액션 버튼 = `bg-emerald-600 text-white` (기존 유지)
  - 최상단 탭 활성 = `text-slate-900` + `border-b-2 border-slate-900`, 비활성 = `text-slate-500`
  - 통계 서브탭 활성 = `bg-slate-900 text-white`, 비활성 = `bg-slate-100 text-slate-500`
  - 카운트다운 숫자 = `text-sky-600` (`accent-info` — 디자인 시스템 문서에 "다음 추첨 카운트다운 등"으로 이미 명시된 용도)
  - `Ball`·로또 공 색상(`lotto-colors.ts`)·`accent-warning` 각주는 절대 손대지 않는다.
- **변경 금지 파일**: `packages/core/**` 전체, `apps/web/src/modules/*/viewmodel/**`, `*/model/**`, `*/transport/**`, `*/api/**`, `shared/ui/ball.tsx`, `shared/ui/card.tsx`, `shared/lib/**`, 각 모듈의 `index.ts`.
- **`generator-card.tsx`는 수정하지 않는다**: 생성기의 마크업·모드 토글·`onGenerated` 시그니처는 그대로다. 바뀌는 것은 `page.tsx`가 이 카드를 **언제 렌더링하는지**(`isGeneratorOpen`)뿐이다. 마찬가지로 `simulation-card.tsx`·`picks-card.tsx`·`results-card.tsx`·`identity-badge.tsx`와 통계 하위 뷰 8개 파일도 수정 대상이 아니다 — 감싸는 컨테이너만 바뀐다.
- 이 계획에서 실제로 손대는 파일은 **총 4개**다: `shared/ui/tabs.tsx`(신설), `modules/statistics/view/statistics-panel.tsx`, `modules/lotterietus/view/lotterietus-card.tsx`, `app/page.tsx`. 여기에 문서 `.claude/context/design-system.md` 하나가 추가된다.
- **커밋**: 각 Task 끝에 한 번, 관련 파일만 정확히 `git add`한다 (`git add -A` 금지). 현재 브랜치는 `dev`이며, 작업 트리에 이 계획과 무관한 수정 파일이 다수 있으므로 **반드시 파일 경로를 명시해서 스테이징**한다.

---

### Task 0: 환경 준비 + 베이스라인 확인

이 체크아웃은 의존성이 완전히 설치되어 있지 않다(`apps/web/node_modules`에 eslint 없음). 변경 전에 설치하고, **변경 전 상태에서 lint/test가 통과하는지** 먼저 확인한다 — 그래야 이후 실패가 내 변경 때문인지 판별할 수 있다.

**Files:** 없음 (커밋 없음)

- [ ] **Step 1: Node 22 활성화 확인**

```bash
nvm use 22
node -v
```
Expected: `v22.18.0` (또는 다른 v22.x)

- [ ] **Step 2: 의존성 설치**

```bash
cd "/Users/rojaebl/Library/CloudStorage/OneDrive-개인/vaults/Project/사업/FortunaLottery"
pnpm install
```
Expected: 설치 완료, 에러 없음. (OneDrive 동기화 폴더라 다소 느릴 수 있다.)

- [ ] **Step 3: 베이스라인 lint 확인**

```bash
pnpm --filter web lint
```
Expected: 출력 없이 성공 (exit 0)

- [ ] **Step 4: 베이스라인 typecheck 확인**

```bash
pnpm --filter web exec tsc --noEmit
```
Expected: 출력 없이 성공 (exit 0)

- [ ] **Step 5: 베이스라인 테스트 확인**

```bash
pnpm test
```
Expected: `packages/core` 44개 + `apps/web` 10개 통과, 실패 0

> Step 3~5 중 하나라도 실패하면 **여기서 멈추고 사용자에게 보고한다.** 기존 작업 트리에 이 계획과 무관한 미완성 변경이 있을 수 있으므로, 그 실패를 이 계획의 Task로 고치려 들지 않는다.

---

### Task 1: `Tabs` 프리미티브 신설

최상단 내비게이션(underline)과 통계 서브탭(chip) 두 용도를 하나의 컴포넌트로 처리한다. 이 Task에서는 컴포넌트만 만들고 아직 아무도 사용하지 않는다 — 독립적으로 컴파일되며 커밋 가능하다.

**Files:**
- Create: `apps/web/src/shared/ui/tabs.tsx`

- [ ] **Step 1: `tabs.tsx` 작성**

`onClick` 핸들러가 있으므로 `"use client"` 지시자를 붙인다 (`card.tsx`/`ball.tsx`는 핸들러가 없어 지시자가 없다 — 이 차이는 의도된 것이다).

```tsx
"use client";

export interface TabItem<K extends string> {
  key: K;
  label: string;
}

interface TabsProps<K extends string> {
  items: readonly TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  /** underline = 최상단 내비게이션, chip = 패널 내부 서브탭 (설계 문서 §7) */
  variant?: "underline" | "chip";
  /** 스크린리더용 탭 목록 이름 */
  label: string;
}

/** 최상단 내비게이션 — 밑줄로 "지금 보고 있는 화면"을 표시 (CTA의 채움 버튼과 구분) */
const UNDERLINE = {
  list: "flex gap-1 border-b border-slate-200",
  item: "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
  active: "border-slate-900 text-slate-900",
  inactive: "border-transparent text-slate-500 hover:text-slate-700",
};

/** 패널 내부 서브탭 — 칩 형태로 최상단 탭과 위계를 구분. 모바일은 한 줄 가로 스크롤 */
const CHIP = {
  list: "flex gap-2 overflow-x-auto whitespace-nowrap pb-1 md:flex-wrap md:overflow-x-visible",
  item: "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
  active: "bg-slate-900 text-white",
  inactive: "bg-slate-100 text-slate-500 hover:bg-slate-200",
};

export function Tabs<K extends string>({
  items,
  active,
  onChange,
  variant = "underline",
  label,
}: TabsProps<K>) {
  const style = variant === "chip" ? CHIP : UNDERLINE;

  return (
    <div role="tablist" aria-label={label} className={style.list}>
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.key)}
            className={`${style.item} ${selected ? style.active : style.inactive}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: lint 확인**

```bash
pnpm --filter web lint
```
Expected: 출력 없이 성공

- [ ] **Step 3: typecheck 확인**

```bash
pnpm --filter web exec tsc --noEmit
```
Expected: 출력 없이 성공

- [ ] **Step 4: 커밋**

```bash
git add apps/web/src/shared/ui/tabs.tsx
git commit -m "feat(web): 탭 프리미티브(Tabs) 신설 — underline/chip 두 변형"
```

---

### Task 2: 통계 패널을 8개 서브탭 구조로 전환

`StatisticsPanel`의 외부 인터페이스(`myNumbers` prop)는 그대로이므로 `page.tsx`는 이 Task에서 건드리지 않는다 — 독립적으로 동작하고 커밋 가능하다.

**Files:**
- Modify: `apps/web/src/modules/statistics/view/statistics-panel.tsx` (전체 교체)

- [ ] **Step 1: `statistics-panel.tsx` 전체 교체**

기본 선택은 `"probability"`(확률 현실) — 정직성 원칙을 가장 먼저 보여준다 (설계 문서 §4). `useState`는 early return보다 **위**에 있어야 한다 (조건부 훅 호출 금지).

```tsx
"use client";
import { useState } from "react";
import { Tabs, type TabItem } from "@/shared/ui/tabs";
import { useStatisticsViewModel } from "../viewmodel/use-statistics.viewmodel";
import { FrequencyHeatmap } from "./frequency-heatmap";
import { HotColdBoard } from "./hot-cold-board";
import { NumberFrequencyBars } from "./number-frequency-bars";
import { PatternDistribution } from "./pattern-distribution";
import { ProbabilityReality } from "./probability-reality";
import { RecentGrid } from "./recent-grid";
import { SumDistributionChart } from "./sum-distribution-chart";
import { TopPairsList } from "./top-pairs-list";

type StatView =
  | "probability"
  | "sum"
  | "heatmap"
  | "pattern"
  | "hotcold"
  | "pairs"
  | "frequency"
  | "recent";

/** 8개를 동등하게 나열한다 — 요약/우선순위 압축 없음 (설계 문서 §4) */
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

interface StatisticsPanelProps {
  /** 현재 조합 — 분포 위 내 위치 마커에 사용 */
  myNumbers: number[] | null;
}

export function StatisticsPanel({ myNumbers }: StatisticsPanelProps) {
  const { stats, error } = useStatisticsViewModel();
  const [activeStatView, setActiveStatView] = useState<StatView>("probability");

  if (error) return <p className="text-sm text-red-600">통계를 불러오지 못했습니다: {error}</p>;
  if (!stats) return <p className="text-sm text-slate-500">통계 계산 중…</p>;

  function renderActiveView() {
    switch (activeStatView) {
      case "probability":
        return <ProbabilityReality stats={stats!} />;
      case "sum":
        return <SumDistributionChart stats={stats!} myNumbers={myNumbers} />;
      case "heatmap":
        return <FrequencyHeatmap stats={stats!} />;
      case "pattern":
        return <PatternDistribution stats={stats!} myNumbers={myNumbers} />;
      case "hotcold":
        return <HotColdBoard stats={stats!} />;
      case "pairs":
        return <TopPairsList stats={stats!} />;
      case "frequency":
        return <NumberFrequencyBars stats={stats!} />;
      case "recent":
        return <RecentGrid stats={stats!} />;
    }
  }

  return (
    <div className="space-y-4">
      <Tabs
        items={STAT_VIEWS}
        active={activeStatView}
        onChange={setActiveStatView}
        variant="chip"
        label="통계 항목"
      />
      <div role="tabpanel">{renderActiveView()}</div>
    </div>
  );
}
```

> `stats!`를 쓰는 이유: 중첩 함수 안에서는 바깥의 `if (!stats) return` 좁히기가 유지되지 않을 수 있다. `stats`가 null이면 이미 early return으로 빠져나간 뒤이므로 안전하다. **typecheck에서 `stats!` 없이도 통과한다면 `!`를 제거하는 편이 낫다** — Step 3에서 확인 후 정리한다.

- [ ] **Step 2: lint 확인**

```bash
pnpm --filter web lint
```
Expected: 출력 없이 성공

- [ ] **Step 3: typecheck 확인 + `!` 정리**

```bash
pnpm --filter web exec tsc --noEmit
```
Expected: 출력 없이 성공

통과했다면 `renderActiveView` 안의 `stats!`를 모두 `stats`로 바꾸고 다시 `pnpm --filter web exec tsc --noEmit`을 실행한다. 여전히 통과하면 `stats`(느낌표 없는) 버전을 최종본으로 남긴다. 실패하면 `stats!`로 되돌린다.

- [ ] **Step 4: 기존 테스트 회귀 확인**

```bash
pnpm test
```
Expected: `packages/core` 44개 + `apps/web` 10개 통과 (Task 0 베이스라인과 동일)

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/modules/statistics/view/statistics-panel.tsx
git commit -m "feat(web): 통계 패널 8개 뷰를 서브탭 구조로 전환 (기본: 확률 현실)"
```

---

### Task 3: Hero 재구성 + 홈 페이지 전면 재작성

`LotterietusCard`에 prop이 추가되므로 `page.tsx`도 같은 Task에서 함께 고쳐야 타입체크가 통과한다. 두 파일을 한 커밋으로 묶는다.

**Files:**
- Modify: `apps/web/src/modules/lotterietus/view/lotterietus-card.tsx` (전체 교체)
- Modify: `apps/web/src/app/page.tsx` (전체 교체)

- [ ] **Step 1: `lotterietus-card.tsx` 전체 교체 (배너형 Hero)**

핵심: 최근 회차 볼과 카운트다운을 **동일한 시각적 비중**으로 둔다 — 볼은 `size="lg"`(h-11), 카운트다운은 `text-4xl font-bold`. 데스크톱은 좌우 2열, 모바일은 세로 스택이며 크기·강조는 그대로 유지된다 (설계 문서 §2, §5). 보너스 볼만 기존처럼 `size="md"`로 남겨 본번호와 구분한다. 컴포넌트 이름과 파일 경로는 바꾸지 않으므로 `modules/lotterietus/index.ts`는 수정하지 않는다.

```tsx
"use client";
import { Ball } from "@/shared/ui/ball";
import { useLotterietusViewModel } from "../viewmodel/use-lotterietus.viewmodel";

interface LotterietusCardProps {
  /** 생성기 패널이 펼쳐져 있는지 — CTA 라벨과 aria-expanded에 사용 */
  generatorOpen: boolean;
  onToggleGenerator: () => void;
}

/** 홈 최상단 Hero — 최근 회차와 다음 추첨 카운트다운을 동등한 비중으로 보여주고 생성기 CTA를 제공 */
export function LotterietusCard({ generatorOpen, onToggleGenerator }: LotterietusCardProps) {
  const { data, error, remaining, formatDrawDate } = useLotterietusViewModel();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {data ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">
              최근 회차 · 제{data.round}회 · {formatDrawDate(data.drawnAt)} 추첨
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {data.numbers.map((n) => (
                <Ball key={n} n={n} size="lg" />
              ))}
              <span className="mx-1 text-slate-400">+</span>
              <Ball n={data.bonus} size="md" />
            </div>
          </div>

          <div className="sm:border-l sm:border-slate-200 sm:pl-6">
            <p className="text-xs text-slate-500">
              다음 추첨까지 · 제{data.nextRound}회 · 매주 토요일 20:35
            </p>
            <p className="mt-3 text-4xl font-bold tabular-nums text-sky-600">{remaining ?? "…"}</p>
          </div>
        </div>
      ) : !error ? (
        <p className="text-sm text-slate-500">불러오는 중…</p>
      ) : null}

      <button
        type="button"
        onClick={onToggleGenerator}
        aria-expanded={generatorOpen}
        className="mt-6 w-full rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-emerald-500 sm:w-auto"
      >
        {generatorOpen ? "생성기 닫기" : "번호 생성하기"}
      </button>
    </section>
  );
}
```

- [ ] **Step 2: `page.tsx` 전체 교체**

`xl:grid-cols-[420px_1fr]` 2단 그리드를 제거하고 Hero + 생성기 토글 패널 + 최상단 탭 구조로 바꾼다. 헤더는 모바일에서 세로로 쌓이게 한다 (설계 문서 §5). `currentNumbers` 중개 흐름은 기존 그대로 유지한다.

```tsx
"use client";
// 라우트 = 모듈 조립만 (경계 규칙). 모듈 간 데이터 흐름(현재 조합)과 화면 전환 상태를 여기서 중개한다.
import { useState } from "react";
import { GeneratorCard } from "@/modules/generator";
import { IdentityBadge } from "@/modules/identity";
import { LotterietusCard } from "@/modules/lotterietus";
import { PicksCard } from "@/modules/picks";
import { ResultsCard } from "@/modules/results";
import { SimulationCard } from "@/modules/simulation";
import { StatisticsPanel } from "@/modules/statistics";
import { Tabs, type TabItem } from "@/shared/ui/tabs";

type TabKey = "statistics" | "simulation" | "picks" | "results";

/** 각 카드의 기존 title을 탭 라벨로 그대로 사용 (설계 문서 §3) */
const TABS: readonly TabItem<TabKey>[] = [
  { key: "statistics", label: "통계" },
  { key: "simulation", label: "시뮬레이션" },
  { key: "picks", label: "내 번호" },
  { key: "results", label: "결과 확인" },
];

export default function HomePage() {
  const [currentNumbers, setCurrentNumbers] = useState<number[] | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("statistics");

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

      <LotterietusCard
        generatorOpen={isGeneratorOpen}
        onToggleGenerator={() => setIsGeneratorOpen((open) => !open)}
      />

      {isGeneratorOpen ? (
        <div className="mt-4">
          <GeneratorCard onGenerated={setCurrentNumbers} />
        </div>
      ) : null}

      <div className="mt-8">
        <Tabs items={TABS} active={activeTab} onChange={setActiveTab} label="주요 화면" />
      </div>

      <div role="tabpanel" className="mt-4">
        {activeTab === "statistics" ? <StatisticsPanel myNumbers={currentNumbers} /> : null}
        {activeTab === "simulation" ? <SimulationCard numbers={currentNumbers} /> : null}
        {activeTab === "picks" ? <PicksCard currentNumbers={currentNumbers} /> : null}
        {activeTab === "results" ? <ResultsCard /> : null}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: lint 확인**

```bash
pnpm --filter web lint
```
Expected: 출력 없이 성공 (경계 규칙 위반 없음 — `@/shared/ui/tabs`와 `@/modules/<name>`만 import)

- [ ] **Step 4: typecheck 확인**

```bash
pnpm --filter web exec tsc --noEmit
```
Expected: 출력 없이 성공

- [ ] **Step 5: 기존 테스트 회귀 확인**

```bash
pnpm test
```
Expected: `packages/core` 44개 + `apps/web` 10개 통과 (Task 0 베이스라인과 동일)

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/modules/lotterietus/view/lotterietus-card.tsx apps/web/src/app/page.tsx
git commit -m "feat(web): 홈을 Hero+탭 드릴다운 레이아웃으로 재구성"
```

---

### Task 4: 디자인 시스템 SSOT에 탭 상태 색상 추가

`.claude/context/design-system.md`는 이 저장소의 컬러 SSOT이며 "여기 없는 색상 값을 임의로 새로 만들지 않는다"고 명시한다. 새 색상은 추가하지 않았지만 `slate-900`/`slate-100`에 **새로운 역할(탭 활성/비활성)** 이 생겼으므로, 문서와 코드가 어긋나지 않도록 표를 갱신한다 (프로젝트 CLAUDE.md의 SSOT 규칙).

**Files:**
- Modify: `.claude/context/design-system.md` (시맨틱 토큰 표에 행 3개 추가)

- [ ] **Step 1: 시맨틱 토큰 표에 행 추가**

표의 `accent-ring` 행 **바로 아래**, `로또 공 색상` 행 **바로 위**에 다음 3개 행을 삽입한다:

```markdown
| `tab-active` (밑줄형) | `text-slate-900` + `border-b-2 border-slate-900` | 최상단 탭 활성 상태 (`shared/ui/tabs.tsx` underline 변형) |
| `tab-inactive` | `text-slate-500` | 최상단 탭 비활성 상태 |
| `subtab-active` / `subtab-inactive` | `bg-slate-900 text-white` / `bg-slate-100 text-slate-500` | 패널 내부 서브탭 칩 (`shared/ui/tabs.tsx` chip 변형) |
```

- [ ] **Step 2: 원칙 섹션에 한 줄 추가**

`## 원칙` 목록의 **맨 끝**에 다음 항목을 추가한다:

```markdown
- 내비게이션(탭)은 `slate` 계열로만 표현한다 — `emerald-600` 채움 버튼은 "실행(CTA)" 전용이며,
  "지금 보고 있는 화면"을 나타내는 데 쓰지 않는다.
```

- [ ] **Step 3: 문서와 코드 일치 확인**

```bash
grep -n "slate-900\|slate-100\|slate-500" apps/web/src/shared/ui/tabs.tsx
```
Expected: 위 표에 적은 클래스 조합(`border-slate-900`/`text-slate-900`, `text-slate-500`, `bg-slate-900 text-white`, `bg-slate-100 text-slate-500`)이 실제 코드에 그대로 존재

- [ ] **Step 4: 커밋**

```bash
git add .claude/context/design-system.md
git commit -m "docs: 디자인 시스템 SSOT에 탭 활성/비활성 색상 역할 추가"
```

---

### Task 5: 전체 검증 + 수동 QA

**Files:** 없음 (코드 변경 없음; 문제 발견 시 해당 Task로 돌아가 수정)

- [ ] **Step 1: 전체 lint**

```bash
pnpm lint
```
Expected: `apps/web`(eslint) + `packages/core`(tsc --noEmit) 모두 통과

- [ ] **Step 2: 전체 테스트**

```bash
pnpm test
```
Expected: `packages/core` 44개 + `apps/web` 10개 통과, 실패 0 (Task 0 베이스라인과 동일한 숫자)

- [ ] **Step 3: 프로덕션 빌드**

```bash
pnpm build
```
Expected: Next.js 빌드 성공 (타입 에러·미사용 import 에러 없음)

- [ ] **Step 4: 개발 서버 실행**

```bash
pnpm dev
```
브라우저에서 `http://localhost:3000` 접속.

- [ ] **Step 5: 데스크톱 폭에서 수동 확인**

다음을 하나씩 확인한다:

1. Hero에 최근 회차 볼 6개 + 보너스가 좌측, 카운트다운이 우측에 나란히 보이고, **볼과 카운트다운 숫자의 시각적 크기가 비슷하다** (한쪽이 압도적으로 작지 않다).
2. 카운트다운이 1초마다 갱신된다.
3. 최초 진입 시 생성기 패널은 **보이지 않는다**. CTA 라벨은 "번호 생성하기".
4. CTA를 누르면 Hero 바로 아래에 생성기 카드가 나타나고, 라벨이 "생성기 닫기"로 바뀐다. 다시 누르면 접힌다.
5. 생성기에서 "번호 생성"을 눌러 조합을 만들면 **패널이 접히지 않고** 결과 볼이 그 안에 표시된다.
6. 최상단 탭은 [통계] [시뮬레이션] [내 번호] [결과 확인] 4개이며, **최초 선택은 통계**이고 밑줄로 표시된다.
7. 통계 탭 안에 서브탭 칩 8개가 보이고 **최초 선택은 "확률 현실"**이며, 한 번에 **하나의 뷰만** 렌더링된다.
8. 서브탭을 "합계 분포" / "패턴 분포"로 바꾸면, 5번에서 생성한 조합의 내 위치 마커가 반영된다.
9. 탭을 [시뮬레이션]으로 바꾸면 "과거 전 회차 대입" 버튼이 활성 상태다(5번에서 번호를 생성했으므로).
10. 탭을 [내 번호] → "현재 번호 저장" → [결과 확인] → "당첨 대조" 흐름이 정상 동작한다.
11. 예전 2단 그리드가 사라져 좌측에 생성기가 상시 고정되어 있지 않다.

- [ ] **Step 6: 모바일 폭에서 수동 확인**

브라우저 개발자 도구에서 폭을 **375px**로 줄이고 확인한다:

1. Hero가 세로로 쌓이고, 볼과 카운트다운 모두 잘리지 않는다.
2. 헤더의 브랜드 텍스트와 IdentityBadge가 세로로 쌓인다.
3. 최상단 탭 4개가 가로 스크롤 없이 한 줄에 들어간다.
4. 통계 서브탭 8개는 **한 줄 가로 스크롤**로 동작한다 (줄바꿈되지 않고 옆으로 밀린다).
5. **페이지 전체가 가로로 스크롤되지 않는다** (내부 통계 차트가 넘칠 경우 그 컨테이너만 스크롤).

- [ ] **Step 7: 문제 발견 시 처리**

Step 5~6에서 어긋나는 항목이 있으면 해당 Task(1/2/3)의 파일로 돌아가 고치고, Step 1~3을 다시 실행한 뒤 수정 커밋을 남긴다. 설계 문서와 다르게 하고 싶은 판단이 생기면 **임의로 바꾸지 말고 사용자에게 먼저 보고한다.**

- [ ] **Step 8: 최종 상태 확인**

```bash
git log --oneline -5
git status --short apps/web/src .claude/context
```
Expected: Task 1~4의 커밋 4개가 보이고, `apps/web/src`와 `.claude/context` 아래에 커밋되지 않은 변경이 남아 있지 않다.
