# vault 골조 이관 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로또랩 저장소를 vault 개발 골조(두 서버 배치)로 옮긴다. `packages/core` 와 `apps/worker` 를 해체해 `packages/contract` · `apps/api`(NestJS) · 골조대로 편 `apps/web` 으로 재편하고, 경계 검사기가 그 모양을 강제하게 한다.

**Architecture:** 도메인 하나를 이관 단위로 삼아 서버 모듈과 화면 모듈을 한 과업 안에서 함께 옮긴다. 옛 구역은 `.dependency-cruiser.cjs` 의 `options.exclude` 가 표시하고, 도메인을 하나 옮길 때마다 그 경로를 목록에서 뺀다. 브라우저는 계속 `apps/web` 의 `/api/*` 를 부르고, 옮겨진 경로는 Next `rewrites` 가 `apps/api` 로 넘긴다. 그래서 과업 사이마다 앱은 온전히 동작한다.

**Tech Stack:** pnpm 워크스페이스 · Turborepo · TypeScript 5.8 · NestJS 11 · Prisma 6 (PostgreSQL) · zod · Next.js 15 / React 19 · Vitest 3 (+ jsdom · @testing-library/react) · dependency-cruiser · ESLint 9

**Spec:** 이 계획의 근거는 vault 골조 여덟 장이다. 이 기기에서는 `C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/` 에서 읽는다(그 사본은 고치지 않는다).

| 장 | 이 계획에서 그 장이 정하는 것 |
|---|---|
| [architecture-baseline](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/architecture-baseline.md>) | 배치, 저장소 뼈대, 워크스페이스 설정, 계약 패키지의 공개 표면 |
| [wire-contract](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/wire-contract.md>) | 계약 스키마(zod)와 이름 규칙 |
| [backend-module-layout](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/backend-module-layout.md>) | 서버 모듈의 네 계층, facade, 조립 루트 |
| [frontend-module-layout](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend-module-layout.md>) | 화면 모듈의 네 역할, 파일 이름, 공개 표면 |
| [fractal-view-promotion](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/fractal-view-promotion.md>) | 뷰 폴더 승격과 소유물의 깊이 |
| [model-vocabulary](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/model-vocabulary.md>) | 타입 부류와 파생값의 자리 |
| [boundary-enforcement](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md>) | depcruise 의존 규칙과 ESLint 모양 규칙 |
| [incremental-migration](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/incremental-migration.md>) | 제외 목록 표식, 모듈 하나를 옮기는 일곱 걸음, 진행 판정 |

각 과업은 그 과업이 닿는 장의 `## 규칙` 과 `## 하지 말 것` 을 먼저 읽고 시작한다. 문서는 `context-docs:context-doc-read` 로 목록부터 본다.

---

## 결정 사항

### 사용자가 정한 것 (2026-09-29)

1. **배치는 두 서버다.** 화면 앱 `apps/web` 과 응용 서버 `apps/api` 가 각자 포트를 갖는다.
2. **수집 워커는 `apps/api` 에 흡수한다.** `apps/worker` 는 없어진다.
3. **실행되지 않은 저장소 자체 설계는 삭제한다.** 대상은 Task 0 에 적는다.

### vault 문서가 답하지 않아 이 계획이 정한 것

vault 가 규정하지 않는 자리다. 각 결정은 이관이 끝난 뒤 vault 저장소에서 골조 문서에 반영할지 따로 판단한다(Task 9).

| 이 계획이 정한 것 | 결정 | 그렇게 정한 까닭 |
|---|---|---|
| 브라우저가 `apps/api` 를 부르는 길 | `apps/web/next.config.ts` 의 `rewrites()` 가 `/api/:path*` 를 `${API_ORIGIN}/api/:path*` 로 넘긴다. `fallback` 단계에 두므로 아직 남은 Next 경로 처리기가 먼저 응답한다 | 플랫폼 기능 한 줄로 끝난다. 경로 처리기를 지우는 것이 곧 그 도메인의 전환이 되어, 과업마다 앱이 동작한다. CORS 를 열 필요가 없다 |
| 로또 순수 커널(`combination` · `scoring` · `rng` · `result`)의 자리 | `packages/kernel` (`@fortuna-lottery/kernel`)로 옮긴다. `apps/api` 만 참조하고 `apps/web` 은 참조하지 않는다 | 로또 도메인을 알아서 `shared/` 도구가 아니고, 여러 서버 모듈이 함께 쓴다. 모듈 하나에 두면 `no-cross-module-import` 에 걸린다. baseline §1 배치 표의 「서비스 여럿」 행이 순수 커널 패키지를 이미 인정한다 |
| 수집 스케줄러 | `lotterietus/interface/api/LotterietusIngestScheduler.ts` 가 `OnApplicationBootstrap` 에서 지금 워커의 반복을 `setTimeout` 으로 그대로 돈다. `@nestjs/schedule` 은 쓰지 않는다 | 지금 워커는 고정 cron 이 아니라 「다음 추첨 + 10분, 실패하면 5분 뒤」로 깨어난다. cron 식으로는 이 동작을 옮길 수 없다 |
| 셸의 조정자 | `apps/web/src/app/Home.presenter.ts`. 모듈 사이에 오가는 상태 셋(`currentNumbers` · `isGeneratorOpen` · `activeTab`)만 갖는다 | frontend-module-layout 은 「모듈 간 공유 상태만 셸의 조정자」라고만 적고 자리를 정하지 않는다 |
| mapper 파일 이름 | `<유스케이스>.mapper.ts` (camelCase). 예: `generateCombination.mapper.ts` | 트리 예시(`documentList.ts`)와 frontend-module-layout §10 이 엇갈린다. 역할을 점 접미로 적는 §10 규칙을 따른다 |
| `Entity` 부류 | 없앤다. `pick.entity.ts` 는 `picks/domain/model/Pick.model.ts` 가 된다 | model-vocabulary 의 부류에 Entity 가 없다 |

