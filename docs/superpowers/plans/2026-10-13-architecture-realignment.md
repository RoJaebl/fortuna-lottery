# 골조 재정렬 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.


**Goal:** 로또랩을 vaults `origin/dev`(269926ee) 골조 문서와 다시 일치시킨다. 일곱 묶음(낡은 기록 · 검사기 구멍 · 서버 층 · 계약 이름 · 화면 정렬 · 포트 규약 · 디자인 케이스)을 모두 고친다.

**Architecture:** 싸고 뒤를 지켜 주는 것(기록·검사기)부터, 화면 생김새 변화(디자인)는 맨 끝. 묶음마다 `pnpm check` 와 `bash tools/checks/run-violations.sh` 가 통과해야 다음으로 간다. 서버는 모듈 하나씩, 계약 이름은 api·web 을 한 커밋에서 함께 바꾼다.

**Tech Stack:** pnpm 11 · Turborepo · TypeScript · NestJS 12 (ESM) · Prisma 6 · zod · Next.js 15 / React 19 · Tailwind v4 · Vitest 3 · dependency-cruiser · ESLint 9 · Node 22 내장 `node:test`(런처 시험)

**Spec:** `docs/superpowers/specs/2026-10-13-architecture-realignment-design.md` (커밋 `26994e9`). 골조 문서 사본은 이 기기 (세션 스크래치패드의 사본), 사람 기기 `C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/`. 각 과업은 닿는 장의 `## 규칙`·`## 하지 말 것` 을 `context-docs:context-doc-read` 로 먼저 본다.

## Global Constraints

- 사용자 기능 동작(숫자·문구·정직성 각주·`/api/*` 경로·HTTP 응답 본문 모양)은 바뀌지 않는다. 디자인 묶음(Task 16–17)의 색·간격만 예외.
- 검사기를 통과시키려고 규칙을 완화하거나 `eslint-disable`·예외 경로를 더하지 않는다.
- 도구 판본을 바꾸지 않는다. 런처는 Node 내장 모듈만 쓴다.
- vault 문서 사본은 고치지 않는다. 고칠 자리는 Task 18 의 보고 문서로 모은다.
- TDD: 커널·`business/`·표시 모델·조정자·런처의 계산은 시험을 먼저 쓴다.
- 커밋 메시지 끝에 저장소 관례의 Co-Authored-By · Claude-Session 줄. 브랜치는 `claude/serene-volta-1nrhnz`, push 전에 `git-strategy` 스킬.
- 각 Task 의 마지막 걸음은 `pnpm check` 통과 뒤 커밋이다(아래 Task 마다 반복하지 않는다).

## Review Focus

1. **void 조건 캐시의 무효화** — 픽 저장·삭제 뒤 목록이 다시 받아져야 한다. 지금 `serverCache.invalidate` 는 `query !== undefined` 조건 때문에 `Q = void` 캐시를 지우기만 하고 다시 받지도 알리지도 않는다(확인함: `apps/web/src/shared/lib/serverCache.ts`, vault 문서 §3.1 전문도 같다). → Task 9 가 시험으로 고정.
2. **서버가 죽거나 늦게 뜰 때 화면의 `/api/*`** — 503 `{ error }` 로 답하고 화면은 기존 오류 문구를 보여야 한다(무한 대기·500 금지). → Task 13.
3. **셸에 `PORT` 가 남은 상태의 `pnpm dev`** — web·api 가 같은 포트를 다투지 않아야 한다. → Task 15 `childEnv` 시험.
4. **운영자가 적은 포트가 이미 쓰이는 `pnpm start`** — 조용히 다른 포트로 옮기지 않고 이유를 한 줄로 내며 실패해야 한다. → Task 15 `pickPort` 시험.
5. **계약 이름 변경 후 응답 모양** — 이름만 바뀌고 JSON 은 같아야 한다. → Task 7 의 기존 모듈 HTTP 시험이 그대로 통과해야 하고, `PicksDelete` 응답은 지금 보내는 `{ deleted: true }` 그대로.

---

## 묶음 A — 낡은 기록

### Task 1: 문서·주석을 사실에 맞춘다

**Files (Modify):** `CLAUDE.md`, `.dependency-cruiser.cjs:44`, `apps/web/src/shared/lib/serverCache.ts:1-3`, `tools/checks/violations-config.cjs:1-2`, `tools/checks/eslint-violations/view-folder-public-surface/**/Home.presenter.ts:2`, `tools/checks/eslint-violations/viewmodel-spread/**/list.presenter.ts:2`, `tools/checks/violations/*/` 각 표본의 import 파일 첫 줄, `apps/web/src/modules/results/ResultsCard/action/checkResults.action.ts:16`(주석 유지)

- [ ] **Step 1:** CLAUDE.md 「이 저장소가 정한 것」을 고친다.
  - 「`no-deep-module-import` 는 배럴을 허용한다」 → boundary-enforcement §3 과 같다고 적고 「vault 에 보고할 것」 문장을 지운다.
  - 「서버 상태 캐시는 앞선 값을 지킨다」 → 「frontend-module-layout §3.1 그대로」 한 줄.
  - 「`domain-model-has-zero-dependencies` 는 `*.test.ts` 를 세지 않는다」 → §3 표준이라고 적는다.
  - 새 줄: 「`picks` 의 저장·삭제는 `results` 캐시를 무효화하지 않는다 — 결과 확인은 사람이 「확인」을 눌러 받는 값이다」(`checkResults.action.ts:16` 주석의 근거를 옮긴다).
  - 새 줄: 「`turbo.json` 의 `lint` 는 `^build` 에 기댄다 — baseline §3 의 `{}` 보다 엄격한 의도된 이탈」.
