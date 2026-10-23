# 골조 재정렬 설계 — vault 골조 문서와 다시 맞춘다

- 작성일: 2026-10-13
- 상태: 설계안 (스펙 리뷰 대기)
- 기준 문서: vaults `origin/dev`(269926ee) 의 `docs/context/architecture/` 전체
  (이 기기에서는 `C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/`)
- 앞선 이관: [골조 이관 계획](<../plans/2026-09-29-vault-architecture-migration.md>) — 2026-09-29 에 끝났다

## 1. 의도 — 왜 지금 하는가

2026-09-29 이관으로 로또랩은 vault 골조(두 서버)에 섰고, 경계 검사기는 지금도 위반 0 을 낸다
(`pnpm check` 통과: depcruise 273 modules 위반 0, 테스트 kernel 12 · contract 37 · api 89 · web 43).

그런데 그 뒤로 두 가지가 바뀌었다.

- vault 골조 문서가 자라났다. `launcher-ports`(포트 규약, 2026-10-07 신설 · 10-08 정정)와
  `style-design` 묶음(디자인 케이스 규격)이 생겼고, 09-29 개정으로 이 저장소가 「이탈」로 적어 둔
  결정 셋(배럴 import 허용, 시험 파일 제외, 캐시가 앞선 값을 지킴)이 문서의 정본이 되었다.
- 검사기가 보지 못하는 규칙(층마다 무엇을 담는가, 계약 이름, 파생값의 자리)은 이관 때 일부만
  맞춰졌다. 2026-10-13 문서 대조에서 약 50 개의 어긋남이 나왔다.

이번 작업의 목적은 **「검사기가 통과한다」가 아니라 「문서의 규칙과 코드가 일치한다」를 회복하는 것**이고,
다시 어긋나지 않도록 검사기의 구멍과 낡은 기록을 함께 고치는 것이다. 정직한 통계라는 제품 원칙과
기능 동작은 건드리지 않는다.

## 2. 목표 · 비목표 · 반목표

### 목표

1. 아래 3절의 일곱 묶음을 모두 고친다. 사용자가 전부 진행하기로 정했다(2026-10-13).
2. 묶음마다 `pnpm check` 가 통과한 상태로 커밋한다. 묶음 사이에도 앱은 온전히 동작한다.
3. 저장소가 문서와 다르게 가기로 한 자리는 CLAUDE.md 「이 저장소가 정한 것」에 근거와 함께 남기고,
   문서 쪽이 고쳐져야 할 자리는 「vault 에 보고할 것」 목록(7절)으로 모은다.

### 비목표

- 새 기능, 인증, 픽의 영속화(Supabase) — v1 문서의 후속 단계이며 이번 범위가 아니다.
- vault 문서 자체를 고치는 일. 이 저장소에서는 보고 목록만 만든다.
- 미병합 브랜치 `vaults/frontend-docs+` 의 내용(프론트 문서의 `frontend/` 묶음, 아이콘 규격).
  `dev` 에 병합되면 그때 별도 대조한다. **[내 판단]**

### 반목표 — 기술적으로 돌아가도 실패인 것

- 사용자가 보는 숫자·문구·정직성 각주가 바뀐다(디자인 묶음의 색·간격 변화는 예외).
- 검사기를 통과시키려고 규칙을 완화하거나 `eslint-disable`·예외 경로를 더한다.
- 고친 자리를 시험이 지켜 주지 않는다(파생값을 표시 모델로 올렸는데 그 getter 의 시험이 없다 등).
- 한 묶음이 반쯤 끝난 채 다음 묶음으로 넘어간다.

## 3. 어긋남과 고치는 방향 — 일곱 묶음

각 항목의 근거 절은 대조 결과에서 왔다. 실행 순서는 4절에 있다.

### 묶음 A. 낡은 기록 바로잡기 (문서·주석만)