---

## Global Constraints

- 패키지 이름 범위는 `@fortuna-lottery/*` 다. 새 패키지는 `@fortuna-lottery/contract`, `@fortuna-lottery/kernel`, `@fortuna-lottery/api` 다.
- `packageManager` 는 `pnpm@11.18.0` 으로 올린다(baseline §3 워크스페이스 설정).
- `apps/api` 는 포트 `4000`, 전역 접두 `/api` 로 뜬다. `apps/web` 은 `API_ORIGIN` 환경 변수로 그 주소를 받고, 기본값은 `http://localhost:4000` 이다.
- 브라우저에 보이는 URL 과 응답 JSON 의 모양은 바뀌지 않는다. 계약 이름을 바꾸는 것은 TypeScript 타입 이름뿐이다.
- **이관 커밋은 동작을 바꾸지 않는다.** 이관 커밋에서 옛 시험은 옮겨진 자리에서 그대로 통과해야 한다. 시험 수가 줄면 그 커밋은 이관이 아니라 재작성이다(incremental-migration §5.1).
- **이관과 기능 변경을 한 커밋에 섞지 않는다.**
- **옛 구역에 새 파일을 만들지 않는다.** 옛 구역은 `.dependency-cruiser.cjs` 의 `options.exclude` 가 정한다.
- **제외 목록은 줄기만 한다.** Task 2 에서 정한 목록에 경로를 더하지 않는다.
- **도메인 하나를 시작하면 그 과업 안에서 끝낸다.** 서버만 옮기고 화면을 옛 자리에 두지 않는다.
- 예측력을 주장하지 않는다는 원칙(`CLAUDE.md`)이 붙은 문구와 「예측 아님」 라벨은 옮기면서 글자 하나 바꾸지 않는다.
- git 은 `git-strategy` 스킬을 먼저 부른다. 작업은 OneDrive 밖의 Orca 워크트리에서 한다. 병합은 어느 방향이든 `--no-ff` 다.
- 각 과업 끝의 검증 명령은 루트의 `pnpm check` 다(Task 2 부터). 그전에는 `pnpm test && pnpm lint` 다.

## Review Focus

1. **Next `rewrites` 가 아직 남은 경로 처리기를 가리는 경우.** `/api/picks` 를 옮기기 전에 `/api/picks` 요청이 여전히 Next 처리기에서 응답해야 한다. Task 3 의 전환 시험이 이것을 묶는다.
2. **`/api/picks/[id]` 같은 동적 경로의 전환.** 목록 경로만 지우고 동적 경로를 남기면 두 서버가 한 도메인을 나눠 갖는다. Task 5 는 두 처리기를 한 커밋에서 지운다.
3. **인메모리 픽 저장소의 수명.** 지금은 `globalThis` 로 Next HMR 사이에서 살아남는다. Nest 에서는 싱글턴 공급자 하나여야 저장한 픽이 다음 요청에서 보인다. Task 5 의 facade 시험이 저장 뒤 조회를 묶는다.
4. **zod 검사로 새로 거절되는 요청.** 지금 처리기는 `as` 캐스트만 한다. 스키마가 붙으면 번호 7개, 범위 밖 번호, 중복 번호가 400 으로 돌아가야 하고 500 이 나오면 안 된다. 각 컨트롤러 스모크 시험이 400 을 묶는다.
5. **수집 스케줄러가 `apps/api` 종료를 막는 경우.** 대기 중인 `setTimeout` 이 남으면 프로세스가 내려가지 않는다. Task 4 가 `OnModuleDestroy` 에서 타이머를 지우고 Prisma 연결을 닫는 것을 시험한다.

---

## 파일 구조 (최종 상태)

```
pnpm-workspace.yaml · package.json · tsconfig.base.json · turbo.json
.dependency-cruiser.cjs                     의존 규칙 + 이관 제외 목록 (이관이 끝나면 exclude 가 빈다)
tools/checks/
  migration-status.sh                       pnpm check:migration
  violations/                               규칙마다 위반 표본 하나
packages/
  contract/src/<도메인>/{schema.ts,index.ts}   zod 스키마가 SSOT. dist 로 빌드
  kernel/src/{combination,scoring,rng,result}.ts
apps/
  api/
    prisma/schema.prisma                    packages/core/prisma 에서 옮긴다
    src/
      main.ts · app.module.ts · config.ts
      composition/CompositionModule.ts      포트에 facade 를 꽂는 유일한 자리
      infrastructure/prisma/                PrismaService
      modules/<도메인>/
        interface/{api,facade}/
        business/
        context/                            입력을 모으는 일이 무거운 모듈만
        domain/{model,port,adapter}/
        <X>Module.ts
  web/src/
    app/{layout.tsx,page.tsx,Home.presenter.ts}   app/api/ 는 없어진다
    modules/<도메인>/
      index.ts                              대표 화면과 모델 타입만 내보낸다
      <대표화면>View/ 또는 <대표화면>View.tsx
      model/ · action/ · mapper/            쓰는 뷰의 수로 깊이가 정해진다
    shared/{ui,lib}/
```

없어지는 것: `packages/core/`, `apps/worker/`, `apps/web/src/app/api/`, `apps/web/src/server/`, 추적되지 않는 빈 폴더 `apps/web/src/modules/{countdown,draw}/`.

---

## Task 0: 옛 설계를 지우고 배치를 기록한다

