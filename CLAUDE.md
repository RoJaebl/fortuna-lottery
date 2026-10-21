# CLAUDE.md

이 문서는 이 저장소에서 작업하는 Claude Code(claude.ai/code)를 위한 가이드다.

## 이 저장소는 무엇인가

**로또랩 (fortuna-lottery)** — 한국 로또 6/45 사용자를 위한 의사결정 도우미 서비스. 실제 로또를 사기 전에
과거 회차 데이터 기반의 정직한 통계를 보여주고, 번호는 사용자가 직접 고르게 한다. 예측력을 주장하지
않는다는 원칙을 명시적으로 지킨다: 로또 추첨은 매 회차 독립 사건이며 과거 통계는 미래 당첨 확률을
높이지 못한다 — 핫/콜드·확률 관련 화면은 모두 이 사실을 명시해야 한다. 몰입감 있는 UX(다음 추첨
카운트다운, 희귀도 배지, "타임머신" 백테스트)는 이 정직한 통계 위에 얹히는 것이며, 이 정직함이
곧 후속 구독 전환의 신뢰 기반이다. 가정 기반 기능은 가정 확률을 보여 줄 수 있다. 그때는 언제나 실제 확률 1/8,145,060 과 그 가정의 과거 적중률을 함께 적는다.

설계 문서는 둘이다.

- [v1 설계](<docs/superpowers/specs/2026-06-04-fortuna-lottery-design.md>)는 제품 개요·기능 범위·정직성
  원칙을 정한다. 이 부분은 지금도 유효하다.
- [골조 이관 계획](<docs/superpowers/plans/2026-09-29-vault-architecture-migration.md>)은 지금 구조가
  어떻게 섰는지를 적는다. 옛 v2 아키텍처 문서는 이 계획으로 대체되어 기록으로만 남는다.

참고: 이 저장소는 사용자의 Obsidian vault(별도로 관리되는 OneDrive 동기화 폴더) 안에 위치하지만,
`RoJaebl/fortuna-lottery`라는 자체 GitHub 원격 저장소를 가진 독립된 git 저장소다 — vault의
PARA/MOC 규칙과는 무관하다.

## 작업 전 필수 참고 — `.claude/context/` (SSOT)

`.claude/context/`는 이 저장소에서 작업을 시작하기 전에 알아야 하거나 참고하면 도움이 되는 문서를
모아두는 SSOT(Single Source of Truth) 폴더다. 코드/디자인/설정 변경 등 어떤 작업이든 시작하기 전에
이 폴더의 문서 목록을 먼저 확인하고, 관련 내용이 있으면 그것을 우선 근거로 삼는다.

- 문서는 조사/의사결정의 최종 결론과 현재 상태만 담는다 — 탐색 과정, 중간 시행착오, 폐기된 대안은
  기록하지 않는다.
- 실제 코드/설정 상태와 문서 내용이 어긋난 것을 발견하면, 작업을 계속하기 전에 문서를 최신 상태로
  갱신한다.

현재 문서: `design-system.md` (컬러 토큰), `launcher-ports.md` (런처 · 포트 · 환경 이름).

## superpowers 스킬 워크플로 — 계획/스펙 문서 선(先) 커밋

`superpowers:subagent-driven-development` 또는 `superpowers:executing-plans` 스킬로 구현 작업을
실행할 때, 그 작업이 참조하는 `docs/superpowers/plans/`의 계획 문서나 `docs/superpowers/specs/`의
스펙 문서가 아직 커밋되지 않은 상태라면, 구현에 들어가기 전에 먼저 그 문서들을 커밋한다.

모든 구현이 끝난 뒤에 계획/스펙 문서가 뒤늦게 (혹은 구현 커밋과 뒤섞여) 커밋되는 것은 작업 흐름상
순서가 맞지 않는다 — 계획 문서는 구현의 근거이므로, 구현보다 먼저 저장소 히스토리에 존재해야 한다.

## 명령어