| 자리 | 지금 | 고친 뒤 |
|---|---|---|
| CLAUDE.md 「`no-deep-module-import` 는 배럴을 허용한다」 | 「boundary-enforcement §3 문구와 어긋난다 — vault 에 보고할 것」 | 「§3 과 같다」. 보고 문구 삭제 |
| CLAUDE.md 「서버 상태 캐시는 앞선 값을 지킨다」 | 문서와의 차이로 적음 | frontend-module-layout §3.1 이 받아들였으므로 「§3.1 그대로」로 줄인다 |
| CLAUDE.md 「변환기 파일 이름은 `<유스케이스>.mapper.ts`」 | 결정으로 적음 | 묶음 D 에서 계약 어간으로 바꾸므로 삭제 |
| CLAUDE.md 「`domain-model-has-zero-dependencies` 는 `*.test.ts` 를 세지 않는다」 | 저장소 결정처럼 적음 | §3 표준임을 적는다 |
| `.dependency-cruiser.cjs:44` 주석 | 「이 저장소만의 완화」 | 「boundary-enforcement §3 그대로」 |
| `apps/web/src/shared/lib/serverCache.ts:2-3` 주석 | 「한 곳만 다르다… vault 에 되돌려 줄 것」 | 삭제 |
| `tools/checks/violations-config.cjs:1-2` 주석 | 「옛 구역 경로와 겹치므로」 | 「exclude 가 생겨도 표본을 보게 하는 방어」 |
| ESLint 표본 주석 두 곳 (`view-folder-public-surface`, `viewmodel-spread`) | 「아직 뷰 폴더·표시 모델이 없다」 | 지금의 실제 사례로 바꾼다 |
| 의존 규칙 표본 19 개 | 사례 주석 없음 (§5 위반) | 각 표본 첫 줄에 그 규칙이 잡아야 할 사례 한 줄 |
| `picks` → `results` 캐시 무효화 | `checkResults.action.ts:16` 주석에만 「일부러 무효화하지 않는다」 | CLAUDE.md 「이 저장소가 정한 것」에 결정과 근거로 올린다 |
| `turbo.json` 의 `lint.dependsOn: ["^build"]` | 기록 없음 | 의도된 이탈(더 엄격)로 CLAUDE.md 에 한 줄 |

### 묶음 B. 검사기 구멍 막기

1. **뷰 폴더 공개 표면을 `@/` 별칭이 빠져나간다.** `apps/web/eslint.config.mjs:39` 의 패턴이 상대 경로만
   본다. `^@/modules/[^/]+/(?:[^/]+/)*[A-Z][A-Za-z0-9]*/` 꼴을 더하고 `view-folder-public-surface--alias`
   표본을 둔다. 고치기 전에 표본이 통과(=구멍)하는 것을 먼저 보이고, 고친 뒤 잡히는 것을 보인다.
2. **`React.useState` 꼴.** 멤버 호출 선택자를 `VIEW_STATE` 와 함께 건다(boundary-enforcement §4).
3. **허용 표본 셋을 더한다.** `allowed/domain-model-has-zero-dependencies--test`,
   `allowed/mapper-only-from-action--mapper`, 그리고 ESLint `*.presenter.tsx` ignore 의 허용 표본.
   ESLint 허용 표본은 「오류 0 건이어야 통과」하는 루프를 `run-violations.sh` 에 더한다.
4. **화면 상태 금지 표본을 둘 더한다.** 뷰 폴더 `index.tsx` 와 `app/` 의 `.tsx`.
5. **서버 층 검사의 빈자리.** 「`business`·`context` → `domain/adapter` 금지」 규칙을 depcruise 에 더하고
   표본을 둔다. 문서 §3 전문에 없는 규칙이므로 저장소 규칙으로 두고 7절 보고 목록에 올린다. **[내 판단]**

### 묶음 C. 서버 층 정렬 (`apps/api`)