**Files:**
- Delete: `docs/superpowers/specs/2026-08-05-fortuna-lottery-client-architecture-v3-design.md`
- Delete: `docs/superpowers/specs/2026-08-08-fortuna-lottery-client-architecture-v3-refinement-design.md`
- Delete: `docs/superpowers/specs/2026-08-08-fortuna-lottery-backend-architecture-v4-design.md`
- Delete: `docs/superpowers/plans/2026-08-08-client-architecture-v3-refinement.md`
- Delete: `docs/superpowers/plans/2026-08-08-backend-architecture-v4.md`
- Delete (git 미추적): `apps/web/src/modules/countdown/`, `apps/web/src/modules/draw/`
- Modify: `CLAUDE.md`
- Create: 이 계획 문서

- [ ] **Step 1: 옛 설계 다섯 장과 빈 폴더 둘을 지운다.** `2026-08-05` v3 설계는 보정 설계가 개정하던 원본이라 함께 지운다.
- [ ] **Step 2: `CLAUDE.md` 에 「배치와 골조 이관 상태」 절을 더한다.** 배치가 두 서버이고 그렇게 고른 근거(경계가 물리적으로 잘려 검사기에 덜 기대고, vault 골조가 번역 없이 맞는다)를 한 문단으로 적는다. 옮기지 않은 구역은 `.dependency-cruiser.cjs` 의 `options.exclude` 가 소유하고 진행 판정은 `pnpm check:migration` 으로 낸다고 적는다(incremental-migration §1). 기존 「아키텍처」 절 머리에 「이관 중 — 옛 구역의 설명」이라고 한 줄 적는다. 본문 재작성은 Task 9 에서 한다.
- [ ] **Step 3: 저장소 설계 문서 목록을 고친다.** `CLAUDE.md` 머리의 설계 문서 목록에서 v2 줄 옆에 「vault 골조로 이관 중」이라고 적는다.
- [ ] **Step 4: 시험이 그대로인지 확인한다.** Run: `pnpm test && pnpm lint` Expected: core 44 · web 10 통과, lint 오류 0.
- [ ] **Step 5: 커밋한다.** `docs: vault 골조 이관 계획을 세우고 실행되지 않은 v3·v4 설계를 지운다`

---

## Task 1: 계약 패키지 `packages/contract` 를 세운다

**Files:**
- Create: `packages/contract/{package.json,tsconfig.json}`
- Create: `packages/contract/src/<도메인>/{schema.ts,index.ts}` — 도메인은 `generator` · `lotterietus` · `picks` · `results` · `simulation` · `statistics`
- Delete: `packages/core/src/*/dto/`
- Modify: `packages/core/package.json` (exports 에서 `./*/dto` 제거, contract 의존 추가)
- Modify: `packages/core/src/**` · `apps/web/src/**` · `apps/worker/src/**` 의 DTO import
- Modify: `package.json` · `turbo.json` · `tsconfig.base.json` (새로 만든다)
- Test: `packages/contract/src/<도메인>/schema.test.ts`

**Interfaces:**
- Produces: `@fortuna-lottery/contract/<도메인>` 하위 경로. 스키마 `<이름>Schema` 와 타입 `<이름>` 짝. 아래 표가 이름을 고정한다.

| 옛 이름 | 새 이름 |
|---|---|
| `GenerateRequest` / `GenerateResponse` | `GeneratorGenerateRequest` / `GeneratorGenerateResponse` |
| `DrawResponse` | `LotterietusDraw` (응답 조각) |
| `LotterietusStatusResponse` | 그대로 |
| `SavePickRequest` / `PickResponse` | `PicksSaveRequest` / `PicksItem` (목록 응답은 `PicksListResponse = PicksItem[]`) |
| `ResultsResponse` / `ResultItemResponse` | `ResultsCheckResponse` / `ResultsCheckItem` |
| `SimulationRequest` / `SimulationResponse` | `SimulationBacktestRequest` / `SimulationBacktestResponse` |
| `StatisticsResponse` | `StatisticsGetResponse` — `StatisticsReadModel` 을 상속하지 않고 필드를 스키마에 직접 적는다 |

- [ ] **Step 1: 스키마 시험을 먼저 쓴다.** 조합을 담는 스키마마다 `schema.test.ts` 에 네 단언을 둔다. `[1,2,3,4,5,6]` 은 통과한다. 원소 7개, `46` 이 섞인 것, `[1,1,2,3,4,5]` 는 `safeParse(...).success === false` 다. 번호 규칙은 `CombinationVO` 와 같게 「6개 · 1~45 · 중복 없음」이다.
- [ ] **Step 2: 시험이 실패하는지 확인한다.** Run: `pnpm --filter @fortuna-lottery/contract test` Expected: FAIL (모듈 없음).
- [ ] **Step 3: 계약 패키지를 만든다.** exports 는 baseline §4.1 모양 그대로 도메인마다 `{ types: ./dist/<d>/index.d.ts, import: ./dist/<d>/index.js }` 이고 단일 배럴 `"."` 을 두지 않는다. 빌드는 `tsc -p`. 옛 DTO 의 필드와 선택 여부를 한 글자도 바꾸지 않고 zod 로 옮기고, 타입은 `z.infer` 로 파생한다. 계약 안의 도메인 사이 참조(`results` 가 `LotterietusDraw` 를 쓰는 것)는 `../lotterietus/schema` 상대 경로로 둔다.
- [ ] **Step 4: 시험이 통과하는지 확인한다.** Run: `pnpm --filter @fortuna-lottery/contract test` Expected: PASS.
- [ ] **Step 5: 워크스페이스 설정을 baseline §3 에 맞춘다.** `packageManager: pnpm@11.18.0`. 루트 스크립트 `build · test · typecheck · lint`. `turbo.json` 의 `test` · `lint` · `typecheck` 에 `dependsOn: ["^build"]` 를 건다. 비워 두면 계약이 빌드되기 전에 앱이 검사된다. `tsconfig.base.json` 을 만들고 각 패키지 tsconfig 가 그것을 `extends` 하게 한다.
- [ ] **Step 6: 옛 DTO 를 지우고 import 를 바꾼다.** core 유스케이스와 web 모듈이 옛 이름을 새 이름으로 import 한다. 이 과업에서는 import 경로와 타입 이름만 바꾼다. web 의 `api/client.ts` 가 계약을 참조하는 위반은 도메인 과업에서 사라진다. `next.config.ts` 의 `transpilePackages` 에서 contract 는 빼도 된다(dist 를 쓴다).
- [ ] **Step 7: 판정 명령을 돌린다.** baseline §4.4 명령으로 계약 참조 자리를 찍어 둔다. 지금은 위반이 남는 것이 정상이다. 결과를 커밋 메시지 본문에 적는다.
- [ ] **Step 8: 전체 검증.** Run: `pnpm build && pnpm test && pnpm lint` Expected: 전부 통과, 시험 수는 core 44 · web 10 에 계약 시험이 더해진 값.
- [ ] **Step 9: 커밋한다.** `refactor(contract): DTO 를 zod 계약 패키지로 떼어 낸다`