- [ ] **Step 2:** 주석 넷을 고친다: depcruise 44행 「이 저장소만의 완화」 → 「boundary-enforcement §3 그대로」; `serverCache.ts` 2–3행의 「한 곳만 다르다 … 되돌려 줄 것」 삭제; `violations-config.cjs` 2행 → 「exclude 가 다시 생겨도 표본을 보게 하는 방어」; ESLint 표본 두 곳의 「아직 … 없다」 → 지금 실제 사례(`PicksCard/`, `*.viewmodel.ts`).
- [ ] **Step 3:** 의존 규칙 표본 19 개의 import 파일 첫 줄에 `// 사례: <그 규칙이 잡아야 할 실제 위반 한 줄>` 을 단다(boundary-enforcement §5).
- [ ] **Step 4:** `bash tools/checks/run-violations.sh` → 모두 OK, `pnpm check` 통과, 커밋 `docs: 골조 문서가 받아들인 결정을 이탈 목록에서 거두고 낡은 주석을 고친다`.

## 묶음 B — 검사기 구멍

### Task 2: ESLint 구멍 둘과 표본

**Files:** Modify `apps/web/eslint.config.mjs`, `tools/checks/run-violations.sh`; Create `tools/checks/eslint-violations/view-folder-public-surface--alias/apps/web/src/modules/a/A.presenter.ts`(+ 대상 `a/AView/model/x.ts`), `tools/checks/eslint-violations/view-with-state--view-folder-index/apps/web/src/modules/a/AView/index.tsx`, `tools/checks/eslint-violations/view-with-state--app-shell/apps/web/src/app/page.tsx`, `tools/checks/eslint-violations/view-with-state--member/apps/web/src/modules/a/List.tsx`(`React.useState`), `tools/checks/eslint-allowed/presenter-tsx/apps/web/src/modules/a/A.presenter.tsx`(`useState` 허용)

- [ ] **Step 1:** 표본 다섯을 먼저 만들고 `run-violations.sh` 의 `EXPECT` 키를 `${name%%--*}` 로 고른다. 실행 → `view-folder-public-surface--alias`, `view-with-state--member` 가 **FAIL**(구멍 확인).
- [ ] **Step 2:** `eslint.config.mjs` 를 고친다.
  - 공개 표면 패턴 배열에 `"^@/modules/[^/]+/(?:[^/]+/)*[A-Z][A-Za-z0-9]*/"` 를 더한다(같은 메시지).
  - `VIEW_STATE_MEMBER` 선택자 `CallExpression[callee.type='MemberExpression'][callee.property.name=/^use(State|Reducer|Effect)$/]` 를 `VIEW_STATE` 와 같은 블록에 건다.
- [ ] **Step 3:** `run-violations.sh` 에 `eslint-allowed/*/` 루프(오류 0 건이어야 `OK (allowed)`)를 더한다. 실행 → 전부 OK. `pnpm --filter @fortuna-lottery/web lint` 가 실제 코드에서 새 오류를 내지 않는지 본다(내면 그 자리는 Task 10–12 대상이므로 여기서 고친다).

### Task 3: 의존 규칙 — 허용 표본, 어댑터 금지, `interface/schedule`

**Files:** Modify `.dependency-cruiser.cjs`; Create `tools/checks/allowed/domain-model-has-zero-dependencies--test/`, `tools/checks/allowed/mapper-only-from-action--mapper/`, `tools/checks/violations/business-must-not-reach-adapter/`, `tools/checks/violations/api-imports-no-module--schedule/`

- [ ] **Step 1:** 표본 넷을 만들고 실행 → 새 위반 표본 둘이 FAIL.
- [ ] **Step 2:** 규칙을 고친다.
  - 새 규칙 `business-must-not-reach-adapter`: from `/(business|context)/` → to `/domain/adapter/`, `error`, 주석 「유스케이스는 포트로만 받는다 — backend §7. vault §3 전문에 없는 저장소 규칙」.
  - `api-imports-no-module` 의 from 을 `^apps/([^/]+)/src/modules/([^/]+)/interface/(api|schedule)/` 로 넓힌다. pathNot 의 역참조는 `$1`·`$2` 그대로 유지되게 그룹 순서를 지킨다(`(api|schedule)` 는 비포획 `(?:api|schedule)`).
- [ ] **Step 3:** `run-violations.sh` → 전부 OK, `pnpm lint:deps` 위반 0.

## 묶음 C — 서버 층 (`apps/api`)

### Task 4: lotterietus — 스케줄러 자리, 설정, 포트, facade

**Files:**
- Move: `modules/lotterietus/interface/api/LotterietusIngestScheduler.ts` → `modules/lotterietus/interface/schedule/LotterietusIngestScheduler.ts`; `LotterietusIngestScheduler.test.ts` 는 그 옆으로.
- Delete: `domain/port/IngestEnabledPort.ts`
- Create: `domain/port/LoggerPort.ts`, `domain/port/SleepPort.ts`, `domain/adapter/NestLoggerAdapter.ts`, `domain/adapter/TimerSleepAdapter.ts`, `domain/model/LotterietusStatus.model.ts`, `business/ListDraws.ts`(+test), `business/GetNextDrawAt.ts`(+test)
- Modify: `LotterietusModule.ts`, `business/GetLotterietusStatus.ts`(+test), `business/IngestDraws.ts`(+test), `interface/facade/LotterietusFacade.ts`, `LotterietusModule.test.ts`

