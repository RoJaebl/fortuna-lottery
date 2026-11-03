# 합계 구간 실험실 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 가정 실험실에 「합계 구간」 가정을 더하고, 보기 → 가정 걸기 → 결과 읽기 세 단계와 툴팁으로 화면의 의도가 읽히게 한다.

**Architecture:** 로또 계산(합계별 조합 수, 정확 균등 뽑기)은 `packages/kernel`, 가정 평가(과거 비율·띠·번호판·백테스트)는 `apps/api` 의 `hypothesis` 모듈 `business/` 가 한다. 계약(`packages/contract/src/hypothesis`)이 응답에 화면이 쓰는 숫자를 모두 싣고, 화면(`apps/web` 의 `HypothesisLab`)은 그리기만 한다.

**Tech Stack:** TypeScript, zod, NestJS 12, Next.js 15, supa-store, GSAP(`gsap/Draggable`), vitest.

**Spec:** `docs/superpowers/specs/2026-11-03-sum-range-lab-design.md`

## Global Constraints

- 합계 구간은 정수 `21 ≤ min ≤ max ≤ 255`. 전체 조합 수 `8,145,060`(커널 `TOTAL_COMBINATIONS`).
- 이론 줄의 당첨 확률은 어떤 가정에서도 정확히 `1/8,145,060` 이다. 화면은 이 숫자를 서버 응답에서 받아 그린다.
- 많이 든 구간 = 폭 W 창 가운데 든 회차 수가 **최댓값의 90% 이상**인 창 전부(겹치거나 맞닿으면 합침). 빈 구간 = 한 번도 나오지 않은 합들이 이어진 줄 가운데 **길이 W 이상**.
- 「출현 상위 K개」가 꺼져 있으면 제1회부터 센다. 켜져 있으면 앞선 `WARMUP_ROUNDS = 100` 회를 건너뛴다.
- 화면은 숫자를 다시 계산하지 않는다(표시 모델은 서식만). 화면은 커널을 참조하지 않는다.
- 단추는 `@ui/Button`, 축 숫자는 `text-pico`, 조건 서식은 뷰 폴더의 `X.styles.ts`(`tv`).
- 검증 명령은 `pnpm check`. 계약을 고치면 화면 변환기 시험이 깨져야 한다(wire-contract §6).

## Review Focus

- **좁은 구간 + 고른 번호 5개 + 과거 1등 제외**로 남은 조합이 0개이거나 몇 개뿐일 때 — 뽑기는 끝나야 하고, 0개면 「이 가정 아래 남은 조합이 없습니다」 400. → Task 3 에 시험.
- **구간 양 끝(21~21, 255~255, 21~255)** — 조합 수 1·1·8,145,060, 과거 비율 0 이어도 응답이 깨지지 않는다(과거 확률 분모는 `null`). → Task 1·3 에 시험.
- **`untilRound` 가 1 이거나 K 를 켠 채 100 이하** — 센 회차 0 이면 과거 비율 0, 라벨 「센 회차 없음」, 500 이 아니다. → Task 3·5 에 시험.
- **재생 중 빠른 회차 변경** — 늦게 온 응답이 새 회차 화면을 덮지 않는다. → Task 8 에 시험.
- **min > max 입력(끌기 도중 손잡이 교차 포함)** — 화면은 두 값을 정렬해 보내고, 서버는 그래도 오면 400. → Task 2·8 에 시험.

---

### Task 1: 커널 — 합계별 조합 수와 정확 균등 뽑기

**Files:**
- Create: `packages/kernel/src/sumRange.ts`, `packages/kernel/src/sumRange.test.ts`
- Modify: `packages/kernel/src/index.ts` (`export * from "./sumRange.js";`)

**Interfaces:**
- Produces:
  - `SUM_MIN = 21`, `SUM_MAX = 255`
  - `countInSumRange(pool: readonly number[], pick: number, min: number, max: number): number` — pool 에서 `pick` 개를 골라 합이 `[min,max]` 인 조합 수
  - `drawInSumRange(random: RandomPort, pool: readonly number[], fixed: readonly number[], min: number, max: number): Result<Combination>` — fixed 를 넣고 나머지를 `pool\fixed` 에서 골라 6개 합이 구간인 조합을 **정확히 고르게** 하나 뽑는다
  - `listInSumRange(pool: readonly number[], fixed: readonly number[], min: number, max: number): Combination[]` — 같은 조건의 조합을 모두 나열(호출자가 개수를 작게 보장)