---

## Task 2: 경계 검사기와 이관 표식을 켠다

**Files:**
- Create: `.dependency-cruiser.cjs`
- Create: `tools/checks/migration-status.sh`
- Create: `tools/checks/violations/<규칙이름>/…` (규칙마다 표본 하나)
- Modify: `package.json` (스크립트 `lint:deps` · `check` · `check:migration`)
- Modify: `apps/web/eslint.config.mjs` (의존 규칙을 걷어 내고 모양 규칙만 남긴다)

**Interfaces:**
- Produces: `options.exclude.path` 정규식. 이후 도메인 과업이 여기서 자기 경로를 뺀다.

- [ ] **Step 1: 규칙을 쓴다.** boundary-enforcement §3·§4 의 규칙 전부를 `severity: 'error'` 로 옮긴다: `no-cross-app` · `contract-only-in-mapper` · `no-deep-module-import` · `mapper-only-from-action` · `domain-model-has-zero-dependencies` · `domain-model-contract-import-must-be-type-only` · `no-upward-layer-dependency` · `domain-must-not-reach-context-or-business` · `api-imports-no-module` · `no-cross-module-import` · `module-must-not-reach-composition` · `composition-sees-facade-only` · `driver-only-in-adapter`. 옵션은 `tsPreCompilationDeps: true`, `tsConfig: { fileName: 'tsconfig.base.json' }`. 이 저장소만의 규칙을 하나 더한다: `web-must-not-reach-kernel` (`apps/web` 에서 `packages/kernel` 로 가는 의존 금지). `driver-only-in-adapter` 의 대상에 `@prisma/client` 를 더한다.
- [ ] **Step 2: 옛 구역을 전부 제외 목록에 넣는다.** `exclude.path` 는 `^(packages/core|apps/worker|apps/web/src/(modules|server|app/api))/` 다. 파일 머리에 incremental-migration §1 의 세 줄 주석을 그대로 둔다.
- [ ] **Step 3: 진행 판정 스크립트를 놓는다.** incremental-migration §4 스크립트를 `tools/checks/migration-status.sh` 에 옮기고 `check:migration` 이 그것을 부른다. 종료 코드로 합격을 가르지 않는다.
- [ ] **Step 4: 위반 표본을 만들고 실패하는지 확인한다.** 규칙마다 `tools/checks/violations/` 아래 표본 하나. Run: `pnpm depcruise tools/checks/violations --config .dependency-cruiser.cjs` Expected: 규칙마다 위반 하나씩, 규칙 이름이 출력에 모두 나온다. 이 명령은 `check` 에 넣지 않는다.
- [ ] **Step 5: 새 구역이 통과하는지 확인한다.** Run: `pnpm lint:deps` Expected: 위반 0 (새 구역은 `packages/contract` 뿐이다).
- [ ] **Step 6: ESLint 에서 의존 규칙을 걷어 낸다.** `no-restricted-imports` 가 하던 일은 depcruise 가 갖는다. 두 도구를 합치지 않는다(boundary-enforcement §2). 모양 규칙은 Task 3 에서 더한다.
- [ ] **Step 7: 커밋한다.** `chore(check): dependency-cruiser 경계 검사와 이관 제외 목록을 켠다`

---

## Task 3: `apps/api` 골격 · 커널 · 화면 공용 도구를 세운다

동작하는 도메인은 아직 없다. 이 과업이 끝나면 `apps/api` 가 떠 있고, 아무 경로도 넘겨받지 않은 채 대기한다.

**Files:**
- Create: `packages/kernel/{package.json,tsconfig.json}`, `packages/kernel/src/{combination,scoring,rng,result,index}.ts` 와 옛 시험 둘
- Delete: `packages/core/src/shared/` (core 안의 import 는 kernel 로 바꾼다)
- Create: `apps/api/{package.json,tsconfig.json,nest-cli.json,vitest.config.ts}`
- Create: `apps/api/src/{main.ts,app.module.ts,config.ts}`
- Create: `apps/api/src/composition/CompositionModule.ts` (`@Global()`, 아직 비어 있다)
- Create: `apps/api/src/infrastructure/prisma/{PrismaService.ts,PrismaModule.ts}`
- Move: `packages/core/prisma/` → `apps/api/prisma/`
- Modify: `apps/web/next.config.ts` (`rewrites`)
- Create: `apps/web/src/shared/lib/serverCache.ts`, `apps/web/src/shared/lib/fetchJson.ts` (+ 시험)
- Modify: `apps/web/vitest.config.ts` (jsdom), `apps/web/eslint.config.mjs` (모양 규칙)
- Modify: `docker-compose.yml` 이 Prisma 경로를 가리키면 함께 고친다