**Interfaces — Produces:**
- `export type LoggerPort = (message: string) => void; export const LOGGER = Symbol("LotterietusLoggerPort");`
- `export type SleepPort = (ms: number) => Promise<void>; export const SLEEP = Symbol("LotterietusSleepPort");`
- `export interface LotterietusStatus { readonly latest: Draw | null; readonly nextRound: number; readonly nextDrawAt: Date }` (domain/model, 무의존)
- `GetLotterietusStatus.execute(): Promise<LotterietusStatus>`
- `IngestDraws` 생성자 `(@Inject(DRAW_SOURCE) source, @Inject(DRAW_WRITER) writer, @Inject(LOGGER) logger: LoggerPort, @Inject(SLEEP) sleep: SleepPort)`; 요청 간격은 `export const INGEST_REQUEST_DELAY_MS` 상수. `INGEST_DRAWS_OPTIONS`·`IngestDrawsOptions` 삭제.
- `ListDraws.execute(): Promise<readonly Draw[]>`, `GetNextDrawAt.execute(): Date`
- `LotterietusFacade`: `status(): Promise<LotterietusStatusResponse>`(Task 7 에서 이름이 `LotterietusReadResponse` 로 바뀐다 — 이 Task 에서 facade 가 원형을 계약 모양으로 옮긴다), `ingest(): Promise<{ ingestedCount: number; latestRound: number }>`, `findAll(): Promise<LotterietusDraw[]>`(ListDraws 경유), `nextDrawAt(): string`(ISO)
- 스케줄러 생성자 `(@Inject(LotterietusFacade) lotterietus, @Inject(CONFIG) config: ApiConfig)`; `config.schedulerEnabled` 로 켠다. 다음 시각은 `new Date(this.lotterietus.nextDrawAt())`.

- [ ] **Step 1:** 시험을 먼저 고친다/쓴다: `GetLotterietusStatus.test.ts` 가 `LotterietusStatus` 원형을 기대(회차 없음 → `latest: null`), `ListDraws.test.ts`·`GetNextDrawAt.test.ts` 신설(가짜 `DrawDataPort`·`ClockPort`), `IngestDraws.test.ts` 는 `logger`·`sleep` 을 생성자 인자로 넘김, 스케줄러 시험의 `setup(ingest, enabled)` 는 `{ port: 0, schedulerEnabled: enabled } satisfies ApiConfig` 를 넘김. 실행 → FAIL.
- [ ] **Step 2:** 구현. 모듈 파일의 인라인 `ingestOptions` 를 지우고 `{ provide: LOGGER, useValue: nestIngestLogger }`, `{ provide: SLEEP, useValue: timerSleep }` 로 묶는다(어댑터 파일이 `export const nestIngestLogger: LoggerPort`, `export const timerSleep: SleepPort` 를 낸다). `INGEST_ENABLED` provider 삭제.
- [ ] **Step 3:** `pnpm --filter @fortuna-lottery/api test` → PASS(모듈 HTTP 시험 네 건 그대로 통과), `pnpm lint:deps` 위반 0.

### Task 5: picks · identity · health — 전송 무관 facade, 구현을 어댑터로

**Files:** Modify `infrastructure/http/RequestRejected.ts`, `src/configureApp.ts`, `modules/picks/PicksModule.ts`, `modules/picks/interface/facade/PicksFacade.ts`, `modules/identity/interface/facade/IdentityFacade.ts`, `src/app.module.ts`(+test); Create `modules/picks/domain/adapter/RandomPickIdAdapter.ts`, `src/infrastructure/http/HealthModule.ts`; Move `modules/identity/interface/facade/IdentityFacade.test.ts` → `modules/identity/IdentityModule.test.ts`

**Interfaces — Produces:**
- `export class ResourceNotFound extends Error {}` 와 `@Catch(ResourceNotFound) export class ResourceNotFoundFilter` → 404 `{ error: message }`. `configureApp` 이 두 필터를 모두 건다.
- `export const randomPickId: IdGeneratorPort`
- `IdentityFacade.currentUser(): Promise<{ id: string; isGuest: boolean }>` — 원형이 아닌 새 객체.
- `HealthModule`(controllers `[HealthController]`, `/api/health` → `{ ok: true }`), `AppModule` imports `[CompositionModule, HealthModule]`.

- [ ] **Step 1:** 시험: `PicksModule.test.ts` 에 「없는 픽을 지우면 404 `{ error }`」(이미 있으면 그대로), `IdentityModule.test.ts` 에 「돌려준 사용자는 어댑터의 객체와 다른 참조다」(`not.toBe`), `app.module.test.ts` 에 `/api/health` 200. 실행 → identity 시험 FAIL.
- [ ] **Step 2:** 구현. `PicksFacade.delete` 가 `throw new ResourceNotFound(result.error)`. `NotFoundException` import 제거.
- [ ] **Step 3:** api 시험 PASS, 응답 본문 그대로인지 픽 삭제 404 본문 비교.

### Task 6: 유스케이스 시험과 `DrawDataPort` 계약 시험

**Files:** Create `modules/simulation/business/BacktestCombination.test.ts`, `modules/statistics/business/GetStatistics.test.ts`, `modules/lotterietus/domain/port/DrawDataPort.contract.test.ts`