| # | 어긋남 | 고치는 방향 |
|---|---|---|
| C1 | 수집 스케줄러가 HTTP 전용 자리 `interface/api/` 에 있다 (`lotterietus/interface/api/LotterietusIngestScheduler.ts`) | `interface/schedule/` 로 옮긴다. 스케줄러는 facade 만 부르는 들어오는 자리라 `api/` 와 같은 의존 규칙을 받는다. depcruise 의 `api-imports-no-module` 류 규칙이 `interface/schedule/` 에도 걸리게 한다. 문서에 이 자리가 없으므로 보고 목록에 올린다. **[내 판단]** |
| C2 | 켜고 끄는 boolean 을 포트로 감쌌다 (`domain/port/IngestEnabledPort.ts`) | 설정은 `@Inject(CONFIG)` 로 받는다(backend §7 하지 말 것). 포트를 지운다 |
| C3 | `PicksFacade` 가 HTTP 예외 `NotFoundException` 을 던진다 | 전송을 모르는 「없음」 오류를 `infrastructure/http` 의 기존 `RequestRejected` 옆에 두고, 예외 필터가 404 로 옮긴다 |
| C4 | `IdentityFacade` 가 도메인 원형 `User` 를 그대로 내보낸다 | 받는 쪽 포트 타입 모양의 새 객체를 만들어 돌려준다 |
| C5 | `GetLotterietusStatus` 유스케이스가 응답 모양을 짓는다 | 유스케이스는 원형을 돌려주고 facade 가 옮긴다 |
| C6 | `LotterietusFacade` 의 `ingest()`·`nextDrawAt()`·`findAll` 이 유스케이스 없이 포트를 직접 부르고 `Date`·business 타입을 돌려준다 | 유스케이스로 감싸고, 반환은 직렬화 가능한 값(ISO 문자열 등)으로 한다 |
| C7 | `IngestDraws` 가 주입 토큰과 옵션 타입(logger·sleep)을 `business/` 안에 선언한다 | `domain/port/` 의 `LoggerPort`·`SleepPort` 로 옮기고 어댑터를 둔다 |
| C8 | 모듈 파일에 구현이 있다 (`PicksModule.ts:13` 의 `newPickId`, `LotterietusModule.ts:18` 의 로거) | `domain/adapter/` 로 옮기고 provider 로 묶는다 |
| C9 | `app.module.ts` 가 `HealthController` 를 직접 선언한다 | `infrastructure/http` 의 작은 모듈로 옮긴다 |
| C10 | 컨트롤러가 `infrastructure/http/parseRequest` 를 import 한다. backend §2 표는 api 가 볼 수 있는 것에 `infrastructure/` 를 넣지 않는다 | 코드는 그대로 두고 CLAUDE.md 에 의도된 이탈로 적고 보고 목록에 올린다. 요청 파싱을 컨트롤러마다 복제하는 것이 더 나쁘다. **[내 판단]** |
| C11 | `BacktestCombination`·`GetStatistics` 에 가짜 포트를 끼운 유스케이스 시험이 없다 | 가짜 `DrawHistoryPort` 로 시험을 먼저 쓴다(TDD) |
| C12 | `IdentityFacade.test.ts` 가 facade 폴더에 있다 | `identity/IdentityModule.test.ts` 로 옮긴다 |
| C13 | 대체 어댑터로 교체 가능성을 증명하지 않는다(backend §6·§8) | `DrawDataPort` 의 계약 시험 하나를 두고 `DummyDrawDataAdapter` 와 `PrismaDrawDataAdapter` 에 함께 돌린다. Prisma 쪽은 `DATABASE_URL` 이 없으면 건너뛴다(`describe.skipIf`). 그래서 `pnpm check` 는 DB 없이도 통과하고, DB 가 있는 기기에서는 실제 어댑터까지 증명한다. 나머지 포트는 구현이 하나라 대상이 아니다. **[내 판단]** |

### 묶음 D. 계약 이름과 변환기 (`packages/contract`, `apps/api`, `apps/web`)

wire-contract §4 를 따른다. 사용자가 일곱 묶음을 모두 진행하기로 했으므로 저장소 결정을 버리고 문서 쪽으로
맞춘다. **[내 판단]**

1. **이름.** 동작 이름은 List·Read·Create·Update·Delete, 어디에도 맞지 않으면 동사.
   - `StatisticsGetResponse` → `StatisticsReadResponse`
   - `LotterietusStatusResponse` → `LotterietusReadResponse`
   - 픽 저장은 「만들기」이므로 `PicksSaveRequest` → `PicksCreateRequest`, 저장 응답 `PicksItem` →
     `PicksCreateResponse`. 변환기는 `picksCreate.mapper.ts`. **[내 판단: Save 는 표준 동작 Create 에 맞는다]**
   - 삭제에 `PicksDeleteResponse` 스키마를 더하고, 컨트롤러가 `id` 를 파싱하고 응답을 `.parse` 한다
   - 표준 동작에 맞지 않는 동사는 그대로 둔다: `GeneratorGenerate`, `SimulationBacktest`, `ResultsCheck`
   - 요청·응답이 아닌 부분 모양(`PicksItem` 목록 항목, `ResultsCheckItem`, `LotterietusDraw`)은 이름 규칙
     대상이 아니므로 그대로 둔다. 저장 응답이 목록 항목과 같은 모양이면 `PicksCreateResponseSchema =
     PicksItemSchema` 별칭으로 둔다