**Interfaces:**
- Produces: `@fortuna-lottery/kernel` — 옛 `core/shared` 의 공개 이름 그대로.
- Produces: `PrismaService extends PrismaClient implements OnModuleDestroy`.
- Produces: `createServerCache<T>(load: () => Promise<T>)` → `{ read(): T | undefined; subscribe(fn): () => void; refresh(): Promise<T>; invalidate(): void }` 와 그것을 읽는 `useServerCache(cache)` 훅(`useSyncExternalStore`). 이름과 모양은 frontend-module-layout 의 action 절이 정한 것을 따르고, 거기서 이름이 다르면 그쪽을 따른다.
- Produces: `fetchJson<T>(path: string, init?: RequestInit): Promise<unknown>` — 파싱은 mapper 가 계약 스키마로 한다.

- [ ] **Step 1: 커널을 옮긴다.** 로직을 바꾸지 않고 옮긴다. 옛 시험 둘(`combination.test.ts` · `scoring.test.ts`)이 새 자리에서 통과한다.
- [ ] **Step 2: Nest 가 뜨는 시험을 쓴다.** `apps/api/src/app.module.test.ts`: `Test.createTestingModule({ imports: [AppModule] })` 가 컴파일되고 `app.getHttpServer()` 로 `GET /api/health` 가 `200 { ok: true }` 를 준다. 이 헬스 경로는 `app.module.ts` 에 둔다(모듈이 아니다).
- [ ] **Step 3: 골격을 만든다.** 포트 `4000`, 전역 접두 `api`. vitest 는 `unplugin-swc` 로 데코레이터 메타데이터를 낸다. `PrismaModule` 은 `infrastructure/` 에 두고 `PrismaService` 만 내보낸다.
- [ ] **Step 4: 시험이 통과하는지 확인한다.** Run: `pnpm --filter @fortuna-lottery/api test` Expected: PASS.
- [ ] **Step 5: `rewrites` 를 건다.** `rewrites: async () => ({ fallback: [{ source: '/api/:path*', destination: `${process.env.API_ORIGIN ?? 'http://localhost:4000'}/api/:path*` }] })`. `fallback` 이므로 파일 시스템 경로(남은 Next 처리기)가 먼저다.
- [ ] **Step 6: 전환 순서를 손으로 확인한다.** 두 서버를 띄우고(`pnpm dev`) `curl localhost:3000/api/generator -X POST ...` 가 Next 처리기에서 응답하는지(응답 헤더나 로그로), `curl localhost:3000/api/health` 가 api 에서 `{ ok: true }` 로 오는지 본다. Review Focus 1번이다.
- [ ] **Step 7: 화면 공용 도구와 시험 환경을 깐다.** vitest 환경을 jsdom 으로 바꾸고 `@testing-library/react` 를 더한다. 기존 web 시험 10개가 jsdom 에서 그대로 통과해야 한다. `serverCache.test.ts` 는 `refresh` 한 번에 `load` 가 한 번 불리고, `invalidate` 뒤 구독자가 알림을 받는 것을 단언한다.
- [ ] **Step 8: ESLint 모양 규칙을 더한다.** frontend-module-layout 과 boundary-enforcement 가 정한 모양 규칙: 뷰 파일(`modules/**/*.tsx`)의 `useState` 금지, 표시 모델 얕은 전개(`{...vm}`) 금지, 뷰 폴더 공개 표면 봉쇄(fractal-view-promotion §7). 옛 구역 글롭은 ESLint `ignores` 로 빼고, 그 목록이 depcruise `exclude` 와 같은 경로를 가리키게 한다.
- [ ] **Step 9: 전체 검증.** Run: `pnpm check` Expected: 통과. `pnpm check:migration` 이 옛 구역 전부와 「옮긴 모듈 0」을 찍는다.
- [ ] **Step 10: 커밋한다.** 커널 이동과 골격을 나눠 둘로 커밋한다. `refactor(kernel): 로또 순수 커널을 packages/kernel 로 옮긴다` · `chore(api): NestJS 응용 서버 골격과 화면 공용 도구를 세운다`

---

## 도메인 과업(4~8)의 공통 걸음

도메인 과업 하나는 incremental-migration §5 의 일곱 걸음을 서버와 화면에 한 번씩 밟는다. 과업마다 다시 적지 않고 여기 한 번만 적는다.

**서버 쪽**
1. `apps/api/src/modules/<도메인>/` 에 `interface/{api,facade}` · `business/` · `domain/{model,port,adapter}` 를 판다. `context/` 는 과업이 「있음」이라고 적은 도메인만 판다.
2. 도메인 원형(`domain/model`)과 순수 계산을 로직 변경 없이 옮긴다. 옛 시험을 함께 옮긴다.
3. 포트(`domain/port`, 프로퍼티 꼴 메서드 + `Symbol` 토큰)와 어댑터(`domain/adapter`)를 옮긴다. 남의 도메인이 필요하면 자기 `domain/port/` 에 인터페이스를 두고, `CompositionModule` 이 `{ provide: TOKEN, useExisting: XFacade }` 로 상대 facade 를 꽂는다.
4. 유스케이스를 `business/` 에 파일 하나씩 옮긴다. 옛 `makeX(deps)` 팩토리는 `@Injectable()` 클래스가 된다. 옛 유스케이스 시험은 가짜 포트를 주입해 그대로 통과해야 한다.
5. facade 가 도메인 원형을 계약 모양으로 옮기고, 컨트롤러는 요청 `schema.parse` → facade → 응답 `schema.parse` 셋만 한다. 스모크 시험 하나(정상 200)와 스키마 거절 하나(400)를 둔다.
6. `<X>Module.ts` 가 facade 하나만 내보낸다. `app.module.ts` 에 등록한다.