```bash
pnpm install                 # apps/api 의 postinstall 이 prisma generate 를 돈다
pnpm dev                     # 런처(tools/launch/launch.mjs) — apps/web(next dev, 3000~)과 apps/api(nest build --watch 의 dist, 4000~)를 함께 띄운다
pnpm check                   # typecheck → lint → lint:deps → lint:side-effects → test → test:tools. 과업 끝의 검증 명령이다
pnpm lint:deps               # dependency-cruiser 로 의존 방향·층 경계를 검사한다
pnpm check:migration         # 골조 이관 상태를 낸다. 지금은 「옛 구역 파일: 0」
pnpm build                   # turbo build
pnpm start                   # 런처 — 빌드 결과로 두 서버를 OS 포트(또는 FORTUNA_WEB_PORT·FORTUNA_API_PORT 부터 빈 포트)에 띄운다
pnpm --filter @fortuna-lottery/api db:migrate   # prisma migrate dev — 스키마를 고쳤을 때 마이그레이션을 새로 만든다
pnpm test:tools              # 런처 시험(node --test)
pnpm --filter @fortuna-lottery/web exec store-gen   # 공통 상태 생성 파일(src/composition/store.gen.ts)을 쓴다. typecheck·lint:deps·vitest 가 먼저 부른다
```

`apps/api` 는 기동할 때 `apps/api/.env` 를 스스로 싣고(`main.ts` 의 `loadEnvFile`, 이미 있는 환경 변수가
이긴다) 거기서 `DATABASE_URL` 과 `SCHEDULER_ENABLED` 를 읽는다. 값의 모양은 루트의 `.env.example` 에 있다.
DB 는 SQLite 파일이고 Docker 는 쓰지 않는다. `DATABASE_URL` 이 없으면 `file:./fortuna.db`(schema.prisma 기준이라
`apps/api/prisma/fortuna.db`, 저장소에서 추적하지 않는다)를 쓴다. 런처는 `pnpm dev`·`pnpm start` 모두에서 서버를 띄우기 전에
`prisma migrate deploy` 와 `prisma db execute --file prisma/seed.sql` 을 돈다. 시드는 회차 1~1245 의 `INSERT OR IGNORE`
라 몇 번 넣어도 같고, 그 뒤 회차는 `pnpm start` 의 스케줄러가 채운다.
`SCHEDULER_ENABLED` 를 적지 않으면 회차 수집 스케줄러는 `pnpm dev`(서버를 자주 다시 띄운다)에서 꺼지고
`pnpm start` 에서 켜져 동행복권 원격을 부른다. 적으면 그 값이 이긴다 — `dev` 에서 수집하려면 `true`,
`start` 에서 끄려면 `false`. 이 기본값은 런처가 서버에 넘기는 `FORTUNA_MODE`(`dev`/`start`)가 정하고, 런처 없이
띄우면 `npm_lifecycle_event` 로 가린다. `FORTUNA_STRICT_PORT=1` 이면 `apps/api` 는 받은 `PORT` 를 옮기지 않고,
쥐여 있으면 5 번 시도(약 4 초)한 뒤 `EADDRINUSE` 로 죽는다.
포트를 고르는 자리는 런처 하나다 — 사람 셸의 `PORT`·`HOST` 는 자식에 넘기지 않는다. `pnpm dev` 는 `FORTUNA_DEV_WEB_PORT`·
`FORTUNA_DEV_API_PORT` 를 적으면 그 번호에 그대로 서고, `pnpm start` 는 `FORTUNA_WEB_PORT`·`FORTUNA_API_PORT` 를 적으면 그 번호부터
피해 간다(`../editor` 의 dev-ports 와 같은 방식).
환경 이름 표와 근거는 `.claude/context/launcher-ports.md` 가 갖는다.
`apps/web` 은 `API_ORIGIN`(기본값 `http://127.0.0.1:4000`)으로 `apps/api` 의 주소를 받는다. 이 값은
요청마다 실행 때 읽으므로 빌드 때 굳지 않는다 — 바꾸려면 프로세스를 다시 띄우면 된다.

특정 패키지만 빠르게 돌릴 때는 turbo 를 거치지 않는다.