- [ ] **Step 1:** `BacktestCombination.test.ts`: 가짜 `DrawHistoryPort`(`findAll` 이 회차 3 개) → 「6 개 중복 없는 조합이면 회차 수만큼 비교한 결과를 낸다」, 「중복 번호면 `ok: false` 와 도메인 메시지」.
- [ ] **Step 2:** `GetStatistics.test.ts`: 가짜 포트 → `totalDraws`·`latestRound` 가 입력과 같다, 회차 0 개일 때의 결과(지금 동작 그대로).
- [ ] **Step 3:** `DrawDataPort.contract.test.ts`: `describe.each` 로 같은 시험(「회차 오름차순」, 「`numbers` 6 개」)을 `DummyDrawDataAdapter` 와 `PrismaDrawDataAdapter` 에 돌린다. Prisma 쪽은 `describe.skipIf(!process.env.DATABASE_URL)`.
- [ ] **Step 4:** api 시험 PASS(Prisma 는 이 세션에서 skip 으로 보고된다).

## 묶음 D — 계약 이름과 변환기

### Task 7: 계약 패키지 — 파일 구성과 이름

**Files:** Modify `packages/contract/src/{generator,lotterietus,picks,results,simulation,statistics}/{schema.ts,index.ts}`, `packages/contract/src/*/schema.test.ts`; 그리고 이름을 쓰는 `apps/api/src/**`(컨트롤러·facade·포트), `apps/web/src/**/mapper/*`

**이름 표(이 Task 가 정한다):**

| 지금 | 바뀐 뒤 |
|---|---|
| `StatisticsGetResponse(Schema)` | `StatisticsReadResponse(Schema)` |
| `LotterietusStatusResponse(Schema)` | `LotterietusReadResponse(Schema)` |
| `PicksSaveRequest(Schema)` | `PicksCreateRequest(Schema)` |
| 저장 응답으로 쓰인 `PicksItem` | `PicksCreateResponse(Schema)` = `PicksItemSchema` 별칭 |
| (없음) | `PicksDeleteResponseSchema = z.object({ deleted: z.literal(true) })` |
| `PicksItem`, `ResultsCheckItem`, `LotterietusDraw`, `GeneratorGenerate*`, `SimulationBacktest*`, `ResultsCheckResponse`, `PicksListResponse` | 그대로 |

- [ ] **Step 1:** 계약 시험의 import 이름을 표대로 바꾸고 `PicksDeleteResponseSchema` 시험(「`{ deleted: true }` 만 통과」)을 더한다 → FAIL.
- [ ] **Step 2:** 각 도메인 `schema.ts` 는 `export const …Schema` 만, `index.ts` 는 스키마를 다시 내보내고 `export type X = z.infer<typeof XSchema>` 를 둔다(wire-contract §1·§2).
- [ ] **Step 3:** api·web 의 사용처를 새 이름으로 바꾼다. `PicksController.remove` 가 `parseRequest(z.string().min(1), id)` 로 id 를 검사하고 응답을 `PicksDeleteResponseSchema.parse` 한다(그 스키마는 계약 패키지에서 가져온다).
- [ ] **Step 4:** `pnpm check` PASS — 기존 모듈 HTTP 시험이 응답 JSON 을 그대로 확인한다(Review Focus 5).

### Task 8: 화면 변환기 — 계약 어간과 계약 타입 입력

**Files:** Modify `apps/web/src/shared/lib/fetchJson.ts`(+test); Rename 일곱 변환기와 그 시험, 이를 부르는 action.

| 지금 파일 → 함수 | 바뀐 뒤 |
|---|---|
| `generateCombination.mapper.ts` → `generateCombinationRequest/Response` | `generatorGenerate.mapper.ts` → `generatorGenerateRequest/Response` |
| `getLotterietusStatus.mapper.ts` → `getLotterietusStatusResponse` | `lotterietusRead.mapper.ts` → `lotterietusReadResponse` |
| `listPicks.mapper.ts` → `listPicksResponse` | `picksList.mapper.ts` → `picksListResponse` |
| `savePick.mapper.ts` → `savePickRequest` | `picksCreate.mapper.ts` → `picksCreateRequest` |
| `checkResults.mapper.ts` → `checkResultsResponse` | `resultsCheck.mapper.ts` → `resultsCheckResponse` |
| `backtestCombination.mapper.ts` → `backtestCombination*` | `simulationBacktest.mapper.ts` → `simulationBacktestRequest/Response` |
| `getStatistics.mapper.ts` → `getStatisticsResponse` | `statisticsRead.mapper.ts` → `statisticsReadResponse` |

**Interfaces:** 응답 변환기 매개변수는 `unknown` 이 아니라 계약 타입(`res: PicksListResponse` 등). `fetchJson<T = unknown>(input: string, init?: RequestInit): Promise<T>` — action 은 contract 를 import 하지 못하므로(`contract-only-in-mapper`) `picksListResponse(await fetchJson(url))` 꼴로 변환기의 매개변수 타입이 `T` 를 정하게 한다. 추론이 안 되는 자리는 변환기 파일에 `export type` 별칭을 두지 말고 `fetchJson<Parameters<typeof picksListResponse>[0]>` 로 쓴다.