**화면 쪽**
7. 대표 화면마다 모듈 루트에 PascalCase 뷰 파일이나 폴더를 세운다. `view/` · `viewmodel/` · `transport/` · `api/` 폴더를 두지 않는다.
8. `model/<이름>.model.ts` 에 도메인 원형 class, `model/<이름>.viewmodel.ts` 에 `extends` 한 표시 모델 class 를 둔다. 파생값은 prototype getter 이고, 「그 인스턴스 하나만 보고 정해지는가」가 아니면 presenter 에 남긴다.
9. `mapper/<유스케이스>.mapper.ts` 가 계약 스키마로 응답을 파싱하고 도메인 원형으로 옮긴다. 계약 import 는 mapper 에만 있다.
10. `action/<유스케이스>.action.ts` 가 `createServerCache` 로 모듈 수준 캐시를 갖고, mapper 를 부르는 유일한 자리다. 쓰기 action 은 자기가 무효화할 캐시를 스스로 무효화한다(presenter 가 「저장 후 재조회」를 조합하지 않는다).
11. `<대표화면>.presenter.ts` 가 상호작용 상태와 자식별 입력 묶음을 돌려준다. 뷰에는 로직이 없다.
12. `index.ts` 가 대표 화면과 모델 타입만 내보낸다. 셸(`app/page.tsx`)이 보는 prop 이름과 타입은 바꾸지 않는다.

**마무리**
13. Next 경로 처리기 `apps/web/src/app/api/<도메인>/` 를 지운다. 이때부터 그 경로는 `rewrites` 로 `apps/api` 가 받는다. `apps/web/src/server/container.ts` 에서 그 도메인 줄을 지운다.
14. `packages/core/src/<도메인>/` 을 지운다.
15. `.dependency-cruiser.cjs` 의 `exclude` 와 ESLint `ignores` 에서 그 도메인 경로를 뺀다. 도메인이 다 빠지기 전에는 `exclude` 정규식을 도메인 목록으로 풀어 쓴다(예: `packages/core/src/(picks|results)/`).
16. Run: `pnpm check` Expected: 통과. Run: `pnpm check:migration` Expected: 「옮긴 모듈」에 `apps/api/src/modules/<도메인>` 과 `apps/web/src/modules/<도메인>` 이 나오고 「옛 구역에 최근 생긴 파일」이 없음.
17. 브라우저로 그 도메인 화면을 한 번 써 본다(`run` 스킬). 이관 전과 같은 결과여야 한다.
18. 커밋은 서버 하나 · 화면 하나 · 정리 하나로 셋이다. 셋 다 `refactor(<도메인>): …` 이다.

---

## Task 4: `identity` 와 `generator`

가장 작은 둘이다. 배관(Nest DI · 조립 루트 · 화면 action 캐시)을 여기서 처음 뚫는다.

**identity** — 서버 `context/` 없음, 경로 처리기 없음.
- 서버: `domain/model/User.model.ts`, `domain/port/IdentityPort.ts`(`IDENTITY_PORT`), `domain/adapter/GuestIdentityAdapter.ts`, `interface/facade/IdentityFacade.ts` (`currentUser(): Promise<User>`). 컨트롤러는 만들지 않는다(화면이 부르지 않는다).
- 화면: 서버를 부르지 않으므로 `action/`·`mapper/` 를 만들지 않는다. `IdentityBadge.tsx` + `IdentityBadge.presenter.ts` 만 둔다. presenter 1:1 정책 때문에 로직이 없어도 presenter 를 둔다.
- 시험: `IdentityFacade` 가 게스트 사용자를 돌려주는 단위 시험 하나를 새로 쓴다(지금 시험 0개).

**generator** — 서버 `context/` 없음(외부 재료 0).
- 서버: 순수 생성 함수와 `generate.test.ts` 를 `domain/model/` 로 옮긴다. `business/GenerateCombination.ts` 는 `RNG` 토큰으로 `Math.random` 을 받는다. `POST /api/generator` 컨트롤러.
- 화면: 대표 화면 `GeneratorCard`. 상호작용 상태(mode, 고른 번호)는 presenter, 생성 결과는 `action/generateCombination.action.ts`. `canGenerate` 와 `modeHint` 는 모드와 선택 둘을 보므로 presenter 에 둔다.

- [ ] **Step 1: identity 서버 → 시험 → 커밋**
- [ ] **Step 2: identity 화면 → 커밋**
- [ ] **Step 3: generator 서버 (공통 걸음 1~6) → 커밋**
- [ ] **Step 4: generator 화면 (공통 걸음 7~12) → 커밋**
- [ ] **Step 5: 마무리 (공통 걸음 13~17) → 커밋.** 서버 스모크: `POST /api/generator` 에 `{ mode: 'random' }` 이 번호 6개를 돌려주고, 번호 7개를 보내면 400.

---

## Task 5: `picks`

**서버** — `context/` 없음. 첫 모듈 간 포트(identity)가 여기서 생긴다.
- `domain/model/Pick.model.ts`(옛 `pick.entity.ts` + `pick.vo.ts` 가 합쳐진 도메인 원형), `domain/port/PickRepositoryPort.ts`(`PICK_REPOSITORY`), `domain/port/CurrentUserPort.ts`(`CURRENT_USER` — 조립 루트가 `IdentityFacade` 를 꽂는다), `domain/adapter/InMemoryPickRepository.ts`.
- `business/{SavePick,ListPicks,DeletePick}.ts`. `picks.usecases.test.ts` 를 세 파일 옆으로 나눠 옮기되 단언은 그대로 둔다.
- 컨트롤러: `GET /api/picks`, `POST /api/picks`, `DELETE /api/picks/:id`.
- `InMemoryPickRepository` 는 Nest 기본 싱글턴 공급자다. facade 시험이 「저장 → 목록에 보임 → 삭제 → 목록에서 사라짐」을 한 모듈 인스턴스에서 단언한다(Review Focus 3).