- [ ] **Step 1: 실패하는 시험을 쓴다** (`sumRange.test.ts`)
  - `countInSumRange(1..45, 6, 21, 255) === 8_145_060`, `(…, 121, 160) === 3_948_748`, `(…, 21, 21) === 1`, `(…, 255, 255) === 1`, `(…, 48, 80) === 212_558`
  - `countInSumRange([1,2,3,4,5,6,7], 6, 21, 21) === 1`
  - `drawInSumRange(mulberry32(1), 1..45, [], 21, 22)` 를 2,000번 뽑으면 나오는 조합은 정확히 `[1,2,3,4,5,6]`·`[1,2,3,4,5,7]` 둘이고 각 비율이 0.45~0.55
  - fixed `[40,41,42,43,44]` 와 구간 `255~255` → `[40..45]`; 구간 `21~30` → `err`
  - `listInSumRange(1..45, [1,2,3,4,5], 21, 23)` 의 길이 3(`6·7·8`)
- [ ] **Step 2: 실패를 확인한다** — `pnpm --filter @fortuna-lottery/kernel test` 가 `sumRange` 를 못 찾아 FAIL.
- [ ] **Step 3: 구현한다.** 표는 「pool[i..] 에서 k개를 골라 합 s」 뒤쪽 누적 표 `ways[i][k][s]`(k ≤ 6, s ≤ 255). 뽑기는 앞에서부터 번호마다 「넣는다/뺀다」를 남은 구간 경우의 수 비율로 정한다(거절 표집 금지). fixed 검사(범위·중복·5개 이하)는 `generate` 의 문구를 그대로 쓴다. 남은 경우의 수가 0 이면 `err("이 가정 아래 남은 조합이 없습니다")`.
- [ ] **Step 4: 통과를 확인한다** — 같은 명령 PASS.
- [ ] **Step 5: 커밋** — `feat(kernel): 합계 구간 조합 수와 정확 균등 뽑기`

### Task 2: 계약 — 합계 구간 가정과 늘어난 응답

**Files:**
- Modify: `packages/contract/src/hypothesis/schema.ts`, `packages/contract/src/hypothesis/schema.test.ts`

**Interfaces:**
- Produces (요청 — evaluate·generate 공통 `assumptionSchema`):
  `{ sumRange: { min: int 21..255, max: int 21..255 }, excludePastWinners: boolean, topK?: int 6..45, fixed: int 1..45 배열 (최대 5개, 기본 []), untilRound?: int ≥ 1 }`
- Produces (evaluate 응답 — 기존 `totalCombinations · assumedCombinations · pool · hitRate · backtest` 유지, 아래를 더함):
  - `sumRange: { min, max }`
  - `sumRangeCombinations: { total: number, excluded: number }` — total 은 제외 전(풀 안), `assumedCombinations = total − excluded`
  - `theoryRate: number` (= assumedCombinations / totalCombinations), `pastRate: number` (= hitRate.hits / hitRate.rounds, 회차 0 이면 0), `expectedHits: number` (= hitRate.expectedRate × hitRate.rounds)
  - `denominators: { past: number | null, theory: number }` — past = assumedCombinations / pastRate 반올림(pastRate 0 이면 null), theory = 8,145,060
  - `sumCounts: number[]` (길이 235, index 0 = 합 21)
  - `frequentBands: { min, max, count, rate }[]`, `maxWindowRate: number`, `emptyBands: { min, max }[]`
  - `numbers: { n: number, possible: boolean, count: number }[]` (길이 45)
- `generate` 응답 그대로.