2. **파일 구성.** `schema.ts` 는 스키마만, `index.ts` 가 `z.infer` 타입을 내보낸다(wire-contract §1·§2).
3. **변환기.** 파일과 함수를 계약 어간으로 짓는다: `savePick.mapper.ts` → `picksSave.mapper.ts`,
   `savePickRequest` → `picksSaveRequest`. 일곱 파일 모두.
4. **변환기의 입력 타입.** 응답 변환기는 `unknown` 이 아니라 계약 타입을 받는다(wire-contract §2·§3).
   action 이 `fetch` 결과를 계약 타입으로 단언하고 변환기에 넘긴다. 검증은 여전히 서버가 하고 화면은
   번역만 한다. CLAUDE.md 「계약 스키마는 모양 검사만 담는다」 문단의 「`unknown` 을 좁히기만」 문장을
   이에 맞춰 고친다.
5. **회귀 신호.** 「스키마를 고쳤는데 번역측 시험이 하나도 깨지지 않으면 이상 신호이고 그 방어선은
   사람이다」(wire-contract §6)를 CLAUDE.md 에 한 줄로 둔다.

### 묶음 E. 화면 정렬 (`apps/web`)

| # | 어긋남 | 고치는 방향 |
|---|---|---|
| E1 | 화면이 파생값을 계산한다: `NumberFrequencyBars`, `SumDistributionChart`, `TopPairsList`, `RecentGrid`, `PatternDistribution`, `HotColdBoard`, `SimulationCard` | `StatisticsViewModel`·`SimulationResultViewModel` 의 getter 로 올린다. getter 마다 `*.viewmodel.test.ts` 를 먼저 쓴다 |
| E2 | 화면이 입력을 조합한다: `GeneratorCard` 의 `!canGenerate \|\| busy`, `mode === key`, `selected.includes(n)`; `LotterietusCard` 의 로딩 판정·CTA 라벨 | 조정자가 `generateDisabled`, 항목별 `{ n, selected }`, `ctaLabel` 을 낸다 |
| E3 | 조회 action 이 `loading`·`retry` 를 내지 않는다 (`getLotterietusStatus`, `getStatistics`, `listPicks`) | `{ loading, error, 값, retry }` 로 맞춘다. `retry` 는 캐시 무효화 |
| E4 | 뷰 하나만 쓰는 `model/` 이 모듈 루트에 있다(여섯 모듈). `statistics` 는 루트와 `StatisticsPanel/model/` 로 둘로 갈렸다 | 각 `<View>/model/` 로 내리고 배럴 경로만 고친다(fractal §3·§4.1) |
| E5 | `Combination.model.ts` 에 자유 함수 모음 | 조정자 안의 비공개 함수로 옮긴다 |
| E6 | `ResultsCheck.model.ts` 에 클래스 둘, `ResultsDrawModel` 에 표시 모델 짝이 없다 | `ResultsDraw.model.ts` 와 `ResultsDraw.viewmodel.ts` 로 나눈다 |
| E7 | 메모리 규칙 2·4조: `RANK_LABELS` 모듈 상수, `glowIntensity` 자유 함수 | 클래스 정적 멤버로 옮긴다 |
| E8 | 같은 파생 규칙이 두 곳: 등수 라벨, 날짜 서식, 번호 구간 경계 | 날짜 서식은 `shared/lib/` 로. 등수 라벨과 구간 경계는 한 곳에 정의하고 양쪽이 쓴다 |
| E9 | 자식이 입력 타입을 공개하지 않아 `Home.presenter.ts` 가 `ComponentProps<typeof X>` 로 우회한다 | `export interface XProps` 와 배럴의 `export type` |

### 묶음 F. 포트 규약 (`launcher-ports`)

지금은 포트를 고르는 자리가 둘이다(`next dev` 3000, `apps/api/src/config.ts` 의 `PORT ?? 4000`).
문서는 고르는 자리를 띄우는 프로그램 하나로 모으라고 한다.