```bash
pnpm --filter @fortuna-lottery/api test
pnpm --filter @fortuna-lottery/web test
pnpm --filter @fortuna-lottery/web exec vitest run <path>   # 파일 하나
```

경계 검사기 자체가 살아 있는지는 `bash tools/checks/run-violations.sh` 가 규칙마다 위반 표본 하나를
돌려 확인한다.

## 배치 — 두 서버

이 저장소는 vault 개발 골조를 따르고, 배치는 **두 서버**다
([architecture-baseline §1 배치를 먼저 고른다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/architecture-baseline.md#1-배치를-먼저-고른다>)).
화면 앱 `apps/web`(Next.js, `pnpm dev` 에서 포트 3000~)과 응용 서버 `apps/api`(NestJS, 4000~, 전역 접두 `/api`)가 각자
프로세스를 갖는다. 포트는 런처가 골라 넘긴다.

이렇게 고른 까닭은 둘이다. 화면과 서버의 경계가 프로세스 단위로 물리적으로 잘려 경계 검사기에 덜
기대게 되고, vault 골조가 화면 모듈과 서버 모듈을 따로 정의하므로 번역 없이 그대로 맞는다. 수집
워커도 별도 프로세스로 두지 않고 `apps/api` 에 흡수했다. 서버 프로세스가 하나여야 할 이유가 생기지
않는 한 이 배치를 바꾸지 않는다.

**골조 이관은 2026-09-29 에 끝났다.** `.dependency-cruiser.cjs` 에 `options.exclude` 가 없고, 모든 파일에
골조 규칙이 걸린다. `pnpm check:migration` 은 「옛 구역 파일: 0」을 낸다. 이관 절차는
[incremental-migration §1 표식은 검사 제외 목록 하나뿐이다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/incremental-migration.md#1-표식은-검사-제외-목록-하나뿐이다>)를
따랐다. 앞으로 옛 구역을 다시 만들 일은 없다 — 새 코드는 처음부터 골조대로 쓴다.

## 아키텍처 — vault 골조를 가리킨다

구조의 규칙은 이 파일이 아니라 vault 의 골조 문서 열 장이 소유한다(`architecture/` 폴더의 일곱 장과 `frontend/` 폴더의 세 장). 이 기기에서는
`C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/` 에서 읽는다(그 사본은
고치지 않는다). 먼저 [architecture-baseline](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/architecture-baseline.md>)을
열면 어느 작업에 어느 장을 읽는지 알려 준다.

- 서버 모듈의 네 계층(`interface/{api,facade}` · `business` · `context` · `domain/{model,port,adapter}`)과
  조립 루트는 [backend-module-layout](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/backend-module-layout.md>)이 정한다.
- 화면 모듈의 네 역할(화면 · presenter · action · 변환기)과 파일 이름은
  [frontend-module-layout](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md>)이,
  뷰 폴더 승격과 소유물의 깊이는 [fractal-view-promotion](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/fractal-view-promotion.md>)이 정한다.
- 화면 앱 전체의 층과 조립(`app` · `widgets` · `framework` · `composition` · `infrastructure` · `shared`, 일곱 층 별칭, 컨테이너)은
  [frontend-app-layers](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md>)가,
  독립 라이브러리 다섯·영역 다섯·규약 층·전파 규칙·주소는 [frontend-store](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-store.md>)가,
  여러 presenter 가 함께 쓰는 공통 상태(`_state/`)는 [frontend-shared-state](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-shared-state.md>)가 정한다.
- 타입 부류(와이어 모델 · 도메인 원형 · 표시 모델 · 값 객체 · 파생 조회 모델)는
  [model-vocabulary](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/model-vocabulary.md>)가 정한다.
  옛 저장소의 모델 타입 표(`use*ViewModel` = presenter, `*Entity`, `*VO`, `*ReadModel`, 2-tier 엄격도)는
  버렸다. 지금 `*.viewmodel.ts` 는 표시 모델 클래스이고, presenter 는 `*.presenter.ts` 의 `use*Presenter` 다.
- 계약 패키지의 스키마와 이름은 [wire-contract](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/wire-contract.md>)가,
  의존 규칙과 모양 규칙은 [boundary-enforcement](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md>)가 정한다.

저장소의 뼈대는 이렇다.

```
packages/contract/   @fortuna-lottery/contract — 도메인별 zod 스키마(와이어 모델의 SSOT). 두 앱이 참조한다
packages/kernel/     @fortuna-lottery/kernel — 로또 순수 커널(combination · scoring · rng · result · generate). apps/api 만 참조한다
packages/store/      @fortuna-lottery/store — key 로 등록하는 전역 공통 상태와 타입 생성기(tsserver·Next·CLI). apps/web 만 참조한다
apps/api/            NestJS 응용 서버 — src/modules/<도메인>/, src/composition/CompositionModule.ts, prisma/
apps/web/            Next.js 화면 앱 — src/app/(home)/, src/framework/, src/composition/, src/infrastructure/, src/shared/{ui,lib}/
tools/checks/        이관 상태 스크립트와 규칙마다 하나씩 둔 위반 표본
tools/launch/        런처 — pnpm dev·pnpm start 가 부르고 포트를 고르는 유일한 자리(Node 내장 모듈만 쓴다)
```

의존 방향과 층 경계는 루트의 `.dependency-cruiser.cjs` 가, 코드 모양(화면에 상태 없음, 표시 모델 얕은
전개 금지, 뷰 폴더의 공개 표면, 훅이 자기 key 하나만 꺼내기 `hook-resolves-own-key-only`,
action 의 store 등록과 `_state/` 파일의 `createStore` 는 파일 최상단에서만 `store-registers-at-top-level`, 전파 규칙은 자기 캐시만 겨냥 `rule-targets-own-cache`,
`href`·`push`·`replace` 에 경로 리터럴 금지 `no-path-literal`, `@/` 뿌리 별칭 금지 `no-root-alias`,
`@framework` 에서 제 이름으로만 가져오기 `no-renamed-store-import`, 공통 상태의 key·자리·범위를 `framework/paths.mjs` 로
판정하는 `state-key-literal`·`state-key-matches-folder`·`state-key-within-scope`·`state-only-in-presenter`·`state-registers-in-state-folder`)은
`apps/web/eslint.config.mjs` 가 강제한다. 둘 다 `pnpm check` 에 들어
있으므로 위반은 곧 검증 실패다. `"sideEffects": false` 는 store 등록(import 부수효과)을 지우므로 `pnpm lint:side-effects` 가 막는다.

## 이 저장소가 정한 것 — vault 골조가 답하지 않는 자리

아래는 골조 문서가 규정하지 않아 이 저장소가 정한 것이다. 바꾸려면 여기와 코드를 함께 고친다.

- **브라우저는 여전히 `apps/web` 의 `/api/*` 를 부른다.** `apps/web/src/app/api/[...path]/route.ts` 의 Next
  경로 처리기가 `infrastructure/apiProxy.ts` 의 `proxyToApi` 로 요청(메서드·헤더·본문·쿼리)을 `${API_ORIGIN}/api/...`
  로 그대로 넘긴다. 주소는 요청마다 읽는다(기본값 `http://127.0.0.1:4000`). 응용 서버에 닿지 않으면 503
  `{ "error": "서버에 닿지 않습니다" }` 를 돌려주고 로그는 5 초에 한 줄만 남긴다. CORS 를 열 필요가 없다.
- **로또 순수 커널은 `packages/kernel` 에 둔다.** 여러 서버 모듈이 함께 쓰므로 모듈 하나에 두면
  `no-cross-module-import` 에 걸린다. `apps/web` 은 커널을 참조하지 않는다(`web-must-not-reach-kernel`).
- **조합 뽑기 `generate` 는 `packages/kernel` 에 둔다.** generator 와 hypothesis 가 함께 쓰므로 모듈 하나에 두면 `no-cross-module-import` 에 걸린다.
- **서버의 `domain/model/` 은 의존이 없다.** 커널은 `business/`(필요하면 어댑터)에서만 런타임으로 쓴다.
  커널 타입이 필요한 순수 계산은 `business/` 에 둔다. `domain/port/` 는 커널 타입을 `import type` 으로만
  가져올 수 있다. `domain-model-has-zero-dependencies` 는 `*.test.ts` 를 세지 않는다 — boundary-enforcement §3 의 표준이다.
- **계약 스키마는 모양 검사만 담는다.** 배열 길이 6, 정수, 1~45 범위까지다. 중복 없음은 도메인 규칙이라
  커널의 `createCombination` 이 지키고, `business/` 가 그 실패를 400 으로 바꾼다. 그래서 모양이 틀린
  요청은 「잘못된 요청 형식입니다」, 중복 번호는 도메인 메시지로 400 을 받는다. 화면의 변환기는
  계약 타입을 받아 번역만 한다 — 검증은 서버가 한다(zod 로 다시 검증하지 않는다).
- **모듈 사이의 포트는 모듈마다 따로 선언하고, `CompositionModule` 이 `useExisting` 으로 상대 facade 를
  꽂는다.** 예를 들어 `picks` 와 `results` 는 각자 `CurrentUserPort` 를 갖고, 둘 다 `IdentityFacade` 를 받는다.
  모듈 등록도 `CompositionModule` 이 하고, `app.module` 은 그것만 import 한다.
- **`context/` 는 입력을 모으는 일이 무거운 모듈에만 둔다.** 지금은 `results` 만 갖는다(`ResultsCheckContext`).
- **수집 스케줄러는 `lotterietus/interface/schedule/LotterietusIngestScheduler.ts` 다.** 옛 워커처럼 「다음 추첨 +
  10분, 실패하면 5분 뒤」로 `setTimeout` 을 걸고, 종료 때 타이머를 지운다. 고정 cron 으로는 이 동작을
  옮길 수 없어 `@nestjs/schedule` 을 쓰지 않는다. `interface/schedule/` 은 골조에 HTTP 가 아닌 들어오는 자리의
  폴더가 없어 정했고, 의존 규칙은 `interface/api` 와 같다(`api-imports-no-module`). 설정(`CONFIG`)의
  `schedulerEnabled` 를 직접 읽어 켠다 — 골조는 설정을 `interface/facade/` 만 보게 하지만 스케줄러도 본다.
- **컨트롤러는 `apps/api/src/infrastructure/http/parseRequest` 를 쓴다.** 계약 스키마로 요청 모양을 검사하는
  공용 도구다. backend-module-layout §2 표는 `interface/api` 가 `infrastructure/` 를 보게 하지 않지만 이 저장소는
  보게 한다(의도한 이탈).
- **`business-must-not-reach-adapter` 는 이 저장소가 더한 규칙이다.** `business/`·`context/` 는 `domain/adapter` 를
  가져오지 못한다. 시험 파일도 예외가 아니다 — `picks` 의 `business/` 시험은 공용 `business/fakePickRepository.test-helper.ts`(포트를 구현하고 어댑터는 가져오지 않는다)를 쓴다.
- **vault 골조 문서에 올릴 어긋남은 [보고 문서](<docs/superpowers/reports/2026-10-13-vault-feedback.md>)에 모았다.**
- **모듈 시험은 모듈 뿌리에 둔다.** `modules/<도메인>/<도메인>Module.test.ts` 가 그 모듈 하나를 띄우고
  `configureApp` 으로 실제 접두를 건 뒤 HTTP 로 부른다. 유스케이스 시험은 `business/` 의 파일 옆에 둔다.
- **자식 뷰가 함께 쓰는 상태 둘은 `app/(home)/_state/` 의 공통 상태다.** 현재 조합(`state.home.combination`)은
  생성기·가정 실험실이 바꾸고 통계·시뮬레이션·내 번호·가정 실험실이 읽는다. 생성기 열림(`state.home.generatorOpen`)은
  회차 카드가 바꾸고 페이지와 회차 카드가 읽는다. 활성 탭은 `Home.presenter.ts` 의 지역 상태이고, `page.tsx` 는
  조립만 한다. 누가 무엇을 읽고 바꾸는지는 store 출력 스냅숏이 적는다.
- **공통 상태는 `@fortuna-lottery/store` 의 전역 등록부에 있고 공급자가 없다.** 정의는 `_state/` 파일의
  `createStore("key", (set, get) => …)` 하나이고, 타입은 생성 파일(`src/composition/store.gen.ts`, git 에 넣지 않는다)의
  `StateTypes` 가 준다. presenter 는 `useSharedState(key, select)` 로 꺼낸다. 시험은 `getStore` 로 값을 미리 정하고
  `test.setup.ts` 의 `afterEach(resetStores)` 가 되돌린다. 생성 파일은 `apps/web/store.config.ts` 의 `targets`(tsserver·next·cli)가
  쓴다. VS Code 는 「TypeScript: Select TypeScript Version → Use Workspace Version」으로 작업 공간 TypeScript 를 써야 tsserver
  플러그인이 실린다(`.vscode/settings.json` 의 `tsdk` 가 가리킨다). **이 문장은 수동 확인 대상이다** — 사람이 TS Server 로그에서
  `Plugin validation succeeded` 를 본 적이 아직 없다. tsserver 는 플러그인을 tsconfig 폴더가 아니라 TypeScript 곁(`../../..`)에서
  찾으므로, 루트 `package.json` 의 devDependencies 에 `@fortuna-lottery/store` 를 두어 루트 `node_modules` 에 놓는다.
- **서버 상태 캐시는 [frontend-module-layout §3.1 캐시 도구 — shared/lib/cache](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-module-layout.md#31-캐시-도구--sharedlibcache>)
  그대로다.** `apps/web/src/shared/lib/cache/createServerCache.ts` 가 그것이다.
- **화면 앱에는 화면 모듈이 하나(`app/(home)/`)뿐이므로 모듈 사이 import 는 없다.** 개정판은 화면 모듈끼리 배럴 import 도 금지한다.
- **cache·http·event·route 는 아직 옛 store 다(1단계). 엔진은 `shared/lib/store/`, 영역을 꽂은 store 는 `framework/` 에 있다.** 화면 쪽은 `@framework`(`store`·`route`)와
  `@framework/react`(`StoreProvider`·`useStore`)만 본다. action 파일이 스스로 등록하고, 컨테이너는
  `composition/createContainer.ts` 가 짓고 `app/AppContainer.tsx` 가 내린다. 시험은 `createContainer('test')` 의 `c.deps.http` 와
  `c.resolve(key)` 를 쓴다.
- **엔진의 등록 함수는 `(key, 정의)` 하나뿐이라, event 영역의 `store.invalidates`·`store.unaffected` 는 `framework/index.ts` 가
  「사건 → 캐시」 key 의 event 정의로 바꿔 넘긴다.** 영역의 출력 꼴(`describe`)은 key 하나가 아니라 영역의 정의 전부를 받아
  사건 아래에 그 규칙을 단다([보고 문서](<docs/superpowers/reports/2026-10-13-vault-feedback.md>) 17).
- **규격 코드와 다르게 지킨 것이 셋 있다.** 셋 다 [보고 문서](<docs/superpowers/reports/2026-10-13-vault-feedback.md>)에 올렸다.
  - `FetchHttpClient`(`infrastructure/http`)는 서버 본문의 `{ error }` 문구를 꺼내 예외 메시지로 쓴다. 계약이 도메인 실패를 메시지를 실은 400 으로 정하므로 버리면 화면 문구가 사라진다.
  - `createServerCache` 의 `invalidate` 는 조건이 `void` 인 캐시도 다시 받도록 `query !== undefined` 대신 `queries.has(key)` 로 가린다.
  - 조회 훅은 `useSyncExternalStore` 의 셋째 인자로 `readOnServer`(서버 렌더 때는 값 없음)를 넘긴다. 없으면 Next 서버 렌더가 실패한다.
- **`picks` 의 저장·삭제는 `results` 캐시를 무효화하지 않는다.** 결과 확인은 사람이 「당첨 대조」를 눌러 받는 값이고,
  누르기 전까지는 앞선 결과를 그대로 보인다(`checkResults.action.ts` 의 `store.unaffected`). 무엇이 무엇을 갱신하는지는 `apps/web/src/composition/__snapshots__/store.describe.test.ts.snap` 에서 읽는다.
- **`turbo.json` 의 `lint` 는 `^build` 에 기댄다.** baseline §3 의 `{}` 보다 엄격한 의도된 이탈이다.
- **`Entity` 부류는 없다.** 픽은 `picks/domain/model/Pick.model.ts` 의 도메인 원형이다.
- **도구 판본.** `packageManager` 는 `pnpm@11.18.0` 이고, 설치 때 빌드 스크립트를 허용할 패키지(prisma,
  엔진, esbuild, sharp)를 `pnpm-workspace.yaml` 의 `allowBuilds` 에 둔다. NestJS 는 12 이고, `apps/api` 는
  계약 패키지가 `import` 조건만 내보내므로 ESM 이다.

### 영속화 규칙 (실제 테이블이 생기면 적용)

테이블 하나 = 도메인 하나의 데이터, 예외 없음. 도메인 간 관계는 다른 도메인 테이블에 컬럼을
추가하는 대신 `(user_key + service_key)` 조합의 전용 테이블을 만든다 — 이렇게 해야 나중에 도메인을
별도 서비스로 분리할 때 테이블째로(+`apps/api/src/modules/<도메인>`) 잘라낼 수 있다. 지금 실제 테이블은
`draws` 하나다(`apps/api/prisma/schema.prisma` 의 `Draw` 모델).

## MVP 현황

`apps/api` 가 수집과 조회를 모두 한다. 회차 데이터는 `lotterietus` 모듈의 `PrismaDrawDataAdapter` 가 SQLite 에서
읽고, 같은 모듈의 `LotterietusIngestScheduler` 가 동행복권 비공식 엔드포인트를 매주 추첨 이후 수집해
채운다. 새 DB 는 시드(`apps/api/prisma/seed.sql`)로 회차 1~1245 를 받고, 그 뒤 회차는 스케줄러가 잇는다.

픽은 `picks` 모듈의 `PickRepositoryPort` 뒤에 있는 `InMemoryPickRepository`(서버 프로세스 메모리, 실제
DB 아님)에 저장된다. `apps/api` 를 다시 띄우면 사라진다. 나중에 Supabase 로 바꿔도 어댑터만 바뀐다.
인증은 아직 없다(게스트 전용). Supabase Auth 와 로그인 게이팅은 v1 문서 기준 후속 단계다.

`hypothesis` 모듈(가정 실험실)은 `POST /api/hypothesis/{evaluate,generate,popularity}` 를 낸다. 과거 회차로 가정 적중률·백테스트를 계산하고, 화면의 「가정 실험실」 탭이 이를 보인다.

## TDD

도메인 계산과 유스케이스는 테스트 우선(Red → Green → Refactor)으로 작성한다. 커널과 `business/` 의 계산을
순수 함수로 유지하는 이유가 바로 이것이다. 구현 전에 대상 파일 옆에 `*.test.ts` 를 먼저 쓴다.
계약 스키마를 고쳤는데 화면 변환기 시험이 하나도 깨지지 않았다면 변환기가 스키마를 반영하지 않는다는 회귀 신호다 — 자동 검사가 아니라 사람이 지키는 방어선이다(wire-contract §6).
커널은 `packages/kernel/src/*.test.ts`, 서버 유스케이스는 `apps/api/src/modules/<도메인>/business/*.test.ts`,
계약은 `packages/contract/src/<도메인>/schema.test.ts`, 화면의 presenter·표시 모델은
`apps/web/src/app/**/*.presenter.test.ts` 와 `*.viewmodel.test.ts` 가 본보기다.

## git 분기 전략 — vault 공통 정책을 따른다

브랜치 생성 · 워크트리 생성/제거 · 병합 · push · 브랜치 삭제 전에 vault의 `git-strategy` 스킬을
먼저 호출한다. 정본은 vault의 `Resource/자동화/git 분기 전략/📋 작업 규격.md`이고, 실행 절차와
**이 저장소의 예외**는 vault의 `.claude/skills/git-strategy/SKILL.md` §7에 있다.

요지 — `main` ← `dev`는 PR로만 / `dev` ← `implement`는 `--no-ff` 후 `implement`로 복귀 / 작업은
`implement/{주제}` 워크트리에서 하고 끝나면 폴더·로컬·원격 브랜치를 모두 지운다 / 모든 브랜치는
원격 추적 브랜치를 가진다.

**이 저장소의 예외:** 워크트리는 Orca 네이티브로 만들고, 이름은 `--name` 으로 넘긴다
(`orca worktree create --name <이름>`). 이름을 위치 인자로 주면 `Unknown command` 로 거절된다.
`dev` 는 2026-08-26 부터 `origin/dev` 를 추적하므로 따로 연결할 필요가 없다.

## Known quirks

- **OneDrive + git worktree 손상 (사고 3건 → 2026-08-26 잔재 정리 완료).** 이 저장소는 OneDrive
  동기화 vault 안에 있어 vault 루트가 문서화한 손상 패턴을 겪었다. `.worktrees/`의 고아 폴더
  2건(`implement.orphaned-20260730`, `-20260801`)과 관리 폴더 1건(`.git/worktrees/implement1`)이
  실제 흔적이었다. **셋 다 2026-08-26에 제거했고 지금은 워크트리 잔재가 없다.**
  **위험 자체는 그대로이므로 완화책은 유효하다** — 브랜치/워크트리 작업은 raw
  `git worktree add` 대신 Orca 네이티브 생성(`EnterWorktree` 또는 `orca worktree create --name <이름>`)을 쓴다.
- **`implement1`이 내던 커밋 오류는 사라졌다.** 커밋할 때마다 붙던
  `error: failed to delete '.git/worktrees/implement1': Permission denied`가 그것이다(커밋 자체는
  늘 성공했으므로 실패로 오인하지 않는다). **`git worktree prune`으로는 끝까지 안 지워졌고,
  OneDrive 동기화를 일시중지한 뒤 직접 `rm -rf`로 지워야 했다.** 같은 증상을 다시 만나면 이
  순서를 쓴다 — prune 반복은 소용없다.
- **`mmap failed: Invalid argument`.** `git checkout`/`git fsck` 등이 이 오류로 실패하면, OneDrive
  cloud-only 플레이스홀더(`.git/objects/pack/*`, `.git/index` 등)가 완전히 하이드레이션되지 않은
  것일 수 있다(파일 크기는 정상으로 보여도 Windows 파일 속성이 `ReparsePoint`). "cloud file provider
  is not running" 같은 명시적 메시지가 없어도 같은 원인일 수 있다 — 실제 손상으로 단정하기 전에
  해당 파일을 PowerShell `[System.IO.File]::ReadAllBytes($path)`로 강제 전체 읽기해 하이드레이션시킨
  뒤 재시도한다.
- **Remote 추적 상태(2026-08-26).** `main`·`dev`·`implement` 셋 다 `origin`을 추적한다. `dev`는
  이날 처음 push했다(그전까지 로컬 전용이라 손상 시 복구 사본이 없었다). **로컬 `main`이
  `origin/main`보다 5커밋 앞서 있고 아직 push하지 않았다** — 전략 도입 이전에 `main`에 직접
  커밋한 흔적이다. PR #2의 base는 `origin/main`이므로 이 5커밋을 포함하지 않는다.
- **판정 5 이탈을 2026-08-26에 교정했다.** `dev`가 `implement`의 조상이 되어 있었다.
  `dev` ← `implement`를 `--no-ff`로 병합해(`6c0978f`) 끊었고 `implement`는 그 앞(`a995a5a`)에 남겼다.
- **크로스 머신 워크트리 정리 시 주의.** `git worktree list`가 "prunable"로 표시하는 항목이 이
  머신에서 죽은 로컬 경로인지, 다른 머신(예: Mac Orca 워크스페이스)에서 여전히 쓰이는 항목인지
  먼저 확인한다 — 이 저장소의 `.git`이 OneDrive로 동기화되므로, `git worktree prune`은 다른 머신이
  보는 등록 정보도 함께 지운다.