- [ ] **Step 1:** 변환기 시험 이름·import 를 바꾼다(단언 값은 그대로) → FAIL. `git mv` 로 이름을 옮겨 이력을 지킨다.
- [ ] **Step 2:** 구현·action 수정. CLAUDE.md 「변환기 파일 이름은 `<유스케이스>.mapper.ts`」 항목 삭제, 「계약 스키마는 모양 검사만」 문단의 「`unknown` 을 좁히기만」 문장을 「변환기는 계약 타입을 받아 번역만 한다 — 검증은 서버가 한다」로 고친다. wire-contract §6 회귀 신호 한 줄을 TDD 절에 더한다.
- [ ] **Step 3:** `pnpm check` PASS.

## 묶음 E — 화면 정렬 (`apps/web`)

### Task 9: 캐시 무효화 결함

**Files:** Modify `apps/web/src/shared/lib/serverCache.ts`(+`serverCache.test.ts`)

- [ ] **Step 1:** 시험 `it("조건이 없는(void) 캐시도 invalidate 하면 보고 있는 값을 다시 받고 알린다")` — `createServerCache<void, number>(() => "k", load)`, 구독 → `ensure()` → 값 1 → `invalidate()` → `load` 가 두 번 불리고 구독자가 알림을 받으며 `read()` 가 다시 받는 동안 `{ status: "loading", value: 1 }`. 실행 → FAIL.
- [ ] **Step 2:** `invalidate` 의 조건을 `watchers.has(key) && queries.has(key)` 로 고친다.
- [ ] **Step 3:** web 시험 PASS. 보고 문서(Task 18)에 vault §3.1 전문의 같은 결함을 올린다.

### Task 10: 조회 action 모양과 자식 입력 타입

**Files:** Modify `lotterietus/LotterietusCard/action/getLotterietusStatus.action.ts`, `statistics/StatisticsPanel/action/getStatistics.action.ts`, `picks/PicksCard/action/listPicks.action.ts`, 각 presenter·화면, 각 뷰의 `index.tsx`(Props export), 각 모듈 `index.ts`, `shared/ui/tabs.tsx`, `app/Home.presenter.ts`

**Interfaces:**
- `useGetLotterietusStatusAction(): { loading: boolean; error: string | null; status: LotterietusViewModel | null; retry: () => void }`
- `useGetStatisticsAction(): { loading; error; stats: StatisticsViewModel | null; retry }`
- `useListPicksAction(): { loading; error; picks: PickViewModel[]; retry }`
- `retry` = 그 캐시의 `invalidate()`.
- `export interface GeneratorCardProps`, `LotterietusCardProps`, `PicksCardProps`, `SimulationCardProps`, `StatisticsPanelProps`, `TabsProps<K>` — 배럴은 `export type`. `Home.presenter.ts` 는 `ComponentProps<typeof X>` 대신 이 타입을 쓴다.

- [ ] **Step 1:** 조정자 시험에 「불러오는 중이면 `loading` 이 참」을 각각 더한다 → FAIL.
- [ ] **Step 2:** 구현. 화면의 `!status && !error` 추론은 조정자가 낸 값으로 바꾼다.
- [ ] **Step 3:** `pnpm check` PASS.

### Task 11: 파생값을 표시 모델로, 조합 판단을 조정자로

**Files:** Modify `statistics/model/Statistics.viewmodel.ts`(+test), `simulation/model/SimulationResult.viewmodel.ts`(+test), `statistics/StatisticsPanel/{NumberFrequencyBars,SumDistributionChart,TopPairsList,RecentGrid,PatternDistribution,HotColdBoard}.tsx`, `StatisticsPanel.presenter.ts`(+test), `simulation/SimulationCard/index.tsx`, `generator/GeneratorCard/{index.tsx,GeneratorCard.presenter.ts(+test)}`, `lotterietus/LotterietusCard/{index.tsx,LotterietusCard.presenter.ts(+test)}`

**Interfaces — `StatisticsViewModel` getter(이름 고정, 모양은 화면이 쓰는 값 그대로):**
- `frequencyBars: { number: number; count: number; heightPercent: number; sharePercent: string }[]` — 지금 `NumberFrequencyBars.tsx:11-12,26,30` 의 계산.
- `sumChart: { minSum: number; maxSum: number; maxCount: number; points: { sum: number; count: number; x: number; y: number }[] }` — `SumDistributionChart.tsx:18-22`(W=560, H=140 은 화면 상수로 남기고 x·y 는 0–1 비율).
- `topPairBars: { pair: [number, number]; count: number; widthPercent: number }[]`
- `recentRange: string` — `RecentGrid.tsx:13-19` 문구 그대로.
- `oddBars`, `lowBars`: `{ label: string; count: number; percent: number; heightPx: number }[]`, `zoneBars`: 같은 모양 + 구간 라벨.
- `SimulationResultViewModel.rankRows: { rank: number; label: string; count: number; emphasized: boolean }[]` — `emphasized = rank <= 2`.
- `HotColdBoard` 의 `gap === 0 ? "최신"` 은 조정자의 `hotCold` 항목에 `gapLabel` 로.
- `GeneratorCard` 조정자가 `generateDisabled: boolean`, `modeItems: { key: GeneratorMode; label: string; active: boolean }[]`, `numberItems: { n: number; selected: boolean }[]` 를 낸다.
- `LotterietusCard` 조정자가 `ctaLabel: string`, `loading: boolean` 을 낸다.

- [ ] **Step 1:** 각 getter·조정자 값의 시험을 먼저 쓴다(지금 화면의 숫자를 고정 입력으로 그대로 재현: 예 `frequency=[…]`, `totalDraws=10` → `sharePercent` 가 지금 `toFixed(2)` 결과와 같다) → FAIL.
- [ ] **Step 2:** 구현하고 화면은 렌더만 남긴다(계산·비교·`includes` 0 건). `TOP 8`/`TOP 15` 문구는 조정자 상수에서 받는다.
- [ ] **Step 3:** `pnpm check` PASS.