1. **런처 `tools/dev/launch.mjs` 를 둔다.** `pnpm dev` 가 이것을 부른다. **[내 판단: 이름과 자리]**
   - 화면 3000, 서버 4000 에서 시작해 쥐여 있으면 하나씩 올려 빈 포트를 고른다.
   - 사람 셸의 `PORT`·`HOST` 를 비운 환경으로 자식을 띄우고, 서비스마다 이름을 골라 넘긴다:
     화면에는 `PORT=<화면>`·`API_ORIGIN=http://127.0.0.1:<서버>`, 서버에는 `PORT=<서버>`·`FORTUNA_STRICT_PORT=1`.
   - 두 서버가 선 뒤 열린 자리 한 줄만 알린다: `화면 http://127.0.0.1:N/ · 서버 http://127.0.0.1:M/api`.
   - 다시 띄우기는 런처가 맡는다(§5). api 는 `tsc --watch` 가 낸 `dist` 를 런처가 지켜보다 조용해진 뒤
     한 번 다시 띄운다. `nest start --watch` 는 쓰지 않는다.
   - 공용 패키지(`packages/contract`·`packages/kernel`)는 런처가 시작할 때 한 번 빌드한다. 지금
     `turbo dev` 의 `^build` 와 같은 동작이다 — 계약을 고치면 개발 서버를 다시 띄운다. 패키지 감시는
     이번 범위가 아니다. **[내 판단]**
   - turbo 는 `build`·`check` 에만 남는다.
2. **받는 쪽은 옮기지 않는다.** 화면은 `next dev -p $PORT` 로 받은 포트에 고정한다. 서버는
   `FORTUNA_STRICT_PORT=1` 이면 `EADDRINUSE` 에 몇 초 재시도한 뒤 죽는다.
3. **프록시를 실행 시점으로 옮긴다.** 지금 `next.config.ts` 의 `rewrites` 는 `API_ORIGIN` 을 빌드 때 굳힌다.
   그래서 빌드 서버가 OS 포트에 서면 화면이 서버를 찾을 수 없다. `apps/web/src/app/api/[...path]/route.ts`
   경로 처리기가 요청마다 `process.env.API_ORIGIN` 을 읽어 넘기게 바꾸고 `rewrites` 를 지운다. 서버에 닿지
   않으면 503 을 주고 몇 초에 한 줄만 적는다(§7). CLAUDE.md 「브라우저는 `/api/*` 를 부른다」 문단을
   고친다. **[내 판단: rewrites → 경로 처리기]**
4. **빌드 서버.** `pnpm start` 는 빌드된 소스를 실제 서비스로 띄우는 명령이다(사용자 확인, 2026-10-13).
   같은 런처가 「빌드 모드」로 두 서버를 띄우고, 서버 주소를 화면에 `API_ORIGIN` 으로 넘긴다.
   - 운영자가 포트를 적지 않으면 두 서버 모두 OS 가 준 빈 포트에 서고, 열린 주소를 한 줄로 알린다(문서 §1).
   - 운영자가 `FORTUNA_WEB_PORT`·`FORTUNA_API_PORT` 를 적으면 그 번호에 **고정으로** 선다. 쥐여 있으면
     피해 가지 않고 실패로 끝낸다. 실제 서비스 앞에는 그 번호를 보는 리버스 프록시나 방화벽 규칙이 있을
     수 있어, 조용히 다른 번호로 옮기면 서비스가 끊기기 때문이다. 문서는 「`PORT` 를 적으면 그 번호부터
     피해 간다」고 하므로 이것은 의도된 이탈이고, CLAUDE.md 에 적고 보고 목록에 올린다. **[내 판단]**
   - 서버는 화면 앞에 바로 노출되지 않는다. 브라우저는 화면의 `/api/*` 만 부르고, 화면의 경로 처리기가
     요청마다 `API_ORIGIN` 을 읽어 넘긴다(위 3). 그래서 빌드 결과 하나를 어느 포트 조합에서도 쓸 수 있다.
   - 회차 수집 스케줄러는 지금처럼 `start` 에서 기본으로 켜진다.
   - 문서의 빌드 서버는 「혼자 뜨는 서버」를 전제하므로, 두 서버가 짝으로 뜨는 이 경우는 보고 목록에 올린다.
