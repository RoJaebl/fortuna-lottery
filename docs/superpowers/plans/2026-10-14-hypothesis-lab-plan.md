# 가정 실험실 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 가정 두 개(과거 1등 조합 제외, 자주 나온 번호 K개 안에서)를 걸어 가정 확률·가정 적중률·실제 확률을 나란히 보여 주고, 그 가정으로 백테스트하고 번호를 뽑고, 현재 조합의 인기 패턴을 경고하는 「가정 실험실」 탭을 만든다.

**Architecture:** 서버에 새 모듈 `hypothesis` 를 두고 계산은 전부 `business/` 의 순수 함수로 짓는다. 과거 회차는 모듈 자신의 `DrawHistoryPort` 로 받고 `CompositionModule` 이 `LotterietusFacade` 를 꽂는다. 화면에는 새 모듈 `hypothesis` 와 홈의 새 탭을 둔다. 조합 뽑기 함수 `generate` 는 두 서버 모듈이 함께 쓰므로 커널로 옮긴다.

**Tech Stack:** pnpm 워크스페이스 · turbo · NestJS 12(ESM) · Next.js · zod 4 · vitest · dependency-cruiser · ESLint

**Spec:** [2026-10-13-hypothesis-lab-design.md](<../specs/2026-10-13-hypothesis-lab-design.md>)

## Global Constraints

- 실제 확률의 분모는 커널의 `TOTAL_COMBINATIONS`(8,145,060)를 쓴다. 숫자를 다시 적지 않는다.
- 가정 확률은 화면 어디서나 「가정 확률」이라는 이름으로만 부른다. 「당첨 확률이 올라갑니다」「N배」 같은 문구를 쓰지 않는다.
- 가정 확률은 가정 적중률과 실제 확률 없이 혼자 나오지 않는다. 세 숫자는 같은 크기로 나란히 놓는다.
- 가정 적중률과 백테스트는 회차를 앞에서부터 걷고, 회차 r 의 풀과 제외 집합은 r 보다 앞선 회차로만 만든다.
- 워밍업: 앞선 회차가 100 개 미만인 회차는 세지 않는다. 어느 가정을 걸든 똑같다.
- 백테스트: 회차마다 가정 쪽 20 장, 무작위 쪽 20 장. 난수는 고정 시드의 `mulberry32`.
- K 는 6~45 정수. 화면 기본값 20. 출현 횟수가 같으면 작은 번호를 풀에 먼저 넣는다. 출현 횟수는 본 번호만 센다(보너스 제외).
- 인기 패턴은 네 가지다: 모든 번호가 1~31 안, 연속 번호 3개 이상, 6개가 등차수열, 과거 1등 조합과 똑같음.
- 배치와 계층은 저장소 `CLAUDE.md` 의 「아키텍처 — vault 골조를 가리킨다」와 「이 저장소가 정한 것」을 따른다. 모듈 사이 import 금지, 서버 `domain/model/` 은 의존 없음, 화면 `.tsx` 에 상태 없음.
- 과업 끝의 검증 명령은 `pnpm check` 다.
- 커널과 계약은 `dist/` 로 내보낸다. 이 둘을 고친 뒤 다른 패키지의 시험을 돌리기 전에 `pnpm --filter @fortuna-lottery/kernel build` 또는 `pnpm --filter @fortuna-lottery/contract build` 를 돈다.

## Review Focus

1. **남은 조합이 0 개인 가정.** K = 6 이고 풀 6개가 과거 1등 조합과 같으면 가정 우주가 0 이다. evaluate 는 `assumedCombinations: 0` 을 내고 화면은 「남은 조합 없음」을 쓴다. generate 는 무한히 다시 뽑지 않고 400 으로 거절한다. Task 3 과 Task 5 가 시험한다.
2. **회차가 101 개 미만인 데이터.** 센 회차가 0 이다. 0 으로 나누지 않고 화면은 「센 회차 없음」을 쓴다. Task 3 과 Task 6 이 시험한다.
3. **미래 정보 누설.** 회차 r 뒤에 오는 회차를 바꿔도 회차 r 의 적중 판정이 같아야 한다. Task 3 이 시험한다.
4. **중복 번호로 인기 패턴 요청.** 계약은 모양만 보므로 `[1,1,2,3,4,5]` 가 통과한다. 커널 `createCombination` 이 거절해 400 이 나야 한다. Task 5 가 시험한다.
5. **현재 조합이 없을 때.** 인기 패턴 영역은 요청하지 않고 「먼저 번호를 생성하세요」를 쓴다. Task 6 이 시험한다.