### Task 12: 소유물 자리, 원형 짝, 정적 멤버, 중복 규칙

**Files:**
- Move: 각 모듈의 `modules/<m>/model/*` → `modules/<m>/<View>/model/*`(generator→`GeneratorCard`, lotterietus→`LotterietusCard`, picks→`PicksCard`, results→`ResultsCard`, simulation→`SimulationCard`, statistics→`StatisticsPanel`). 배럴 경로만 고친다.
- Split: `results/.../model/ResultsCheck.model.ts` → `ResultsDraw.model.ts`(`ResultsDrawModel`) + `ResultsCheck.model.ts`(`ResultsCheckModel`); Create `ResultsDraw.viewmodel.ts`(`static from`, `get balls`), `ResultsCard` 가 이것을 쓴다.
- Delete: `statistics/StatisticsPanel/model/Combination.model.ts` — `sumOf`·`oddCountOf`·`lowCountOf` 를 `StatisticsPanel.presenter.ts` 의 비공개 함수로, 시험은 presenter 시험으로 옮긴다.
- Create: `apps/web/src/shared/lib/formatDate.ts`(`formatDate(d: Date): string` → `YYYY.MM.DD`, `formatDateTime(d: Date): string` → `YYYY.MM.DD HH:mm`)+test, `apps/web/src/shared/lib/lotto-rules.ts`(`rankLabel(rank: number): string`, `NUMBER_ZONES: readonly { from: number; to: number; label: string }[]` = 1-10…41-45, `LOW_MAX = 22`)+test. `lotto-colors.ts` 의 구간 계산과 `PatternDistribution` 의 라벨이 `NUMBER_ZONES` 를 쓴다.
- Static: `StatisticsViewModel.glowIntensity` 정적 메서드. `RANK_LABELS` 는 `rankLabel` 로 대체되어 삭제.

- [ ] **Step 1:** `formatDate`·`lotto-rules` 시험 → FAIL → 구현 → PASS.
- [ ] **Step 2:** 이동·분리·대체. `Lotterietus.viewmodel.drawDate`, `Pick.viewmodel.savedAt`, `ResultsCheckItem.viewmodel.resultLabel` 이 공용 함수를 쓰고 기존 시험이 그대로 통과한다.
- [ ] **Step 3:** fractal §7 판정 명령 셋 0 건, `pnpm check` PASS.

## 묶음 F — 포트 규약

### Task 13: 실행 시점 프록시

**Files:** Create `apps/web/src/shared/lib/apiProxy.ts`(+test), `apps/web/src/app/api/[...path]/route.ts`; Modify `apps/web/next.config.ts`(rewrites 삭제)

**Interfaces:** `proxyToApi(request: Request, path: readonly string[], deps?: { origin?: string; fetchImpl?: typeof fetch; log?: (line: string) => void; now?: () => number }): Promise<Response>` — 요청마다 `process.env.API_ORIGIN ?? "http://127.0.0.1:4000"` 를 읽는다. 메서드·헤더·본문·쿼리를 그대로 넘긴다. 연결 실패면 503 `{ "error": "서버에 닿지 않습니다" }`, 로그는 5 초에 한 줄. `route.ts` 는 `GET`·`POST`·`DELETE`·`PUT`·`PATCH` 를 `proxyToApi` 로 넘기고 `export const dynamic = "force-dynamic"`.

- [ ] **Step 1:** 시험: 「경로·쿼리·본문을 그대로 넘긴다」, 「상태 코드와 본문을 그대로 돌려준다(404 포함)」, 「`fetchImpl` 이 ECONNREFUSED 로 던지면 503 과 오류 본문」, 「5 초 안의 두 번째 실패는 로그를 남기지 않는다」 → FAIL.
- [ ] **Step 2:** 구현, rewrites 삭제. CLAUDE.md 「브라우저는 `/api/*` 를 부른다」 문단을 경로 처리기로 고치고 「`API_ORIGIN` 은 빌드 때 굳는다」 문장을 「실행 때 읽는다」로.
- [ ] **Step 3:** `pnpm check` PASS.

### Task 14: 응용 서버가 받은 포트를 지킨다

**Files:** Modify `apps/api/src/config.ts`(+test), `apps/api/src/main.ts`; Create `apps/api/src/listen.ts`(+test)

**Interfaces:**
- `ApiConfig` 에 `strictPort: boolean` 추가 — `env.FORTUNA_STRICT_PORT === "1"`. `port` 는 `Number(env.PORT ?? 4000)` 그대로.
- 개발 모드 판정: `env.FORTUNA_MODE === "dev"` 이면 스케줄러 기본 꺼짐, `"start"` 이면 켜짐, 없으면 지금처럼 `npm_lifecycle_event`.
- `listenOnPort(listen: (port: number) => Promise<void>, port: number, opts: { strict: boolean; attempts: number; delayMs: number; sleep?: (ms: number) => Promise<void> }): Promise<void>` — `EADDRINUSE` 면 `strict` 일 때 `attempts` 번(5 회, 1000 ms) 기다렸다 다시 시도하고 끝내 실패하면 던진다. 다른 포트로 옮기지 않는다.