5. **환경 이름 표.** `.claude/context/launcher-ports.md` 에 실제 환경 이름과 기본 번호를 둔다.
   `.env.example` 도 맞춘다. `FORTUNA_PUBLIC_URL`(§3)은 지금 소비자가 없어 두지 않는다.
6. 개발 모드 판정은 지금처럼 `npm_lifecycle_event` 로 하되, 런처가 띄우면 런처가 명시적으로 넘긴다.

### 묶음 G. 디자인 케이스 채택 (`style-design`)

문서는 기존 저장소에 소급을 요구하지 않지만, **사용자가 이 묶음까지 진행하기로 정했다(2026-10-13).**
케이스는 standard-light 다 — 지금 생김새(흰 바탕·먹색 글자·라이트 단일)와 가장 가깝다. **[내 판단]**
채택하면 그 케이스 안의 것이 전부 걸린다.

1. **선언.** `.claude/context/design-system.md` 를 「케이스: standard-light」를 선언하는 문서로 다시 쓴다.
   값의 SSOT 는 `apps/web/src/app/globals.css` 의 `:root` 로 옮기고, 이 문서는 케이스 선언·값 교체 자리·
   도메인 예외(로또 공 색)만 담는다.
2. **토큰.** foundation 전문(`--ui-*`, 글자 여덟 단, 4px 간격, 모서리 위계)을 `globals.css` 에 붙이고
   Tailwind `@theme` 로 잇는다. 컴포넌트는 Tailwind 팔레트 이름(`slate-*`, `emerald-*`)과 임의값
   (`text-[10px]`)을 쓰지 않고 토큰 유틸리티만 쓴다.
3. **주 액션.** emerald 는 채움 CTA 네 곳, 머리글 `Lotto Lab`(`app/page.tsx:30`), `GeneratorCard` 모드 토글의
   선택 상태에 쓰인다. 케이스의 「브랜딩을 갈아 끼우는 자리」는 `--ui-accent`·`--ui-strong`·`--ui-on-strong`·
   `--ui-info` 를 브랜드색으로 바꾸는 것을 같은 케이스 안에서 허용한다. 그래서 초록을 지키는 것도
   standard-light 채택이다. **사용자가 초록을 지키기로 했다(2026-10-13).**
   - `--ui-strong`·`--ui-on-strong` 을 emerald 계열(지금의 `emerald-600` 과 흰 글자)로 바꾼다. 작업면 위 대비
     4.5 이상을 먼저 잰다.
   - `--ui-accent`·`--ui-info` 는 초록과 어울리게 함께 고른다. 머리글 `Lotto Lab` 과 모드 토글 선택 상태는
     이 토큰을 쓴다. 정확한 값은 만드는 사람이 대비를 재서 정하고 스크린샷으로 보인다.
   - 탭(내비게이션)은 지금처럼 무채색을 유지한다 — 「초록은 실행 전용」이라는 지금 규칙을 지킨다.
   - 표면과 선은 바꾸지 않는다(바꾸면 다른 케이스가 된다).
   - 값 교체 자리 넷과 고른 값을 `design-system.md` 에 적는다.
4. **신호 다섯.** ok/warn/danger/info/busy 로 사상한다. `accent-special`(violet)은 케이스에 대응 토큰이
   없으므로 없앤다(생성기 강조는 strong 또는 info 로). **[내 판단]**
5. **차트와 그 밖의 직접 값.** `SumDistributionChart`·`RecentGrid` 의 hex 를 토큰 변수로.
6. **카드.** 종이 바닥에서 그림자를 쓰지 않는다: `shadow-sm` 을 빼고 `--ui-line` 테두리, `--r-card`.
7. **바닥.** `<html data-ground="paper">`.
8. **스크롤.** 가로 스크롤 영역(`RecentGrid`, `tabs`)에 `scrollbar-gutter: stable`.
9. **예외.** 로또 공 색은 도메인 규칙이라 케이스 밖이다. 그대로 둔다.
10. 색 대비는 케이스가 잰 값을 그대로 쓴다. 바꾼 화면은 Playwright 스크린샷으로 전후를 남겨 사람이 본다.

## 4. 실행 순서와 단위