- [ ] **Step 1: 실패하는 시험** — 요청: `sumRange` 없음·`min 20`·`max 256`·정수 아님 거절, `fixed` 6개 거절, `fixed` 생략 시 `[]` 로 채움, `untilRound 0` 거절, `min > max` 는 **받는다**(모양만 본다). 응답: `denominators.past: null` 을 받는다.
- [ ] **Step 2: FAIL 확인** — `pnpm --filter @fortuna-lottery/contract test`
- [ ] **Step 3: 스키마를 고친다** (`HypothesisEvaluateRequestSchema = HypothesisGenerateRequestSchema = assumptionSchema`).
- [ ] **Step 4: PASS 확인**, 그리고 `pnpm --filter @fortuna-lottery/web typecheck` 가 변환기에서 깨지는 것을 확인한다(Task 6 이 고친다).
- [ ] **Step 5: 커밋** — `feat(contract): 가정에 합계 구간·고른 번호·센 회차를 더하고 응답을 늘린다`

### Task 3: 서버 business — 가정 우주에 합계 구간 걸기

**Files:**
- Modify: `apps/api/src/modules/hypothesis/domain/model/Assumption.model.ts`, `business/assumption.ts`, `business/drawAssumed.ts`, `business/backtestAssumption.ts` 와 각 `*.test.ts`

**Interfaces:**
- Consumes: Task 1 `countInSumRange · drawInSumRange · listInSumRange`
- Produces:
  - `Assumption` 에 `readonly sumRange: { min: number; max: number }`, `readonly fixed: readonly number[]` 를 더한다(`topK`·`excludePastWinners` 유지).
  - `universe(assumption, tally)` → `{ pool, total, excluded, count }` (total = `countInSumRange(pool, 6, min, max)`, excluded = 풀 안·구간 안의 과거 1등 수, count = total − excluded). 고른 번호와 무관하다.
  - `walkRounds` — `topK === null` 이면 warmup 없이 제1회부터, 아니면 `WARMUP_ROUNDS` 뒤부터.
  - `hitRate` — 적중 = 당첨 6개가 풀 안 ∧ 합이 구간 ∧ (제외면 그 앞 과거 1등 아님).
  - `drawAssumed(random, assumption, pool, pastKeys)` → `Result<Combination>` — `fixed` 를 넣고 구간 안에서 뽑는다. 남은 경우의 수(고른 번호 포함, 제외 반영)가 0 이면 `err("이 가정 아래 남은 조합이 없습니다")`. 그 수가 4,096 이하면 `listInSumRange` 로 나열해 제외를 걸러 고르고, 넘으면 `drawInSumRange` 후 과거 1등이면 다시 뽑는다.
- [ ] **Step 1: 실패하는 시험**
  - `assumption.test.ts`: 회차 셋(합 21, 60, 200)과 구간 `50~100`, K 끔 → `hitRate = { hits: 1, rounds: 3 }`; K 를 켜면 warmup 때문에 `rounds: 0`; `universe` 의 total 이 `countInSumRange` 와 같다.
  - `drawAssumed.test.ts`: fixed `[1,2,3,4,5]`, 구간 `21~21`, 과거 1등 `[1,2,3,4,5,6]`, 제외 켬 → `err("이 가정 아래 남은 조합이 없습니다")`(고리 없이 끝난다); 같은 제외에 구간 `21~22` 면 백 번 뽑아도 언제나 `[1,2,3,4,5,7]`.
  - `backtestAssumption.test.ts`: 구간을 건 가정에서 assumed 장수 = 센 회차 × 20.
- [ ] **Step 2: FAIL 확인** — `pnpm --filter @fortuna-lottery/api test -- hypothesis`
- [ ] **Step 3: 구현한다.**
- [ ] **Step 4: PASS 확인.**
- [ ] **Step 5: 커밋** — `feat(api): 가정 우주에 합계 구간과 고른 번호를 건다`

### Task 4: 서버 business — 합계 띠와 번호판

**Files:**
- Create: `apps/api/src/modules/hypothesis/business/sumAnalysis.ts`, `sumAnalysis.test.ts`

**Interfaces:**
- Consumes: Task 1 `countInSumRange`
- Produces:
  - `sumCounts(draws: readonly Draw[]): number[]` — 길이 235
  - `sumBands(counts: readonly number[], width: number, rounds: number): { frequentBands: {min;max;count;rate}[]; maxWindowRate: number; emptyBands: {min;max}[] }`
  - `numberBoard(draws, assumption, pool, pastKeys): { n; possible; count }[]` — possible = 「fixed ∪ {n}」을 품은 가정 우주 조합이 1개 이상(제외 반영; fixed 에 든 번호는 possible true), count = 합이 구간인 회차에서 n 이 나온 횟수