**화면** — 대표 화면 `PicksCard`. `action/listPicks.action.ts` · `savePick.action.ts` · `deletePick.action.ts`. 저장·삭제 action 이 `listPicks` 캐시를 무효화한다. `transport/pick-transport.test.ts` 는 `mapper/` 시험으로 옮긴다.

- [ ] **Step 1: 서버 → 커밋**
- [ ] **Step 2: 화면 → 커밋**
- [ ] **Step 3: 마무리 → 커밋.** `app/api/picks/route.ts` 와 `app/api/picks/[id]/route.ts` 를 같은 커밋에서 지운다(Review Focus 2).

---

## Task 6: `lotterietus` 와 워커 흡수

가장 큰 서버 모듈이다. 다른 세 도메인(statistics · simulation · results)이 이 모듈의 회차 데이터를 포트로 받는다.

**서버** — `context/` 있음(외부 재료 = 동행복권 원격 + DB).
- `domain/model/`: `Draw.model.ts`, `drawnAt.ts`, `schedule.ts` 와 그 시험.
- `domain/port/`: `DrawDataPort`(`DRAW_DATA`), `DrawSourcePort`(`DRAW_SOURCE`), `DrawWriterPort`(`DRAW_WRITER`). 메서드는 프로퍼티 꼴로 바꾼다.
- `domain/adapter/`: `PrismaDrawDataAdapter` · `PrismaDrawWriterAdapter`(둘 다 `PrismaService` 주입), `DhlotteryDrawSourceAdapter`, `DummyDrawDataAdapter`(시험용). `driver-only-in-adapter` 에 걸리는 전역 `fetch` 와 `@prisma/client` 는 이 폴더에만 있다.
- `business/{GetLotterietusStatus,IngestDraws}.ts` 와 그 시험.
- `interface/facade/LotterietusFacade.ts`: `status()`, `ingest()`, 그리고 다른 모듈이 쓸 `findAll(): Promise<Draw[]>` · `findByRound(round: number)` 를 낸다. 다른 모듈이 옛 `DrawDataPort` 에서 부르던 메서드를 그대로 facade 에 둔다.
- `interface/api/LotterietusController.ts`: `GET /api/lotterietus`.
- `interface/api/LotterietusIngestScheduler.ts`: 옛 `apps/worker/src/main.ts` 의 반복을 옮긴다. `AFTER_DRAW_BUFFER_MS = 10 * 60 * 1000`, `RETRY_DELAY_MS = 5 * 60 * 1000`, 로그 문구 그대로. `OnApplicationBootstrap` 에서 첫 사이클을 돌리고, `OnModuleDestroy` 에서 대기 타이머를 지운다. `SCHEDULER_ENABLED=false` 면 시작하지 않는다(시험과 두 번째 인스턴스용).
- 시험: 가짜 시계로 「성공하면 다음 추첨 + 10분 뒤, 실패하면 5분 뒤 예약」과 「종료하면 대기 타이머가 남지 않는다」를 단언한다(Review Focus 5).

**화면** — 대표 화면 `LotterietusCard`. `now` 1초 틱과 `formatRemaining` 은 presenter. `format-remaining.test.ts` 는 presenter 옆으로 옮긴다. `action/getLotterietusStatus.action.ts`.

**정리**
- `apps/worker/` 를 지운다. 루트 `package.json`·`turbo.json` 에서 워커 스크립트를 걷어 낸다.
- 아직 옮기지 않은 statistics · simulation · results 는 옛 `container.ts` 에서 옛 `DrawDataPort` 를 계속 쓴다. 이 과업에서 옛 `packages/core/src/lotterietus/` 중 그 셋이 쓰는 파일(`draw.ts`, `draw-data.port.ts`, Prisma 읽기 어댑터, `prisma-client.ts`)은 남기고, 나머지만 지운다. 남긴 파일은 Task 8 에서 지운다. 제외 목록은 줄기만 하므로 이 파일들은 원래 제외 구역 안에 남는다.

- [ ] **Step 1: 서버 모듈 → 커밋**
- [ ] **Step 2: 스케줄러와 워커 삭제 → 커밋.** 두 서버를 띄워 로그에 「사이클 완료」 한 줄이 찍히는지 본다.
- [ ] **Step 3: 화면 → 커밋**
- [ ] **Step 4: 마무리 → 커밋**

---

## Task 7: `statistics` 와 `simulation`

둘 다 lotterietus 의 회차 데이터만 받는 읽기 전용 도메인이다.

**statistics**
- 서버: `context/` 없음. `domain/port/DrawHistoryPort.ts`(`DRAW_HISTORY`, `findAll`) — 조립 루트가 `LotterietusFacade` 를 꽂는다. `calculations.ts` 와 시험을 `domain/model/` 로. 옛 `StatisticsReadModel` 은 `domain/model/Statistics.model.ts` 가 되고, facade 가 그것을 `StatisticsGetResponse` 로 옮긴다. `GET /api/statistics`.
- 화면: 가장 큰 화면 모듈(16파일)이다. `StatisticsPanel/` 폴더로 승격한다(자식 뷰 8개를 가져오므로). 옛 `statistics-panel.tsx` 의 `useState` 는 `StatisticsPanel.presenter.ts` 로 간다. `presenters.ts` 함수 9개는 판별식으로 나눈다: 인스턴스 하나로 정해지는 것은 ViewModel getter, `hottest` · `coldest` 처럼 전체를 보는 것은 presenter. 번호 배열 하나만 보는 `sumOf` · `oddCountOf` 는 한 뷰만 쓰면 그 뷰 폴더의 `model/`, 여럿이 쓰면 `StatisticsPanel/model/` 에 둔다. `presenters.test.ts` 64줄의 단언은 옮긴 자리에서 그대로 통과한다.