순서는 「싸고 뒤를 지켜 주는 것 먼저, 화면 생김새 변화는 맨 끝」이다.

1. **A 낡은 기록** — 코드 동작 변화 없음.
2. **B 검사기 구멍** — 이후 묶음을 검사기가 지킨다.
3. **C 서버 층** — 모듈 하나씩. 모듈마다 모듈 시험(HTTP)이 그대로 통과해야 한다.
4. **D 계약과 변환기** — 계약 이름 변경은 api 와 web 을 함께 고치는 한 커밋 단위로. 도메인 하나씩.
5. **E 화면 정렬** — 모듈 하나씩. 파생값을 올릴 때 viewmodel 시험을 먼저.
6. **F 포트 규약** — 런처 · 받는 쪽 · 프록시 · 빌드 모드 순.
7. **G 디자인** — 토큰 도입 → 컴포넌트 치환 → 주 액션·카드 순. 스크린샷 전후.

각 묶음 끝에서 `pnpm check` 와 `bash tools/checks/run-violations.sh` 가 통과해야 다음으로 간다.
F 는 추가로 실제 기동을 확인한다: 3000 을 다른 프로세스가 쥔 상태에서 `pnpm dev` 를 띄워 화면이
3001 에 서고 서버에 닿는지, `pnpm build && pnpm start` 에서 두 서버가 OS 포트에 서고 화면이 서버에
닿는지.

브랜치는 git-strategy 스킬이 정한다. 이 설계와 이어질 계획 문서는 구현 커밋보다 먼저 커밋한다.

## 5. 제약

- 사용자 기능 동작(숫자, 문구, 정직성 각주, API 경로 `/api/*`)은 바뀌지 않는다. HTTP 응답 본문 모양도
  바뀌지 않는다 — 계약 이름 변경은 타입·스키마 이름만 바꾼다. 삭제 응답에 스키마를 더하는 것은 지금
  보내는 모양을 그대로 스키마로 적는 것이다.
- 도구 판본(pnpm 11, NestJS 12, Next 15, ESM api)을 바꾸지 않는다. 런처는 Node 내장 모듈만 쓴다.
- vault 문서 사본은 고치지 않는다.
- 클라우드 세션에는 Postgres 가 없을 수 있다. 실제 기동 확인이 필요한 F 는 DB 없이 뜨는 경로
  (Dummy 어댑터나 `/api/health`)로 확인하고, 그래도 안 되면 사람에게 확인을 넘긴다.

## 6. 남겨 둔 것 — 만드는 사람이 정한다

- 묶음 안의 커밋 쪼개기와 정확한 파일 이름(문서 규칙 안에서).
- E1 getter 의 이름.
- F 런처의 감시 조용함 판정 시간, 재시도 횟수와 간격.
- G 에서 사다리 밖 값(6px, 10px 등)을 반올림할 방향 — 화면이 눈에 띄게 달라지면 스크린샷으로 보인다.

## 7. vault 에 보고할 것

이 저장소에서는 고치지 않고, 끝날 때 목록으로 넘긴다.

1. backend-module-layout 에 HTTP 가 아닌 들어오는 자리(스케줄러·타이머)의 폴더가 없다 → `interface/schedule/` 제안 (C1).
2. backend §2 표의 `interface/api` 가 볼 수 있는 것에 `infrastructure/` 가 없다 (C10).
3. boundary-enforcement §3 에 「business·context → domain/adapter 금지」 규칙이 없다 (B5).
4. boundary-enforcement §4 에 뷰 폴더 공개 표면 규칙의 설정 전문이 없고, fractal-view-promotion §7 은
   아직 「이 규칙이 아예 없다」고 적는다. 그 규칙이 `@/` 별칭을 잡아야 한다는 점도 함께 (B1).
5. launcher-ports 의 빌드 서버는 「혼자 뜨는 서버」를 전제한다. 화면과 서버가 짝으로 뜨는 빌드 모드에서
   화면이 서버 주소를 받는 법이 없다. 또 실제 서비스에서 운영자가 적은 포트는 피해 가지 않고 고정해야
   한다 (F4).
6. model-vocabulary §7 의 예가 아직 `DocumentOutlineReadModel` 을 쓴다 — 접미사 규칙인지 밝혀 달라.