- [ ] **Step 1: 실패하는 시험** — 합 `[100,100,101,130]` 네 회차, 폭 2 → 창 100~101 이 3회(75%)로 최대, 90% 이상 창은 그 하나 → `frequentBands = [{min:100,max:101,count:3,rate:0.75}]`; 폭 2 로 빈 구간은 `21~99`·`102~129`·`131~255` 셋이다; 합 `[100,102]` 두 회차에 폭 2 면 사이의 빈 칸 101(1칸)은 빈 구간에 들지 않는다; 최대값이 같은 창 두 개가 맞닿으면 하나로 합쳐진다; K=6 풀 `[1..6]` 이면 7~45 는 possible false.
- [ ] **Step 2: FAIL 확인.** **Step 3: 구현.** **Step 4: PASS 확인.**
- [ ] **Step 5: 커밋** — `feat(api): 합계 띠와 번호판을 계산한다`

### Task 5: 서버 — 유스케이스와 HTTP

**Files:**
- Modify: `business/EvaluateAssumption.ts`, `business/GenerateAssumed.ts`, `domain/model/Evaluation.model.ts`, `HypothesisModule.test.ts`

**Interfaces:**
- Consumes: Task 2 응답 모양, Task 3·4 함수
- Produces: evaluate 응답이 Task 2 의 모든 필드를 채운다. `untilRound` 가 있으면 `draws.filter(d => d.round <= untilRound)`. 도메인 실패 400: `min > max` → 「합계 구간의 최소가 최대보다 큽니다」, fixed 중복 → kernel 문구, fixed 합만으로 구간을 넘음·남은 조합 0 → 「이 가정 아래 남은 조합이 없습니다」.
- [ ] **Step 1: 실패하는 모듈 시험** — 105회 가짜 회차로: `sumCounts.length === 235`, `theoryRate × 8_145_060 === assumedCombinations`, `denominators.theory === 8_145_060`, `untilRound: 1` 이면 `hitRate.rounds === 1`, `{min:200,max:100}` → 400, 남은 조합 0 → 400.
- [ ] **Step 2: FAIL 확인.** **Step 3: 구현.** **Step 4: PASS 확인** — `pnpm --filter @fortuna-lottery/api test`.
- [ ] **Step 5: 커밋** — `feat(api): 합계 구간 평가와 뽑기를 낸다`

### Task 6: 화면 — 변환기·도메인 원형·표시 모델

**Files:**
- Modify: `apps/web/src/app/(home)/HypothesisLab/_model/Evaluation.model.ts`, `_model/Evaluation.viewmodel.ts`(+test), `_mapper/hypothesisEvaluate.mapper.ts`(+test), `_mapper/hypothesisGenerate.mapper.ts`

**Interfaces:**
- Produces:
  - `AssumptionModel = { sumRange: {min;max}; excludePastWinners: boolean; topK?: number; fixed: number[]; untilRound?: number }`
  - `EvaluationModel` 에 Task 2 응답 필드를 같은 이름으로 더한다(배열은 복사).
  - 표시 모델 게터: `pastRateLabel`(「47.0% · 1,245회 중 585회」), `theoryRateLabel`(「48.5%」), `inRangeLabel`(「1 / 3,948,748」), `pastProbabilityLabel`(「1 / 8,403,746」, null 이면 「과거에 든 회차 없음」), `theoryProbabilityLabel`(「1 / 8,145,060」), `excludedLabel`(「제외한 과거 1등 n개」), `gapSentence`(`hits − expectedHits` 반올림 d 로 「과거에 기대(약 33회)보다 4회 더 나왔습니다. 이 차이는 우연입니다.」, d=0 이면 「기대와 같았습니다.」)
- [ ] **Step 1: 실패하는 시험** — 위 문구를 그대로 기대값으로. 요청 변환은 `untilRound` 없으면 키를 빼고 `fixed` 는 언제나 싣는다.
- [ ] **Step 2: FAIL.** **Step 3: 구현.** **Step 4: PASS** — `pnpm --filter @fortuna-lottery/web exec vitest run "src/app/(home)/HypothesisLab"`.
- [ ] **Step 5: 커밋** — `feat(web): 합계 구간 응답을 옮기고 문구를 짓는다`