---

### Task 0: 작업 자리와 문서 선 커밋

**Files:**
- Commit: `docs/superpowers/specs/2026-10-13-hypothesis-lab-design.md`, `docs/superpowers/plans/2026-10-14-hypothesis-lab-plan.md`

- [ ] **Step 1:** `git-strategy` 스킬을 먼저 부른 뒤 그 절차대로 `dev` 에서 작업 브랜치와 워크트리를 만든다. 브랜치 이름은 `hypothesis-lab+` 다. 워크트리는 Orca 네이티브(`orca worktree create --name ...`)로 만든다. (실행 때 Orca 앱이 꺼져 있어 raw `git worktree add --no-track` 로 `C:/Users/hnpark/orca/workspaces/FortunaLottery/hypothesis-lab` 에 만들었다.)
- [ ] **Step 2:** 워크트리 안에서 `pnpm install` 을 돌고 `pnpm check` 가 통과하는지 확인한다. Expected: 실패 0.
- [ ] **Step 3:** 스펙과 이 계획을 커밋한다.

```bash
git add docs/superpowers/specs/2026-10-13-hypothesis-lab-design.md docs/superpowers/plans/2026-10-14-hypothesis-lab-plan.md
git commit -m "docs: 가정 실험실 설계와 구현 계획"
```

---

### Task 1: 조합 뽑기를 커널로 옮긴다

**Files:**
- Create: `packages/kernel/src/generate.ts` (내용은 지금 `apps/api/src/modules/generator/business/generate.ts` 그대로, import 만 커널 내부 상대 경로로)
- Create: `packages/kernel/src/generate.test.ts` (지금 `generate.test.ts` 를 옮긴다)
- Delete: `apps/api/src/modules/generator/business/generate.ts`, `apps/api/src/modules/generator/business/generate.test.ts`
- Modify: `packages/kernel/src/index.ts` (`export * from "./generate.js";`)
- Modify: `apps/api/src/modules/generator/business/GenerateCombination.ts` (`generate` 를 `@fortuna-lottery/kernel` 에서 가져온다)

**Interfaces:**
- Produces: `generate(random: RandomPort, fixed?: readonly number[], excluded?: readonly number[]): Result<Combination>` 가 `@fortuna-lottery/kernel` 에서 나온다. 동작은 바뀌지 않는다.

- [ ] **Step 1:** 파일을 옮기고 import 를 고친다. 시험 파일의 `mulberry32` import 는 `./rng.js` 로 바꾼다.
- [ ] **Step 2:** `pnpm --filter @fortuna-lottery/kernel build && pnpm --filter @fortuna-lottery/kernel test && pnpm --filter @fortuna-lottery/api test`. Expected: 옮긴 시험을 포함해 전부 PASS.
- [ ] **Step 3:** `pnpm check`. Expected: 실패 0.
- [ ] **Step 4:** 커밋 `refactor(kernel): 조합 뽑기 generate 를 커널로 옮긴다`.

---

### Task 2: 계약 `hypothesis`

**Files:**
- Create: `packages/contract/src/hypothesis/schema.ts`, `packages/contract/src/hypothesis/index.ts`(`export * from "./schema.js";`), `packages/contract/src/hypothesis/schema.test.ts`
- Modify: `packages/contract/package.json` (`exports` 에 `"./hypothesis"` 를 다른 항목과 같은 모양으로 더한다)