- [ ] **Step 1:** `config.test.ts`(`strictPort`, `FORTUNA_MODE`), `listen.test.ts`(「EADDRINUSE 두 번 뒤 성공」, 「계속 쥐여 있으면 5 번 뒤 던진다」, 「다른 오류는 바로 던진다」) → FAIL.
- [ ] **Step 2:** 구현. `main.ts` 는 선 뒤 실제 주소를 한 줄로 낸다(`서버 http://127.0.0.1:<port>/api`).
- [ ] **Step 3:** api 시험 PASS.

### Task 15: 런처 — `pnpm dev` 와 `pnpm start`

**Files:** Create `tools/launch/ports.mjs`, `tools/launch/env.mjs`, `tools/launch/launch.mjs`, `tools/launch/ports.test.mjs`, `tools/launch/env.test.mjs`, `.claude/context/launcher-ports.md`; Modify root `package.json`, `apps/api/package.json`, `apps/web/package.json`, `.env.example`, `README.md`(실행 절). 설계의 `tools/dev/launch.mjs` 는 dev·start 둘을 맡게 되어 `tools/launch/` 로 이름을 바꾼다.

**Interfaces:**
- `ports.mjs`: `isFree(port: number, host = "127.0.0.1"): Promise<boolean>`; `pickPort(opts: { from?: number; strict?: boolean }): Promise<number>` — `from` 없으면 OS 포트(0 으로 열어 번호를 읽고 닫는다), `from` 있고 `strict` 면 그 번호가 비었을 때만 돌려주고 아니면 `Error("포트 <n> 이 이미 쓰이고 있다")`, `strict` 아니면 `from` 부터 하나씩 올려 첫 빈 포트(최대 100 개).
- `env.mjs`: `childEnv(base: NodeJS.ProcessEnv, extra: Record<string, string>): NodeJS.ProcessEnv` — `PORT`·`HOST` 를 지운 뒤 `extra` 를 얹는다.
- `launch.mjs <dev|start>`:
  - dev: `pnpm --filter "./packages/*" build` 한 번 → 화면 `pickPort({ from: 3000 })`, 서버 `pickPort({ from: 4000 })` → api 는 `nest build --watch` 로 `dist` 를 내고 런처가 `dist` 를 지켜보다 300 ms 조용해지면 `node dist/main.js` 를 다시 띄운다(env: `PORT`, `FORTUNA_STRICT_PORT=1`, `FORTUNA_MODE=dev`) → 화면 `next dev -p <web>`(env: `PORT`, `API_ORIGIN=http://127.0.0.1:<api>`).
  - start: 화면·서버 포트를 `FORTUNA_WEB_PORT`·`FORTUNA_API_PORT` 가 있으면 `pickPort({ from, strict: true })`, 없으면 `pickPort({})` → `node apps/api/dist/main.js`(`FORTUNA_MODE=start`, strict) · `next start -p <web>`.
  - 두 서버가 선 뒤 한 줄: `화면 http://127.0.0.1:<web>/ · 서버 http://127.0.0.1:<api>/api`. SIGINT/SIGTERM 은 자식에게 넘기고 둘 다 끝나면 나간다. 자식 하나가 죽으면(dev 의 재시작 제외) 다른 하나도 내리고 그 종료 코드로 나간다.
- 스크립트: root `"dev": "node tools/launch/launch.mjs dev"`, `"start": "node tools/launch/launch.mjs start"`, `"test:tools": "node --test tools/launch/"`, `check` 끝에 `&& pnpm test:tools`. `turbo.json` 의 `dev` 작업 삭제. apps/api `dev` 스크립트 삭제(`nest start --watch` 를 쓰지 않는다).

- [ ] **Step 1:** `ports.test.mjs`(「쥔 포트를 건너뛴다」, 「strict 면 쥔 포트에서 이유와 함께 실패한다」, 「from 이 없으면 0 이 아닌 번호」), `env.test.mjs`(「셸의 PORT·HOST 가 자식에 새지 않는다」) → FAIL.
- [ ] **Step 2:** 구현. `.claude/context/launcher-ports.md` 에 환경 이름 표(`PORT`, `API_ORIGIN`, `FORTUNA_STRICT_PORT`, `FORTUNA_MODE`, `FORTUNA_WEB_PORT`, `FORTUNA_API_PORT`)와 기본 번호, start 의 고정 포트 이탈 근거. `.env.example`·README·CLAUDE.md 명령 절을 맞춘다.
- [ ] **Step 3:** 실제 기동 확인(DB 없이 `/api/health` 로):
  - `node -e "require('net').createServer().listen(3000)" &` 상태에서 `pnpm dev` → 한 줄이 `화면 http://127.0.0.1:3001/` 를 내고 `curl -s 127.0.0.1:3001/api/health` → `{"ok":true}`.
  - `PORT=9999 pnpm dev` → 화면·서버가 9999 를 쓰지 않는다.
  - `pnpm build && pnpm start` → OS 포트 두 개, `curl …/api/health` → `{"ok":true}`.
  - `FORTUNA_API_PORT=<쥔 포트> pnpm start` → 이유 한 줄과 함께 0 아닌 코드로 끝난다.
  - api 를 죽인 채 화면의 `/api/health` → 503.

## 묶음 G — 디자인 케이스 (standard-light, 초록 주 단추)

### Task 16: 토큰 뿌리

**Files:** Modify `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`, `.claude/context/design-system.md`