### Task 7: 화면 — 재생 바 승격과 툴팁 부품

**Files:**
- Move: `apps/web/src/app/(home)/StatisticsPanel/RoundTimeline.tsx` → `apps/web/src/app/(home)/RoundTimeline/index.tsx` (import 두 곳 고침)
- Create: `apps/web/src/shared/ui/Tooltip/index.tsx`, `Tooltip.styles.ts`, `Tooltip.styles.test.ts`

**Interfaces:**
- Produces: `RoundTimeline`·`RoundTimelineProps`(이름·모양 그대로, 경로만 `../RoundTimeline`). `Tooltip({ text: string; children?: ReactNode })` — 기본은 ⓘ 단추, 마우스·초점에서 말풍선(`role="tooltip"`, `aria-describedby`). 상태는 CSS(`group-hover`·`group-focus-within`)로만 연다(화면에 상태 없음 규칙).
- [ ] **Step 1: 실패하는 시험** — `Tooltip.styles.test.ts`(말풍선 숨김·보임 클래스), 화면 시험 하나: `render(<Tooltip text="출처" />)` 에 `role="tooltip"` 텍스트가 있다.
- [ ] **Step 2: FAIL.** **Step 3: 옮기고 짓는다.** **Step 4: `pnpm check` PASS**(통계 탭 동작 그대로).
- [ ] **Step 5: 커밋** — `refactor(web): 재생 바를 두 화면의 공통 조상으로 올리고 툴팁 부품을 더한다`

### Task 8: 화면 — 상태·자원·presenter

**Files:**
- Create: `apps/web/src/app/(home)/_state/labRange.state.ts`
- Modify: `HypothesisLab/_state/switches.state.ts`, `HypothesisLab/_action/assumption.state.ts`, `HypothesisLab/HypothesisLab.presenter.ts`(+test), `composition/__snapshots__/store.describe.test.ts.snap`

**Interfaces:**
- Produces:
  - `state.home.labRange` = `{ min: 121, max: 160, setRange(min: number, max: number) }` — setRange 는 두 값을 정렬해 21~255 로 묶는다.
  - `state.home.HypothesisLab.switches` 에 `pastRateMode: true`, `fixed: number[]`(최대 5), `untilRound: number | null`, `playSpeed: 1` 과 바꾸는 함수(`togglePastRateMode`·`toggleFixed`·`changeUntilRound`·`changePlaySpeed`)를 더한다.
  - `api.home.HypothesisLab.assumption` — `query(assumption: AssumptionModel)` 로 evaluate 를 조회로 바꾸고(args 가 바뀌면 다시 받고 늦은 응답은 버린다), `generate` 는 바꾸기로 남긴다.
  - `useHypothesisLabPresenter()` 가 Task 9 화면 묶음 셋(`chart`·`controls`·`result`)과 `timeline: RoundTimelineProps` 를 낸다. 구간 입력은 300ms 디바운스(마지막 값만 보낸다).
- [ ] **Step 1: 실패하는 시험** — 구간을 바꾸면 evaluate 요청 본문의 `sumRange` 가 바뀐다; 회차를 빠르게 셋 바꾸면 마지막 응답만 그려진다(늦은 첫 응답을 나중에 풀어도 화면은 셋째); `setRange(200,100)` → `{min:100,max:200}`; 자동 채우기 결과가 `state.home.combination` 으로 간다.
- [ ] **Step 2: FAIL.** **Step 3: 구현.** **Step 4: PASS** 와 스냅숏 갱신(`vitest run src/composition -u`, 새 key 셋이 보이는지 확인).
- [ ] **Step 5: 커밋** — `feat(web): 실험실 상태·조회 자원·presenter`

### Task 9: 화면 — 세 단계 화면

**Files:**
- Create: `HypothesisLab/SumRangeChart/index.tsx`·`SumRangeChart.styles.ts`·`.styles.test.ts`(차트·띠·끌기), `HypothesisLab/ProbabilityTable.tsx`, `HypothesisLab/NumberBoard/index.tsx`·`.styles.ts`·`.styles.test.ts`, `HypothesisLab/BacktestTable.tsx`
- Modify: `HypothesisLab/index.tsx`