**Interfaces:**
- 모양은 `packages/contract/src/simulation/` 을 따른다: 스키마는 `schema.ts`, `z.infer` 타입은 `index.ts` 가 `import type` 으로 받아 선언한다. 이름은 wire-contract §4 이름 규칙(`<도메인><동작>Request / Response`)을 따른다.
- Produces (`schema.ts` 의 스키마, `index.ts` 의 타입):
  - 내부 상수(내보내지 않는다) `assumptionSchema = z.object({ excludePastWinners: z.boolean(), topK: z.number().int().min(6).max(45).optional() })`
  - 내부 상수 `rankTallySchema = z.object({ tickets: z.number(), rankCounts: z.array(z.number()) })` (rankCounts index = 등수, 0 = 낙첨, 길이 6)
  - `HypothesisEvaluateRequestSchema = assumptionSchema`, 타입 `HypothesisEvaluateRequest`
  - `HypothesisEvaluateResponseSchema = z.object({ totalCombinations: z.number(), assumedCombinations: z.number(), pool: z.array(z.number()), hitRate: z.object({ hits: z.number(), rounds: z.number(), expectedRate: z.number() }), backtest: z.object({ assumed: rankTallySchema, random: rankTallySchema }) })`, 타입 `HypothesisEvaluateResponse`. `pool` 은 topK 가 없으면 1~45 전부다.
  - `HypothesisGenerateRequestSchema = assumptionSchema`, 타입 `HypothesisGenerateRequest`
  - `HypothesisGenerateResponseSchema = z.object({ numbers: combinationSchema })`, 타입 `HypothesisGenerateResponse`
  - `HypothesisPopularityRequestSchema = z.object({ numbers: combinationSchema })`, 타입 `HypothesisPopularityRequest`
  - `HypothesisPopularityResponseSchema = z.object({ patterns: z.array(z.enum(["birthday", "consecutive", "arithmetic", "pastWinner"])) })`, 타입 `HypothesisPopularityResponse`
  - 뒤 과업은 패턴 하나의 타입을 `HypothesisPopularityResponse["patterns"][number]` 로 쓴다.

- [ ] **Step 1: 실패하는 시험을 쓴다** (`schema.test.ts`)
  - `HypothesisEvaluateRequestSchema` 가 `{ excludePastWinners: true }` 와 `{ excludePastWinners: false, topK: 20 }` 을 받는다.
  - `topK` 가 5, 46, 20.5 이면 거절한다. `excludePastWinners` 가 없으면 거절한다.
  - `HypothesisPopularityResponseSchema` 가 `{ patterns: ["lucky"] }` 를 거절한다.
- [ ] **Step 2:** `pnpm --filter @fortuna-lottery/contract test`. Expected: FAIL (모듈 없음).
- [ ] **Step 3:** 스키마를 위 Interfaces 대로 쓴다.
- [ ] **Step 4:** `pnpm --filter @fortuna-lottery/contract build && pnpm --filter @fortuna-lottery/contract test`. Expected: PASS.
- [ ] **Step 5:** 커밋 `feat(contract): 가정 실험실 계약`.

---

### Task 3: 가정 계산 — 풀, 가정 우주, 회차 걷기, 적중률

**Files:**
- Create: `apps/api/src/modules/hypothesis/domain/model/Assumption.model.ts`
- Create: `apps/api/src/modules/hypothesis/business/assumption.ts`, `apps/api/src/modules/hypothesis/business/assumption.test.ts`

**Interfaces:**
- Produces:
  - `Assumption.model.ts`: `export interface Assumption { readonly excludePastWinners: boolean; readonly topK: number | null }`
  - `assumption.ts` (모두 export):
    - `WARMUP_ROUNDS = 100`
    - `binomial(n: number, k: number): number`
    - `combinationKey(numbers: readonly number[]): string` (오름차순 정렬 뒤 `","` 로 잇는다)
    - `topNumbers(draws: readonly Draw[], k: number): number[]` (본 번호 출현 횟수 내림차순, 같으면 작은 번호 먼저, 결과는 오름차순 정렬)
    - `assumedCombinations(assumption: Assumption, draws: readonly Draw[]): { pool: number[]; count: number }` (지금 데이터 전체 기준)
    - `walkRounds(assumption: Assumption, draws: readonly Draw[], visit: (draw: Draw, before: { pool: number[]; pastKeys: ReadonlySet<string>; count: number }) => void): void`
    - `hitRate(assumption: Assumption, draws: readonly Draw[]): { hits: number; rounds: number; expectedRate: number }`
  - `Draw` 는 `LotterietusDraw`(`@fortuna-lottery/contract/lotterietus`)의 별칭이다. `simulation/business/backtest.ts` 와 같은 방식으로 가져온다.