**simulation**
- 서버: `context/` 없음. statistics 와 같은 `DrawHistoryPort` 를 **자기 모듈 안에 따로** 둔다(모듈 간 import 금지). `backtest.ts` 와 시험을 옮긴다. `POST /api/simulation`.
- 화면: 대표 화면 `SimulationCard`. `summarizeRanks` 와 `summaryLine` 은 백테스트 결과 인스턴스 하나로 정해지므로 `SimulationResult.viewmodel.ts` 의 getter.

- [ ] **Step 1: statistics 서버 → 커밋**
- [ ] **Step 2: statistics 화면 → 커밋**
- [ ] **Step 3: statistics 마무리 → 커밋**
- [ ] **Step 4: simulation 서버 → 커밋**
- [ ] **Step 5: simulation 화면 → 커밋**
- [ ] **Step 6: simulation 마무리 → 커밋**

---

## Task 8: `results` 와 옛 구역 철거

results 는 picks 와 lotterietus 두 모듈의 데이터를 받는다. 옛 코드에서 결합이 가장 크다.

**서버** — `context/` 있음(입력 = 사용자의 픽 + 해당 회차).
- `domain/port/{PickSourcePort,DrawHistoryPort}.ts` — 조립 루트가 `PicksFacade` 와 `LotterietusFacade` 를 꽂는다.
- `context/ResultsCheckContext.ts` 가 두 포트에서 픽과 회차를 모아 회차별로 묶는다. 판정은 하지 않는다.
- `business/CheckResults.ts` 가 커널 `scoring` 으로 등수를 판정한다. 옛 `check-results.test.ts` 가 picks 의 `InMemoryPickRepository` 를 직접 가져오던 것은 가짜 `PickSourcePort` 로 바꾼다. 단언은 그대로.
- `GET /api/results`.

**화면** — 대표 화면 `ResultsCard`. `resultLabel` 은 `ResultsCheckItem.viewmodel.ts` 의 getter.

**철거**
- `packages/core/` 를 통째로 지운다(Task 6 에서 남긴 lotterietus 파일 포함). `next.config.ts` 의 `transpilePackages` 와 `serverExternalPackages` 에서 core 와 Prisma 를 걷어 낸다.
- `apps/web/src/server/` 를 지운다. `apps/web/src/app/api/` 가 비었는지 확인하고 지운다.
- `.dependency-cruiser.cjs` 의 `exclude` 에는 이제 옛 셸 파일만 남는다. 셸은 Task 9 에서 옮긴다.

- [ ] **Step 1: 서버 → 커밋**
- [ ] **Step 2: 화면 → 커밋**
- [ ] **Step 3: 철거 → 커밋.** `pnpm check:migration` 이 서버 모듈 7개와 화면 모듈 7개를 「옮긴 모듈」로 찍는다.

---

## Task 9: 셸을 옮기고 이관을 닫는다

**Files:**
- Create: `apps/web/src/app/Home.presenter.ts` (+ 시험)
- Modify: `apps/web/src/app/page.tsx`
- Modify: `.dependency-cruiser.cjs` (`exclude` 삭제), `apps/web/eslint.config.mjs` (`ignores` 에서 옛 구역 삭제)
- Modify: `CLAUDE.md`, `.claude/context/design-system.md`(경로가 바뀐 곳만)

- [ ] **Step 1: 셸 presenter 시험을 쓴다.** `Home.presenter.test.ts`: 생성기가 번호를 올리면 `currentNumbers` 가 바뀌어 statistics · simulation · picks 입력 묶음에 같은 배열이 들어간다. `onToggleGenerator` 가 `isGeneratorOpen` 을 뒤집는다.
- [ ] **Step 2: `page.tsx` 의 `useState` 셋을 presenter 로 옮긴다.** `page.tsx` 는 조립과 묶음 전개만 한다.
- [ ] **Step 3: 제외 목록을 비운다.** `exclude` 와 ESLint 옛 구역 `ignores` 를 지운다. Run: `pnpm check` Expected: 통과. Run: `pnpm check:migration` Expected: 「옛 구역 파일: 0」.
- [ ] **Step 4: `CLAUDE.md` 를 다시 쓴다.** 명령어(두 서버 `pnpm dev`, `check`, `check:migration`), 아키텍처 절(골조 문서를 가리키고 이 저장소의 결정 사항 여섯 줄만 적는다), 모델 타입 용어 표(옛 `use*ViewModel` = presenter 라는 뜻을 버리고 vault model-vocabulary 를 가리킨다), MVP 현황(`apps/api` 가 수집과 조회를 모두 한다), 2-tier 엄격도(vault 골조의 `context/` 판별식으로 대체되므로 지운다). 「이관 중」 표기와 v2 설계 줄을 지우고, v2 설계 문서 머리에 「vault 골조로 대체됨(2026-09-29 계획)」 한 줄을 적는다.
- [ ] **Step 5: 전체 검증과 브라우저 확인.** `pnpm build && pnpm check`. 두 서버를 띄워 홈의 모든 탭을 한 번씩 써 본다.
- [ ] **Step 6: 커밋한다.** `refactor(web): 셸 상태를 Home presenter 로 옮기고 골조 이관을 닫는다`
- [ ] **Step 7: vault 에 되돌려 줄 것을 적는다.** 이 저장소에서는 고치지 않는다. 사용자에게 두 가지를 보고한다.
  - `architecture-baseline` 의 「이 골조를 따르는 저장소」 표에 로또랩 한 줄(두 서버, 완료)을 더할 것.
  - 이 계획의 「vault 문서가 답하지 않아 이 계획이 정한 것」 여섯 줄을 골조 문서에 반영할지 판단할 것.