**Interfaces:**
- Consumes: Task 8 presenter 묶음, Task 7 `RoundTimeline`·`Tooltip`
- 문구(스펙 그대로): 카드 머리말 「합계 구간을 가정해 보고, 그 가정이 과거에 얼마나 맞았는지 확인합니다. 어떤 구간을 골라도 실제 당첨 확률은 1/8,145,060 입니다.」; 표 행 이름 「과거 비율을 믿는다면」·「공정한 추첨이라면(이론)」; 백테스트 머리말 「센 회차마다 가정 우주에서 20장, 무작위로 20장을 샀다면」.
- 끌기: 차트 위 손잡이 둘(GSAP `Draggable`, x 축). 끌면 `setRange` 를 부른다. 손잡이가 교차하면 정렬해 보낸다.
- 배치(스펙 §5.4 그대로): 0 재생 바 → 1 보기(차트 + 범례 두 줄 「폭 W 구간 가운데 가장 많이 든 비율 x.x% (그 90% 이상인 구간 k곳)」·「한 번도 나오지 않은 합계 구간 m곳」, 띠 위 마우스는 「합계 a~b · 과거 n회 · x.x%」) → 2 가정 걸기(최소·최대 입력, 스위치 셋) → 3 결과 읽기(두 줄 표 — 「과거 비율로 계산」을 끄면 첫 줄을 흐리게 접는다, `excludedLabel`, `gapSentence`, 번호판, 「나머지 자동 채우기」와 그 조합 아래 예상 당첨 확률 두 줄, 백테스트 표, 각주) → 4 인기 패턴(지금 그대로).
- `Tooltip` 을 다는 자리: 구간 안 조합 수, 이론 비율, 과거 비율, 두 당첨 확률, 많이 든 구간, 빈 구간, 과거 1등 조합 제외, 출현 상위 K개, 풀, 백테스트. 문구는 각 숫자의 출처를 한 문장으로.
- [ ] **Step 1: 실패하는 시험** — 서식 시험(띠 종류별 클래스, 번호판 가능·불가·고름), 화면 시험: 표에 두 행 이름과 「1 / 8,145,060」이 있다.
- [ ] **Step 2: FAIL.** **Step 3: 구현.** **Step 4: `pnpm check` PASS.**
- [ ] **Step 5: 브라우저 확인** — `FORTUNA_DEV_WEB_PORT=3100 FORTUNA_DEV_API_PORT=4100 pnpm dev`, 가정 실험실에서: 구간 121~160 → 과거 47.0%·이론 48.5%; 차트를 끌어 48~80 → 과거 확률 1/7,152,289; 번호 다섯 고르고 자동 채우기; 재생 단추로 회차가 쌓이며 과거 비율이 움직이는지.
- [ ] **Step 6: 커밋** — `feat(web): 가정 실험실을 보기·가정 걸기·결과 읽기 세 단계로 그린다`

### Task 10: 합계 분포에서 들어오는 문과 문서

**Files:**
- Modify: `StatisticsPanel/_model/Statistics.viewmodel.ts`(+test: `sumBands` 에 `min`·`max` 더함), `StatisticsPanel/StatisticsPanel.presenter.ts`(+test), `StatisticsPanel/SumDistributionChart.tsx`, `CLAUDE.md`(화면 구성·공통 상태 줄)

**Interfaces:**
- Consumes: Task 8 `state.home.labRange.setRange`, `state.home.navigation.selectTab`
- Produces: 구간표 각 행 끝 「이 구간으로 실험하기」(`Button intent="ghost" size="sm"`). 누르면 `setRange(min, max)` 뒤 `selectTab("hypothesis")`.
- [ ] **Step 1: 실패하는 presenter 시험** — 둘째 행(41~60)의 `onExperiment()` 후 `labRange` 가 `{41,60}`, 활성 탭이 `hypothesis`.
- [ ] **Step 2: FAIL.** **Step 3: 구현.** **Step 4: `pnpm check` PASS**, 브라우저로 단추를 눌러 실험실로 넘어가는지 확인.
- [ ] **Step 5: 커밋** — `feat(web): 합계 분포 구간표에서 실험실로 들어가는 문을 단다`