- [ ] **Step 1:** `globals.css` 에 foundation 전문(`standard-light-foundation.md` 318–396 행)을 그대로 붙이고 브랜딩 자리만 바꾼다:
  - `--ui-strong: #047857` (emerald-700; 흰 글자 대비 5.48 — 지금 쓰는 emerald-600 은 3.77 로 4.5 미달이라 한 단 어둡게. **[이 계획의 판단]**), `--ui-on-strong: #ffffff`.
  - `--ui-accent`·`--ui-info` 는 초록과 어울리는 값을 골라 작업면 위 대비 4.5 이상을 잰다(측정 스크립트 결과를 커밋 메시지에 적는다).
  - 표면·선은 그대로.
- [ ] **Step 2:** Tailwind v4 `@theme inline` 으로 잇는다: `--color-{bg,panel,raised,said,inset,selected,line,text,muted,strong,on-strong,accent,ok,warn,danger,info,busy}: var(--ui-…)`, `--text-{display,head,sub,read,body,small,micro,nano}: var(--text-…)`, `--radius-{panel,card,box,button,pill}: var(--r-…)`, `--font-sans: var(--ui-font-sans)`.
- [ ] **Step 3:** `layout.tsx` 의 `<html lang="ko" data-ground="paper">`. `design-system.md` 를 「케이스: standard-light / 값의 SSOT 는 `globals.css` 의 `:root` / 브랜딩 자리 넷과 고른 값 / 초록은 실행 전용·탭은 무채색 / 도메인 예외: 로또 공 색(`lotto-colors.ts`)」으로 다시 쓴다.

### Task 17: 컴포넌트를 토큰으로

**Files:** Modify `shared/ui/{card,tabs,ball}.tsx`, `app/page.tsx`, 각 모듈 화면(위 grep 목록: emerald 5 곳, violet 1, sky 4, shadow 2, `text-[..]` 8, hex 6)

- [ ] **Step 1:** 치환 규칙을 적용한다.
  - 채움 CTA(emerald·violet·sky 버튼 전부) → `bg-strong text-on-strong`, 호버는 `hover:opacity-90`. 머리글 `Lotto Lab`·모드 토글 선택 → `text-strong`/`bg-strong`.
  - 정보 강조(sky 글자·막대) → `text-info`/`bg-info`, 경고(amber) → `warn`, 성공 → `ok`, 오류 → `danger`. violet 은 남기지 않는다.
  - `slate-*` → `text`/`muted`/`line`/`said`/`inset`. 탭은 무채색(`strong` 이 초록이 되므로 탭 활성은 `text-text border-text`, 칩 활성은 `bg-text text-bg`).
  - 카드: `rounded-card border border-line bg-panel`, 그림자 없음.
  - 글자: `text-[10px]`/`text-[11px]` → `text-nano`/`text-micro`, `text-xs`/`text-sm`/`text-base` → `text-small`/`text-body`/`text-read` 중 가까운 단.
  - 간격: `*-0.5`, `*-1.5`, `*-2.5` → 4px 칸으로 반올림.
  - 차트 hex → `var(--ui-info)`, `var(--ui-warn)`, `var(--ui-muted)`, `var(--ui-line)`.
  - 가로 스크롤(`RecentGrid`, 칩 목록) → `[scrollbar-gutter:stable]`.
- [ ] **Step 2:** 남은 값 검사: `grep -rnE "emerald-|violet-|sky-|slate-|amber-|shadow-|text-\[|#[0-9a-fA-F]{3,6}" apps/web/src --include=*.tsx` → `lotto-colors.ts`·`icon.svg` 외 0 건.
- [ ] **Step 3:** 전후 스크린샷: 변경 전 커밋과 변경 후를 각각 `pnpm build && pnpm start` 로 띄워(DB 없으면 사람 기기에서) Playwright MCP 로 홈·각 탭을 찍어 `docs/superpowers/reports/2026-10-13-design-before-after/` 에 둔다. 띄울 수 없으면 사람에게 확인을 넘긴다고 보고한다.
- [ ] **Step 4:** `pnpm check` PASS.

## 마무리

### Task 18: 보고와 최종 확인

**Files:** Create `docs/superpowers/reports/2026-10-13-vault-feedback.md`; Modify `CLAUDE.md`

- [ ] **Step 1:** 보고 문서에 설계 7절의 여섯 항목 + `serverCache.invalidate` 의 void 조건 결함(frontend-module-layout §3.1 전문 199 행) + start 의 고정 포트 이탈을 적는다.
- [ ] **Step 2:** CLAUDE.md 「이 저장소가 정한 것」에 의도된 이탈을 더한다: 컨트롤러가 `infrastructure/http/parseRequest` 를 쓴다, 스케줄러는 `interface/schedule/`, `business-must-not-reach-adapter` 저장소 규칙, start 의 운영자 포트는 고정. 명령 절의 `pnpm dev`·`pnpm start`·`API_ORIGIN` 설명을 런처 기준으로.
- [ ] **Step 3:** `pnpm check`, `bash tools/checks/run-violations.sh`, `pnpm check:migration`(「옛 구역 파일: 0」) 모두 통과. 대조 감사를 다시 돌려 설계 3절 항목이 남지 않았는지 확인.

---

## 실행 방식

`/gaon:ship` 보다 **`/gaon:build`(체크포인트마다 확인)** 를 권한다 — 묶음 F(실행 방식)와 G(화면 생김새)는 사람이 실제로 띄워 보고 판단해야 하는 자리이고, 과업 수가 18 개라 묶음 경계에서 멈춰 확인하는 비용이 작다.