계산 정의 (스펙 [§4 계산 정의](<../specs/2026-10-13-hypothesis-lab-design.md#4-계산-정의>)):
- 풀: `topK` 가 `null` 이면 1~45, 아니면 `topNumbers(draws, topK)`.
- 가정 우주 `count`: `topK` 가 `null` 이면 `TOTAL_COMBINATIONS − (excludePastWinners ? 서로 다른 과거 1등 조합 수 : 0)`. 아니면 `binomial(topK, 6) − (excludePastWinners ? 풀 안에 완전히 들어가는 서로 다른 과거 1등 조합 수 : 0)`.
- `walkRounds` 는 `draws`(회차 오름차순)를 앞에서부터 걷는다. 회차 r 에 대해 `before` 는 r 보다 앞선 회차들로만 만든다. 앞선 회차가 `WARMUP_ROUNDS` 개 미만이면 `visit` 을 부르지 않는다. 출현 횟수와 `pastKeys` 는 걸으며 누적한다(회차마다 처음부터 다시 세지 않는다).
- 적중: 그 회차의 본 번호 6개가 모두 `before.pool` 안에 있고, `excludePastWinners` 면 `before.pastKeys` 에 없다.
- `expectedRate`: 센 회차들의 `before.count / TOTAL_COMBINATIONS` 평균. 센 회차가 0 이면 `0`.

- [ ] **Step 1: 실패하는 시험을 쓴다** (`assumption.test.ts`). 회차 고정물은 `round` 1..n, `drawnAt` 아무 값의 `Draw[]` 를 만드는 작은 도우미로 짓는다.
  - `binomial(45, 6) === 8_145_060`, `binomial(20, 6) === 38_760`, `binomial(6, 6) === 1`.
  - `topNumbers`: 번호 7 이 3번, 3 과 9 가 2번씩 나온 고정물에서 `topNumbers(draws, 2)` 는 `[3, 7]`(같은 횟수면 작은 번호).
  - `assumedCombinations({ excludePastWinners: true, topK: null }, draws)`: 서로 다른 1등 조합이 2개(같은 조합이 두 번 나온 회차 포함)면 `count === 8_145_060 - 2`, `pool` 길이 45.
  - `assumedCombinations({ excludePastWinners: false, topK: 20 }, draws).count === 38_760`.
  - 남은 조합 0 개: 모든 회차가 `[1,2,3,4,5,6]` 인 고정물에서 `{ excludePastWinners: true, topK: 6 }` 의 `count === 0`.
  - 워밍업: 회차 100 개짜리 고정물에서 `hitRate(...).rounds === 0`, `expectedRate === 0`. 회차 105 개면 `rounds === 5`.
  - 누설 없음: 회차 110 개 고정물에서 회차 101 의 적중 여부를 `walkRounds` 로 기록한 뒤, 회차 102~110 의 번호를 모두 다른 값으로 바꾼 고정물로 다시 돌려도 회차 101 의 `before.pool` 과 적중 여부가 같다.
  - 가정 A 적중: 회차 101 이 회차 1 과 같은 조합이면 `{ excludePastWinners: true, topK: null }` 에서 그 회차는 적중이 아니다.
- [ ] **Step 2:** `pnpm --filter @fortuna-lottery/api exec vitest run src/modules/hypothesis/business/assumption.test.ts`. Expected: FAIL.
- [ ] **Step 3:** `Assumption.model.ts` 와 `assumption.ts` 를 위 정의대로 쓴다. `domain/model/` 에는 import 를 두지 않는다.
- [ ] **Step 4:** 같은 명령. Expected: PASS.
- [ ] **Step 5:** 커밋 `feat(api): 가정 실험실 — 풀·가정 우주·적중률 계산`.

---

### Task 4: 가정 백테스트, 가정으로 뽑기, 인기 패턴

**Files:**
- Create: `apps/api/src/modules/hypothesis/business/backtestAssumption.ts` (+ `.test.ts`)
- Create: `apps/api/src/modules/hypothesis/business/drawAssumed.ts` (+ `.test.ts`)
- Create: `apps/api/src/modules/hypothesis/business/popularity.ts` (+ `.test.ts`)

**Interfaces:**
- Consumes: Task 1 의 커널 `generate`, Task 3 의 `walkRounds`, `assumedCombinations`, `combinationKey`, `Assumption`. 커널의 `mulberry32`, `scoreAgainstDraw`, `createCombination`, `err`, `ok`, `Result`, `Combination`, `RandomPort`.
- Produces:
  - `TICKETS_PER_ROUND = 20`, `BACKTEST_SEED = 20261013`
  - `backtestAssumption(assumption: Assumption, draws: readonly Draw[]): { assumed: RankTally; random: RankTally }`, `RankTally = { tickets: number; rankCounts: number[] }` (길이 6)
  - `drawAssumed(random: RandomPort, assumption: Assumption, pool: readonly number[], pastKeys: ReadonlySet<string>, count: number): Result<Combination>`
  - `popularityPatterns(combination: Combination, draws: readonly Draw[]): PopularityPattern[]` (`PopularityPattern = HypothesisPopularityResponse["patterns"][number]` 을 `import type` 으로 만든다. 결과 순서는 `birthday, consecutive, arithmetic, pastWinner`)

동작:
- `drawAssumed`: `count === 0` 이면 `err("이 가정 아래 남은 조합이 없습니다")`. 아니면 풀 밖 번호를 `excluded` 로 넘겨 커널 `generate` 로 뽑고, `excludePastWinners` 이면서 `pastKeys` 에 있으면 다시 뽑는다.
- `backtestAssumption`: 난수는 `mulberry32(BACKTEST_SEED)` 하나. `walkRounds` 가 부르는 회차마다 가정 쪽은 `drawAssumed(rng, assumption, before.pool, before.pastKeys, before.count)` 로 20 장, 무작위 쪽은 `generate(rng)` 로 20 장을 뽑아 `scoreAgainstDraw(combination, draw.numbers, draw.bonus).rank` 를 센다. `drawAssumed` 가 실패한 회차는 가정 쪽 장수에 넣지 않는다.
- `popularityPatterns`: `birthday` = 최댓값 ≤ 31. `consecutive` = n, n+1, n+2 가 모두 있다. `arithmetic` = 정렬한 이웃 차가 모두 같다. `pastWinner` = 어느 회차의 본 번호와 같다.

- [ ] **Step 1: 실패하는 시험을 쓴다**
  - `drawAssumed`: `count` 0 이면 `ok === false` 이고 오류 문구가 위와 같다. `pool` 이 `[1..10]` 이면 뽑은 6개가 모두 1~10 이다. `pool` 이 `[1..7]` 이고 `pastKeys` 에 7개 조합 중 6개가 들어 있으면 남은 하나만 나온다(시드 몇 개로 반복).
  - `backtestAssumption`: 회차 105 개 고정물에서 `assumed.tickets === 100`, `random.tickets === 100`, 두 `rankCounts` 합이 각각 100. 같은 입력을 두 번 돌리면 결과가 같다.
  - `popularityPatterns`: `[1,2,3,10,20,30]` 은 `["birthday","consecutive"]`. `[5,10,15,20,25,30]` 은 `["birthday","arithmetic"]`. `[3,14,25,36,40,45]` 는 `[]`. 과거 회차 번호와 같은 조합은 `pastWinner` 를 포함한다.
- [ ] **Step 2:** `pnpm --filter @fortuna-lottery/api exec vitest run src/modules/hypothesis/business`. Expected: 새 시험 FAIL.
- [ ] **Step 3:** 세 파일을 위 Interfaces 와 동작대로 쓴다.
- [ ] **Step 4:** 같은 명령. Expected: PASS.
- [ ] **Step 5:** 커밋 `feat(api): 가정 실험실 — 백테스트·가정 뽑기·인기 패턴`.

---

### Task 5: 서버 모듈 조립과 엔드포인트

**Files:**
- Create: `apps/api/src/modules/hypothesis/domain/port/DrawHistoryPort.ts` (simulation 의 같은 파일을 본뜬다. 토큰 `DRAW_HISTORY = Symbol("HypothesisDrawHistoryPort")`)
- Create: `apps/api/src/modules/hypothesis/domain/port/RandomPort.ts` (generator 의 같은 파일을 본뜬다. 토큰 `RNG = Symbol("HypothesisRNG")`)
- Create: `apps/api/src/modules/hypothesis/domain/model/Evaluation.model.ts` (계약 evaluate 응답과 같은 모양의 읽기 전용 interface `Evaluation`)
- Create: `apps/api/src/modules/hypothesis/business/EvaluateAssumption.ts`, `GenerateAssumed.ts`, `CheckPopularity.ts`
- Create: `apps/api/src/modules/hypothesis/interface/facade/HypothesisFacade.ts`, `apps/api/src/modules/hypothesis/interface/api/HypothesisController.ts`
- Create: `apps/api/src/modules/hypothesis/HypothesisModule.ts`, `apps/api/src/modules/hypothesis/HypothesisModule.test.ts`
- Modify: `apps/api/src/composition/CompositionModule.ts` (모듈 등록, `HYPOTHESIS_DRAW_HISTORY` 에 `LotterietusFacade` 를 `useExisting`, exports 에 추가)

**Interfaces:**
- Consumes: Task 2 계약, Task 3·4 의 함수.
- Produces (HTTP, 전역 접두 `/api`, 셋 다 `@HttpCode(200)`):
  - `POST /api/hypothesis/evaluate` 요청 `HypothesisEvaluateRequest`, 응답 `HypothesisEvaluateResponse`
  - `POST /api/hypothesis/generate` 요청 `HypothesisGenerateRequest`, 응답 `HypothesisGenerateResponse`
  - `POST /api/hypothesis/popularity` 요청 `HypothesisPopularityRequest`, 응답 `HypothesisPopularityResponse`
- 유스케이스는 `execute(...)` 하나씩이고 `Result` 를 돌려준다. facade 는 실패를 `RequestRejected` 로 던진다. 요청의 `topK` 가 없으면 `Assumption.topK = null` 로 옮긴다. 컨트롤러는 `SimulationController` 처럼 `parseRequest` 로 요청을, 응답 스키마 `parse` 로 응답을 지킨다.
- `GenerateAssumed` 는 `assumedCombinations` 의 `pool`·`count` 와 과거 1등 조합의 `combinationKey` 집합을 데이터 전체로 만들어 `drawAssumed` 에 넘긴다. 모듈은 `{ provide: RNG, useValue: Math.random }` 를 제공한다.

- [ ] **Step 1: 실패하는 시험을 쓴다** (`HypothesisModule.test.ts`, `SimulationModule.test.ts` 의 가짜 `DRAW_HISTORY` 와 `boot` 모양을 따른다. 고정물은 회차 105 개)
  - evaluate `{ excludePastWinners: false, topK: 20 }` 는 200, `totalCombinations === 8_145_060`, `assumedCombinations === 38_760`, `pool` 길이 20, `hitRate.rounds === 5`, `backtest.random.tickets === 100`.
  - evaluate `{ topK: 20 }`(excludePastWinners 없음)는 400.
  - generate `{ excludePastWinners: true, topK: 10 }` 는 200 이고 번호 6개가 모두 응답 evaluate 의 `pool` 안에 있다.
  - generate 가 남은 조합 0 개인 가정이면 400 이고 본문 메시지가 「이 가정 아래 남은 조합이 없습니다」다. (모든 회차가 같은 조합인 고정물로 따로 띄운다.)
  - popularity `{ numbers: [1,1,2,3,4,5] }` 는 400(중복). `{ numbers: [1,2,3,10,20,30] }` 은 200, `patterns` 가 `["birthday","consecutive"]`.
- [ ] **Step 2:** `pnpm --filter @fortuna-lottery/api exec vitest run src/modules/hypothesis/HypothesisModule.test.ts`. Expected: FAIL.
- [ ] **Step 3:** 위 파일들을 simulation 모듈의 같은 역할 파일을 본떠 쓴다. `CompositionModule` 을 고친다.
- [ ] **Step 4:** 같은 명령, 이어서 `pnpm check`. Expected: PASS, lint:deps 위반 0.
- [ ] **Step 5:** 커밋 `feat(api): 가정 실험실 모듈과 엔드포인트`.

---

### Task 6: 화면 모듈 `hypothesis` 와 홈 탭

**Files:**
- Create: `apps/web/src/modules/hypothesis/index.ts`
- Create: `apps/web/src/modules/hypothesis/HypothesisLab/model/Evaluation.model.ts`, `Evaluation.viewmodel.ts`, `Evaluation.viewmodel.test.ts`
- Create: `apps/web/src/modules/hypothesis/HypothesisLab/model/Popularity.viewmodel.ts` (+ `.test.ts`)
- Create: `apps/web/src/modules/hypothesis/HypothesisLab/index.tsx`, `HypothesisLab.presenter.ts`, `HypothesisLab.presenter.test.ts`
- Create: `apps/web/src/modules/hypothesis/HypothesisLab/action/evaluateAssumption.action.ts`, `generateAssumed.action.ts`, `checkPopularity.action.ts`
- Create: `apps/web/src/modules/hypothesis/HypothesisLab/mapper/hypothesisEvaluate.mapper.ts` (+ `.test.ts`), `hypothesisGenerate.mapper.ts`, `hypothesisPopularity.mapper.ts`

지금 `apps/web/src/modules/simulation/` 이 본보기다: 모델은 뷰 폴더 안 `model/` 에, 변환기 파일과 함수 이름은 계약 어간(`hypothesisEvaluateRequest`, `hypothesisEvaluateResponse`)을, 응답 변환기는 `unknown` 이 아니라 계약 타입을 받고 action 이 `fetchJson<계약 응답 타입>` 으로 부른다. 배럴은 `SimulationCard/index.tsx` 처럼 props 타입(`HypothesisLabProps`)도 내보낸다.
- Modify: `apps/web/src/app/Home.presenter.ts`, `apps/web/src/app/Home.presenter.test.ts`, `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: Task 5 의 세 엔드포인트, Task 2 의 계약 타입(`import type`, 예: `HypothesisEvaluateRequest`).
- Produces:
  - `HypothesisLab` 컴포넌트, props `{ numbers: number[] | null; onGenerated: (numbers: number[]) => void }`. 배럴이 `HypothesisLab` 과 모델 타입을 내보낸다.
  - `HomeTabKey` 에 `"hypothesis"` 를 더하고 `TABS` 맨 끝에 `{ key: "hypothesis", label: "가정 실험실" }`. `useHomePresenter` 가 `hypothesis: { numbers: currentNumbers, onGenerated: setCurrentNumbers }` 를 돌려준다.
- 모양은 simulation 모듈을 따른다: 변환기는 계약 타입을 받아 모델로 옮기고, action 은 `fetchJson` 으로 부르며 결과·진행·오류를 훅 안에 갖고, 조정자 `useHypothesisLabPresenter(numbers, onGenerated)` 가 스위치 상태(`excludePastWinners` 기본 `true`, `topKEnabled` 기본 `true`, `topK` 기본 `20`)를 쥔다.
- evaluate 는 「가정 평가」 버튼을 누를 때 부른다. popularity 는 `numbers` 가 바뀔 때마다 부르고, `numbers` 가 `null` 이면 부르지 않는다. generate 결과는 `onGenerated` 로 셸에 넘긴다.

표시 모델 `EvaluationViewModel` 의 getter (문구는 이대로 쓴다):
- `assumedProbabilityLabel`: `assumedCombinations > 0` 이면 `1 / ${assumedCombinations.toLocaleString()}`, 아니면 `남은 조합 없음`
- `realProbabilityLabel`: `1 / ${totalCombinations.toLocaleString()}`
- `hitRateLabel`: `rounds === 0` 이면 `센 회차 없음`, 아니면 `${hits.toLocaleString()} / ${rounds.toLocaleString()}회차 (${(hits / rounds * 100).toFixed(1)}%)`
- `expectedRateLabel`: `무작위라면 ${(expectedRate * 100).toFixed(1)}%`
- `backtestRows`: 등수 1~5 마다 `{ label, assumed, random }` (라벨은 simulation 의 `RANK_LABELS` 와 같은 낱말을 이 모듈 안에 둔다. 모듈 사이 import 금지)

`PopularityViewModel.messages` 의 패턴 문구:
- `birthday`: `모든 번호가 1~31 안에 있습니다. 생일 숫자로 고르는 사람이 많습니다.`
- `consecutive`: `연속된 번호가 3개 이상 이어집니다.`
- `arithmetic`: `번호가 같은 간격으로 늘어섭니다.`
- `pastWinner`: `과거 1등 조합과 똑같습니다.`

화면 고정 문구:
- 카드 제목 `가정 실험실`, 부제 `가정을 걸면 확률이 어떻게 보이는지, 그 가정이 과거에 얼마나 맞았는지 함께 봅니다.`
- 카드 각주 `가정 확률은 가정이 참일 때만 성립합니다. 어떤 가정을 걸어도 실제 당첨 확률은 1/8,145,060 입니다.`
- 세 확률 칸의 이름: `가정 확률`, `가정 적중률`, `실제 확률`. 세 칸은 같은 크기다.
- 인기 패턴 각주 `당첨 확률은 같지만, 당첨되면 나눠 가질 사람이 많을 수 있습니다. 이 목록은 알려진 경향이며 실제 구매 데이터로 잰 것이 아닙니다.`
- 패턴이 없으면 `알려진 인기 패턴이 없습니다.`, 현재 조합이 없으면 `먼저 번호를 생성하세요`.

- [ ] **Step 1: 실패하는 시험을 쓴다**
  - `Evaluation.viewmodel.test.ts`: `assumedCombinations: 0` 이면 `남은 조합 없음`. `rounds: 0` 이면 `센 회차 없음`. `hits: 12, rounds: 1090` 이면 `12 / 1,090회차 (1.1%)`. `realProbabilityLabel === "1 / 8,145,060"`.
  - `Popularity.viewmodel.test.ts`: `["birthday","consecutive"]` 가 위 두 문구를 그 순서로 낸다. `[]` 이면 `["알려진 인기 패턴이 없습니다."]`.
  - `evaluateAssumption.mapper.test.ts`: 요청 변환이 `topKEnabled: false` 면 `topK` 를 빼고, 응답 변환이 배열을 원본과 공유하지 않는다.
  - `HypothesisLab.presenter.test.ts`: 순수 도우미 `assumptionRequest(excludePastWinners: boolean, topKEnabled: boolean, topK: number): HypothesisEvaluateRequest` 가 `(true, false, 20)` 에서 `{ excludePastWinners: true }` 를 낸다.
  - `Home.presenter.test.ts`: 생성기가 번호를 올리면 `hypothesis.numbers` 에도 같은 배열이 들어가고, `hypothesis.onGenerated(numbers)` 가 `statistics.myNumbers` 를 바꾼다. 탭 목록 끝이 `hypothesis` 다.
- [ ] **Step 2:** `pnpm --filter @fortuna-lottery/web test`. Expected: 새 시험 FAIL.
- [ ] **Step 3:** 위 파일을 쓴다. 공 표시는 `shared/ui/ball.tsx`, 카드는 `shared/ui/card.tsx` 를 쓴다. K 입력은 `<input type="number" min={6} max={45}>` 다.
- [ ] **Step 4:** `pnpm check`. Expected: 실패 0 (ESLint 화면 상태 금지 규칙 포함).
- [ ] **Step 5:** `pnpm dev` 로 띄워 탭을 열고 확인한다: 평가 버튼으로 세 확률이 나란히 나온다, 뽑기 버튼이 다른 탭의 현재 조합을 바꾼다, 현재 조합의 인기 패턴이 나온다, K 를 6 으로 내려도 화면이 깨지지 않는다.
- [ ] **Step 6:** 커밋 `feat(web): 가정 실험실 탭`.

---

### Task 7: 원칙 문구 개정과 저장소 안내 갱신

**Files:**
- Modify: `docs/superpowers/specs/2026-06-04-fortuna-lottery-design.md` (§1 의 「핵심 설계 원칙」 목록 끝과 §10 정직성 장치 목록 끝)
- Modify: `CLAUDE.md` (「이 저장소는 무엇인가」 첫 문단 끝, 「MVP 현황」에 `hypothesis` 모듈 한 줄)

- [ ] **Step 1:** 두 자리에 스펙 [§3 원칙 문구 개정](<../specs/2026-10-13-hypothesis-lab-design.md#3-원칙-문구-개정>)의 문장을 그대로 더한다.

> 가정 기반 기능은 가정 확률을 보여 줄 수 있다. 그때는 언제나 실제 확률 1/8,145,060 과 그 가정의 과거 적중률을 함께 적는다.

- [ ] **Step 2:** `CLAUDE.md` 의 「이 저장소가 정한 것」에 한 줄을 더한다: 조합 뽑기 `generate` 는 generator 와 hypothesis 가 함께 쓰므로 `packages/kernel` 에 둔다. 뼈대 블록의 커널 설명 `(combination · scoring · rng · result)` 에 `generate` 를 더한다.
- [ ] **Step 3:** 스펙 상태 줄을 `설계 확정 (구현 완료)` 로 바꾼다.
- [ ] **Step 4:** 커밋 `docs: 가정 기반 기능의 원칙 문구와 저장소 안내를 갱신한다`.
- [ ] **Step 5:** push 까지 하고 멈춘다. 되받기·병합·철거는 사람의 종료 선언 뒤에 `git-strategy` 절차로 한다.
