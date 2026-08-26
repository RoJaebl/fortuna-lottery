# 백엔드 아키텍처 v4 (NestJS · 4계층) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `packages/core`의 헥사고날 백엔드를 `apps/api`(NestJS)의 `interface / business / context / domain (+infra)` 4계층 모듈 7개로 옮기고, `apps/web`은 도메인을 모르는 catch-all 프록시 한 장으로 중계한다.

**Architecture:** 모듈 하나가 프랙탈 단위다 — `interface`가 모듈을 대표하고, `business`가 도메인 언어로 정책을 판단하며, `context`가 외부 재료를 조립하고, `domain`이 데이터와 순수 계산을 소유한다. 계약의 구현체는 전부 `infra/`에 모이고, **다른 모듈을 아는 파일은 `infra/gateway/**` 뿐**이다. 모듈 경계를 넘는 타입은 `packages/contract`의 DTO뿐이라 나중에 서비스로 잘라낼 때 직렬화 계층이 새로 필요하지 않다.

**Tech Stack:** NestJS 11 · TypeScript 5.8 · Prisma 6 (PostgreSQL) · Vitest 3 (+ unplugin-swc) · `@nestjs/schedule` · Next.js 15 (프록시)

**근거 스펙:** `docs/superpowers/specs/2026-08-08-fortuna-lottery-backend-architecture-v4-design.md`
(v2 문서의 백엔드 아키텍처·모델 타입 용어·2-tier 엄격도·마이그레이션 경로를 대체한다)

---

## 선행 조건

**이 계획은 `2026-08-08-client-architecture-v3-refinement.md`가 끝난 뒤에 실행한다.**
스펙 §10의 1단계(`packages/contract` 분리)와 2단계(프론트 리팩터)가 그 계획에서 이미 끝나 있다 — 이 계획의 Task 1은 그 사실을 확인만 한다.

---

## 이 계획을 실행하기 전에 알아야 할 것

### 네 계층을 가르는 시금석 (스펙 §1.1)

> **이 코드를 도메인 전문가(로또 서비스 기획자)에게 그대로 읽어줄 수 있는가?**
> 읽어줄 수 있으면 `business`, 없으면 `context`.

- "6개가 모두 일치하면 1등, 5개와 보너스가 일치하면 2등" → **business**
- "픽 목록과 해당 회차를 병렬로 조회해 회차별로 묶는다" → **context**
- "45개 번호의 출현 빈도를 센다" → **domain**(순수 계산)
- "조회 결과를 5분간 캐싱한다" → **infra**

### context를 만드는 기준 (스펙 §4.1)

> **유즈케이스가 *외부에서* 재료를 받아올 때만 만든다.** 자기 모듈 `domain` 하나로 끝나면 만들지 않는다.
> 기계적 판별식: *"`context/port`(따라서 `infra/gateway/`)가 필요한가?"*

| 모듈 / 유즈케이스 | 외부 재료 | context |
|---|---|---|
| `picks` list · save · delete | identity | **O** (3개) |
| `results` check | identity + picks + draws | **O** |
| `simulation` backtest | draws | **O** |
| `statistics` get | draws | **O** |
| `lotterietus` ingest-draws | 동행복권 API | **O** |
| `lotterietus` get-status | 자기 domain만 | X |
| `generator` generate | 없음 (순수 계산) | X |
| `identity` | 자기 domain만 | X |

### 절대 어기면 안 되는 5가지 (스펙 §3.2 — ESLint로 CI 실패)

1. **역방향 import 전부** — `domain → context`, `context → business`, `business → interface` …
2. **어떤 레이어든 `infra` import** — 구현체는 오직 DI로 주입된다. `*.module.ts`만 예외(컴포지션 루트)
3. **다른 모듈의 `interface` 외 폴더 접근** — 그리고 접근이 허용되는 파일은 `infra/gateway/**` 뿐
4. **같은 레이어 횡단** — `business → 다른 모듈 business` 등
5. **`domain`·`business`·`context`에서 `@prisma/client` import** — Prisma는 `infra/persistence/`에만

### port·repository는 `abstract class`다

Nest DI 토큰은 런타임 값이어야 하는데 TS `interface`는 컴파일 후 사라진다. `abstract class`면 토큰과 타입을 한 선언으로 겸한다. **예외 없이 전부 `abstract class`로 쓴다.**

### DTO는 반드시 `import type`으로 가져온다

`packages/contract`는 **TS 소스** 패키지이고 `apps/api`는 `moduleResolution: "node16"`인 CommonJS다. DTO는 전부 interface이므로 `import type`이면 컴파일 시 완전히 지워져 런타임 해석이 일어나지 않는다. **값 import를 하면 런타임에 깨진다.**

> ⚠️ **`import type`만으로는 충분하지 않다 — 계약 패키지가 ESM이면 컴파일 자체가 막힌다.** `packages/contract/package.json`에 `"type": "module"`이 있으면 CJS인 `apps/api`의 type-only import조차 **TS1541**(`Type-only import of an ECMAScript module from a CommonJS module must have a 'resolution-mode' attribute`)로 거부되고, 계약 패키지 내부의 확장자 없는 `export * from "./x.dto"`도 TS2307이 난다. 런타임 소거 여부와 무관한 **컴파일 단계 제약**이다.
> 따라서 동반 클라이언트 계획 Task 1에서 `packages/contract/package.json`에 `"type": "module"`을 **넣지 않는다**(그 계획에서 이미 제외했다). 이미 넣어버렸다면 이 계획 Task 1에서 제거하고 넘어간다 — `apps/web`은 `moduleResolution: "Bundler"` + `transpilePackages`라 제거해도 영향이 없다.

### 스펙과 의도적으로 다르게 가는 2가지 (이미 결정됐다 — 실행 중 재판단하지 말 것)

1. **4단계 도메인 순서에서 `results`를 `picks` 바로 뒤로 옮긴다.**
   스펙 §10은 `… → picks → statistics → simulation → results` 순이지만, `picks`가 Nest로 넘어가는 순간 픽은 **Nest 프로세스의 인메모리 저장소**에 들어간다. `results`가 아직 Next에 남아 있으면 다른 프로세스의 빈 저장소를 읽어 "결과 확인"이 항상 빈 목록이 된다. `results`의 의존(identity·picks·lotterietus)은 그 시점에 전부 이전이 끝나 있으므로 앞당겨도 안전하다.
   → 실제 순서: **identity → lotterietus → generator → picks → results → statistics → simulation**
2. **`apps/worker` 삭제를 `lotterietus` 이전(Task 6)에서 함께 한다.**
   스펙 §10은 5단계로 미뤘지만, 그러면 Nest 스케줄러와 worker가 **동시에 동행복권 비공식 엔드포인트를 때린다.** upsert는 멱등이라 데이터는 안전하지만 불필요한 외부 요청은 피한다.

### 스펙 §9.4의 `combination.vo.ts`를 어떻게 다루는가

6개·1~45·중복 없음 검증(`createCombination`)은 `generator`·`picks`·`results`·`simulation` 네 모듈이 쓰므로 **`apps/api/src/shared/combination.ts`(순수 커널)에 남는다** — §3.1이 모든 레이어의 `shared` import를 허용한다. `picks/domain/model/combination.vo.ts`는 스펙이 지정한 파일명 그대로 두되, 그 안에는 **픽 전용 값 객체**(사용자 키 + 검증된 조합)인 `PickCombinationVO`가 들어간다.

### 셸 주의 — Windows Git Bash다

이 저장소의 개발 머신은 Windows 11이고 셸은 Git Bash다. **procps 도구(`pkill`·`pgrep`)가 없다.** 그래서 이 계획의 모든 기동/종료 절차는 `pkill` 대신 **런치 시 PID를 잡아 `kill $PID`로 내린다**(`kill`은 bash 빌트인이라 동작한다). 서버를 백그라운드로 띄울 때 `(cd dir && cmd &)` 형태로 서브셸에 넣으면 `$!`가 소실되므로, 항상 `(cd dir && cmd) & PID=$!` 형태를 쓴다.

### 브랜치 주의 (CLAUDE.md known quirk)

이 저장소는 OneDrive 동기화 폴더 안에 있다. 브랜치/워크트리가 필요하면 **raw `git worktree add` 금지** — Orca 네이티브 워크트리 생성(`EnterWorktree` 도구 또는 `orca worktree create`)을 쓴다.

---

## 파일 구조 (최종 상태)

```
packages/contract/src/<domain>/      DTO만 (identity 신규 추가)
apps/api/
  nest-cli.json · tsconfig.json · vitest.config.ts · vitest.setup.ts · eslint.config.mjs
  prisma/schema.prisma · prisma/migrations/     ← packages/core/prisma 에서 이사
  scripts/check-module-graph.mjs               모듈 그래프 DAG + gateway 전용 접근 검사
  src/
    main.ts · app.module.ts
    shared/   combination.ts · scoring.ts · rng.ts · result.ts · prisma.service.ts · prisma.module.ts
              httpException.filter.ts · index.ts
    modules/
      identity/     interface(facade) · business · domain(model·repository) · infra(persistence)
      lotterietus/  interface(controller·facade·scheduler) · business ×2 · context(ingest) · domain · infra
      generator/    interface(controller·facade) · business · domain
      picks/        interface(controller·facade) · business ×3 · context ×3(+port) · domain · infra
      results/      interface(controller·facade) · business · context(+port ×3) · domain · infra(gateway ×3)
      statistics/   interface(controller·facade) · business · context(+port) · domain · infra(gateway)
      simulation/   interface(controller·facade) · business · context(+port) · domain · infra(gateway)
apps/web/
  src/app/api/[...path]/route.ts       ← 이 파일 하나가 기존 7개를 대체
  tests/proxy.test.ts                  바이트 동일성 회귀 테스트
apps/worker/     삭제
packages/core/   삭제
```

---

## Task 1: 선행 조건 확인

- [ ] **Step 1: 프론트 계획이 끝났는지 확인한다**

```bash
cd "$(git rev-parse --show-toplevel)"
echo "--- packages/contract 존재? (기대: 6개 도메인 폴더) ---"
ls packages/contract/src
echo "--- 프론트가 4폴더 구조인가? (기대: 구 폴더 없음) ---"
find apps/web/src/modules -type d \( -name api -o -name viewmodel -o -name transport \)
echo "--- 작업 트리가 깨끗한가? ---"
git status --short
echo "--- 전체 그린인가? ---"
pnpm lint && pnpm test && pnpm build
```

Expected: `packages/contract/src`에 `generator lotterietus picks results simulation statistics`가 있고, `find` 결과가 비어 있고, `git status`가 깨끗하고, lint·test·build가 통과한다.

이 중 하나라도 어긋나면 **먼저 `2026-08-08-client-architecture-v3-refinement.md`를 끝낸다.**

---

## Task 2: `apps/api` 골격 — NestJS 부팅과 순수 커널 이사

**Files:**
- Create: `apps/api/package.json`, `tsconfig.json`, `nest-cli.json`, `vitest.config.ts`, `vitest.setup.ts`
- Create: `apps/api/src/main.ts`, `src/app.module.ts`
- Move: `packages/core/src/shared/*` → `apps/api/src/shared/`
- Move: `packages/core/prisma/` → `apps/api/prisma/`
- Create: `apps/api/src/shared/prisma.service.ts`, `prisma.module.ts`, `httpException.filter.ts`
- Modify: `packages/contract/package.json` (exports에 `types` 조건 추가)

---

- [ ] **Step 1: 계약 패키지 exports에 `types` 조건을 명시한다**

`apps/api`는 `moduleResolution: "node16"`을 쓰므로 `exports` 조건을 읽는다. 문자열 단축형 대신 조건 객체로 바꿔 두 리졸버(web의 bundler / api의 node16)가 같은 파일을 보게 한다.

`packages/contract/package.json`의 `exports`:

```json
  "exports": {
    "./*": {
      "types": "./src/*/index.ts",
      "default": "./src/*/index.ts"
    }
  },
```

- [ ] **Step 2: `apps/api` 패키지를 만든다**

`apps/api/package.json`:

```json
{
  "name": "@fortuna-lottery/api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch --exec \"node --env-file=.env\"",
    "build": "nest build",
    "start": "node --env-file=.env dist/main.js",
    "test": "vitest run",
    "lint": "eslint src && tsc --noEmit",
    "postinstall": "prisma generate",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@fortuna-lottery/contract": "workspace:*",
    "@nestjs/common": "^11.1.0",
    "@nestjs/core": "^11.1.0",
    "@nestjs/platform-express": "^11.1.0",
    "@nestjs/schedule": "^6.0.0",
    "@prisma/client": "6.19.3",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.1.0",
    "@swc/core": "^1.13.0",
    "@types/node": "^22.20.0",
    "@types/supertest": "^6.0.3",
    "eslint": "^9.28.0",
    "prisma": "6.19.3",
    "supertest": "^7.1.0",
    "typescript": "^5.8.0",
    "typescript-eslint": "^8.33.0",
    "unplugin-swc": "^1.5.0",
    "vitest": "^3.1.0"
  }
}
```

> **`postinstall: prisma generate`가 왜 여기 있어야 하나:** 지금 저장소에서 Prisma 클라이언트를 생성하는 훅은 `packages/core/package.json`의 `postinstall` **하나뿐**인데, Task 12가 그 패키지를 통째로 지운다. 지금 넣어두지 않으면 삭제 직후 새 clone·`pnpm install --force`에서 `@prisma/client`가 생성되지 않아 `tsc --noEmit`과 `nest build`가 전부 깨진다. 이 vault는 두 대의 기기에 동기화되지만 `node_modules`는 동기화되지 않으므로 실제로 밟게 되는 경로다.

> **`--env-file`을 dev/start에 붙이는 이유:** Node는 `.env`를 자동으로 읽지 않고 이 계획은 `@nestjs/config`를 도입하지 않는다. 그대로 두면 `PrismaService.onModuleInit()`의 `$connect()`가 `DATABASE_URL` 없이 실패해 `pnpm dev`로 API가 아예 뜨지 않는다.

`apps/api/tsconfig.json` — **`node16` 해석**이라 `packages/contract`의 `exports`를 읽고, CommonJS 패키지라 상대 import에 확장자가 필요 없다:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "node16",
    "moduleResolution": "node16",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "declaration": false,
    "types": ["node"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

`apps/api/nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

`apps/api/vitest.setup.ts`:

```ts
// Nest DI는 데코레이터 메타데이터를 reflect-metadata에서 읽는다
import "reflect-metadata";
```

`apps/api/vitest.config.ts` — 데코레이터 메타데이터를 살리려면 esbuild가 아니라 SWC로 변환해야 한다:

```ts
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
  plugins: [swc.vite({ module: { type: "es6" } })],
});
```

- [ ] **Step 3: 순수 커널과 Prisma를 `apps/api`로 복사한다 (이동이 아니다)**

> **왜 `git mv`가 아니라 `cp`인가:** 스펙 §12는 "5단계(삭제)를 마지막에 두고 **그 전까지 core는 참조되지 않은 채 남아 있다**"고 규정한다. 파일을 실제로 옮기면 core의 배럴과 잔여 코드가 즉시 깨져 그 안전망이 사라진다. **Task 5~11의 모든 코드 이전은 복사이고, `packages/core`는 Task 12에서 통째로 지운다.** 잠시 테스트가 양쪽에서 두 번 도는 것은 오히려 이식이 정확했다는 증거다.

```bash
cd "$(git rev-parse --show-toplevel)"
mkdir -p apps/api/src/shared apps/api/src/modules
cp packages/core/src/shared/combination.ts       apps/api/src/shared/combination.ts
cp packages/core/src/shared/combination.test.ts  apps/api/src/shared/combination.test.ts
cp packages/core/src/shared/scoring.ts           apps/api/src/shared/scoring.ts
cp packages/core/src/shared/scoring.test.ts      apps/api/src/shared/scoring.test.ts
cp packages/core/src/shared/rng.ts               apps/api/src/shared/rng.ts
cp packages/core/src/shared/result.ts            apps/api/src/shared/result.ts
cp packages/core/src/shared/index.ts             apps/api/src/shared/index.ts
cp -R packages/core/prisma                       apps/api/prisma
```

`packages/core` 쪽은 한 줄도 건드리지 않는다 — 자기 `shared`와 `prisma`를 그대로 갖고 있으므로 계속 컴파일되고 테스트도 통과한다.

- [ ] **Step 4: Prisma 서비스와 Nest 부트스트랩을 만든다**

`apps/api/src/shared/prisma.service.ts`:

```ts
import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/** Prisma 수명을 Nest 모듈 생명주기에 묶는다 — 앱 전체에서 이 인스턴스 하나만 쓴다 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

`apps/api/src/shared/prisma.module.ts`:

```ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/** 전역 모듈 — 각 도메인 모듈이 imports에 반복해서 적지 않도록 한다 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

`apps/api/src/app.module.ts` — 도메인 모듈은 Task 5부터 하나씩 추가한다:

```ts
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./shared/prisma.module";

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
})
export class AppModule {}
```

`apps/api/src/shared/httpException.filter.ts` — **와이어 에러 계약을 기존 Next Route Handler와 동일하게 유지한다**:

```ts
import {
  Catch,
  HttpException,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";

/**
 * 기존 Next Route Handler는 실패 시 `{ error: "<도메인 메시지>" }`를 돌려줬고
 * `apps/web/src/shared/lib/fetcher.ts`는 그 `body.error`를 읽어 사용자에게 보여준다.
 * Nest 기본 직렬화는 `{ statusCode, message, error: "Bad Request" }`라서 그대로 두면
 * 한국어 도메인 메시지가 HTTP 상태 문구로 바뀐다 — 이 필터가 그 회귀를 막는다.
 * 프록시는 바디를 건드리지 않으므로(§7.1) 이 봉투는 브라우저까지 그대로 전달된다.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = exception.getResponse();
    const message =
      typeof body === "string"
        ? body
        : ((body as { message?: string | string[] }).message ?? exception.message);

    response
      .status(exception.getStatus())
      .json({ error: Array.isArray(message) ? message.join(", ") : message });
  }
}
```

`apps/api/src/main.ts`:

```ts
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./shared/httpException.filter";

const DEFAULT_PORT = 4000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  // 기본은 루프백 — 이 프로세스에 닿는 유일한 정상 경로는 web의 catch-all 프록시다(설계 §7.2).
  // 컨테이너 배포처럼 외부 바인딩이 필요할 때만 API_HOST를 명시적으로 연다.
  await app.listen(Number(process.env.PORT ?? DEFAULT_PORT), process.env.API_HOST ?? "127.0.0.1");
}

void bootstrap();
```

- [ ] **Step 5: 루트 설정을 갱신한다**

`.env.example` — api도 같은 DB를 본다:

```bash
# --- apps/api/.env 에만 넣는다 ---
# 로컬 Postgres (docker-compose.yml의 자격증명과 일치해야 한다)
# apps/web은 전환 후 Prisma를 쓰지 않으므로 웹 티어에 이 값을 배포하지 않는다 (최소 권한)
DATABASE_URL="postgresql://fortuna:fortuna_local@localhost:5432/fortuna_lottery?schema=public"
# Nest가 바인딩할 주소. 비워두면 127.0.0.1(루프백)이다 — 프록시만 도달 가능한 상태가 기본값이다.
# 컨테이너/사설망 배포에서 프록시가 다른 호스트에 있을 때만 0.0.0.0 등으로 연다.
API_HOST="127.0.0.1"

# --- apps/web/.env.local 에만 넣는다 ---
# apps/web 프록시가 중계할 백엔드 오리진 (서버 전용 — 브라우저에 노출되지 않는다)
API_ORIGIN="http://localhost:4000"
```

`packages/core/package.json`은 손대지 않는다 — 자기 prisma 스키마와 `postinstall`을 그대로 유지해야 Task 12까지 계속 컴파일된다. 스키마 파일이 두 곳에 있는 동안 **마이그레이션은 `apps/api` 쪽에서만 실행한다**(둘 다 같은 DB·같은 스키마를 본다).

```bash
pnpm install
pnpm --filter @fortuna-lottery/api exec prisma generate
```

- [ ] **Step 6: Nest가 뜨는지 확인한다**

```bash
docker compose up -d
pnpm --filter @fortuna-lottery/api exec nest build
(cd apps/api && node --env-file=.env dist/main.js) & API_PID=$!
sleep 4
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/
kill $API_PID
```

Expected: `404` — 라우트가 아직 없으니 Nest가 정상 부팅해서 404를 준다(연결 거부가 아니다).

> **env 파일 두 개를 지금 만든다** — Task 4의 프록시가 `API_ORIGIN`을 읽지 못하면 첫 컷오버(Task 6)가
> 곧바로 500이 난다. `.env`/`.env.local`은 `.gitignore` 대상이라 저장소에 없으므로 반드시 각자 만든다:
>
> ```bash
> cp .env.example apps/api/.env        # DATABASE_URL · API_HOST
> cp .env.example apps/web/.env.local  # API_ORIGIN (DATABASE_URL 줄은 지운다)
> ```

- [ ] **Step 7: 전체 검증과 커밋**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: 전부 통과 (`packages/core`의 44개 중 shared 테스트 일부가 `apps/api`로 옮겨간 만큼 개수가 이동한다).

```bash
git add apps/api packages/core packages/contract .env.example pnpm-lock.yaml
git commit -m "feat(api): NestJS 골격 + 순수 커널·Prisma 이사 (백엔드 v4 3단계)"
```

---

## Task 3: 경계 규칙 — ESLint 5조와 모듈 그래프 검사

**Files:**
- Create: `apps/api/eslint.config.mjs`
- Create: `apps/api/scripts/check-module-graph.mjs`
- Modify: `apps/api/package.json` (lint 스크립트)

---

- [ ] **Step 1: 레이어 의존 규칙을 ESLint로 쓴다**

`apps/api/eslint.config.mjs`:

```js
// 4계층 의존 규칙 (백엔드 v4 설계 §3.2) — 위반 = CI 실패
import tseslint from "typescript-eslint";

/** 레이어 폴더를 가리키는 상대 경로 패턴 (깊이 1~4단계까지 커버) */
const layer = (name) => [
  `../${name}`,
  `../${name}/*`,
  `../../${name}`,
  `../../${name}/*`,
  `../../../${name}`,
  `../../../${name}/*`,
  `./${name}`,
  `./${name}/*`,
];

const forbid = (names, message) => ({
  group: names.flatMap(layer),
  message,
});

/** 금지 2 — 어떤 레이어든 infra를 직접 보지 않는다 (구현체는 DI로만) */
const noInfra = forbid(
  ["infra"],
  "구현체는 DI로만 주입됩니다. infra/**를 직접 import할 수 있는 파일은 *.module.ts 뿐입니다 (§3.2-2).",
);

/** 금지 5 — Prisma는 infra/persistence 에만 */
const noPrisma = {
  group: ["@prisma/client"],
  message: "Prisma는 infra/persistence/**에서만 import합니다 (§3.2-5).",
};

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["src/**/*.ts"],
    languageOptions: { parser: tseslint.parser },
    rules: { "no-restricted-imports": ["error", { patterns: [noInfra] }] },
  },
  {
    // domain — 자기 domain 내부만. 위쪽 레이어와 Prisma 전부 금지
    files: ["src/modules/*/domain/**/*.ts"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            noInfra,
            noPrisma,
            forbid(
              ["context", "business", "interface"],
              "domain은 자기 domain 내부와 shared만 봅니다 (§3.2-1).",
            ),
          ],
        },
      ],
    },
  },
  {
    // context — domain과 자기 port까지. business·interface 금지
    files: ["src/modules/*/context/**/*.ts"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            noInfra,
            noPrisma,
            forbid(["business", "interface"], "context는 위쪽 레이어를 보지 않습니다 (§3.2-1)."),
          ],
        },
      ],
    },
  },
  {
    // business — context·domain까지. interface 금지
    files: ["src/modules/*/business/**/*.ts"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            noInfra,
            noPrisma,
            forbid(["interface"], "business는 interface를 보지 않습니다 (§3.2-1)."),
          ],
        },
      ],
    },
  },
  {
    // interface — 아래 세 레이어는 자유, Prisma만 금지
    files: ["src/modules/*/interface/**/*.ts"],
    languageOptions: { parser: tseslint.parser },
    rules: { "no-restricted-imports": ["error", { patterns: [noInfra, noPrisma] }] },
  },
  {
    // infra/persistence — Prisma가 허용되는 유일한 곳
    files: ["src/modules/*/infra/persistence/**/*.ts"],
    languageOptions: { parser: tseslint.parser },
    rules: { "no-restricted-imports": "off" },
  },
  {
    // infra/gateway — 다른 모듈의 interface를 볼 수 있는 유일한 곳 (그래프 검사가 별도로 확인)
    files: ["src/modules/*/infra/gateway/**/*.ts"],
    languageOptions: { parser: tseslint.parser },
    rules: { "no-restricted-imports": ["error", { patterns: [noPrisma] }] },
  },
  {
    // 컴포지션 루트 — 계약과 구현체를 묶는 자리라 infra를 본다
    files: ["src/modules/*/*.module.ts", "src/app.module.ts"],
    languageOptions: { parser: tseslint.parser },
    rules: { "no-restricted-imports": "off" },
  },
);
```

- [ ] **Step 2: 모듈 그래프 검사 스크립트를 쓴다 (§3.2-3 · §5.3)**

`apps/api/scripts/check-module-graph.mjs`:

```js
#!/usr/bin/env node
// 모듈 간 접근 규칙 검사 (백엔드 v4 설계 §3.2-3 · §5.3)
//  A. 다른 모듈을 import하는 파일은 infra/gateway/** 뿐이다
//  B. 그 대상은 상대 모듈의 interface/** 여야 한다
//  C. 모듈 의존 그래프에 순환이 없다 (DAG)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const MODULES_DIR = resolve(fileURLToPath(new URL("../src/modules", import.meta.url)));

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith(".ts") ? [full] : [];
  });
}

/** 파일 경로 → 소속 모듈 이름 (없으면 null) */
function moduleOf(file) {
  const rel = relative(MODULES_DIR, file);
  if (rel.startsWith("..")) return null;
  return rel.split(sep)[0] ?? null;
}

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s+["'](\.[^"']+)["']/g;
const violations = [];
const graph = new Map();

for (const file of walk(MODULES_DIR)) {
  const owner = moduleOf(file);
  if (!owner) continue;
  graph.set(owner, graph.get(owner) ?? new Set());

  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(IMPORT_RE)) {
    const specifier = match[1];
    const target = resolve(dirname(file), specifier);
    const targetModule = moduleOf(target);
    if (!targetModule || targetModule === owner) continue;

    const rel = relative(MODULES_DIR, file);
    const targetRel = relative(MODULES_DIR, target);
    graph.get(owner).add(targetModule);

    // 컴포지션 루트는 다른 모듈의 *.module.ts를 imports에 넣어야 하므로 두 규칙에서 제외한다
    if (file.endsWith(`${owner}.module.ts`)) continue;

    if (!rel.includes(`${sep}infra${sep}gateway${sep}`)) {
      violations.push(`${rel} → ${targetModule}: 다른 모듈은 infra/gateway/**에서만 봅니다 (§3.2-3)`);
    }
    if (!targetRel.includes(`${sep}interface`)) {
      violations.push(`${rel} → ${targetRel}: 다른 모듈은 interface/**만 접근할 수 있습니다 (§3.2-3)`);
    }
  }
}

// C. 순환 검사 (DFS)
const WHITE = 0;
const GREY = 1;
const BLACK = 2;
const color = new Map([...graph.keys()].map((m) => [m, WHITE]));

function visit(node, trail) {
  color.set(node, GREY);
  for (const next of graph.get(node) ?? []) {
    if (color.get(next) === GREY) {
      violations.push(`모듈 의존 순환: ${[...trail, node, next].join(" → ")}`);
      continue;
    }
    if (color.get(next) === WHITE) visit(next, [...trail, node]);
  }
  color.set(node, BLACK);
}

for (const node of graph.keys()) if (color.get(node) === WHITE) visit(node, []);

if (violations.length > 0) {
  console.error("모듈 경계 위반:");
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}
console.log(`모듈 그래프 OK — ${graph.size}개 모듈, 순환 없음`);
```

- [ ] **Step 3: lint 스크립트에 물린다**

`apps/api/package.json`의 `scripts.lint`:

```json
    "lint": "eslint src && tsc --noEmit && node scripts/check-module-graph.mjs",
```

- [ ] **Step 4: 검증**

```bash
mkdir -p apps/api/src/modules
pnpm --filter @fortuna-lottery/api lint
```

Expected: `모듈 그래프 OK — 0개 모듈, 순환 없음` 이 출력되고 종료 코드 0.

- [ ] **Step 5: 커밋**

```bash
git add apps/api
git commit -m "chore(api): 4계층 의존 규칙 ESLint + 모듈 그래프 DAG 검사 도입"
```

---

## Task 4: catch-all 프록시 배치 (아직 잠들어 있다)

Next는 **구체 경로가 catch-all보다 우선**하므로, 지금 프록시를 깔아도 기존 7개 `route.ts`가 계속 요청을 처리한다. 도메인별 `route.ts`를 지우는 순간 그 도메인만 Nest로 넘어간다 — 되돌리려면 그 파일 하나를 되살리면 된다.

**Files:**
- Create: `apps/web/src/app/api/[...path]/route.ts`
- Create: `apps/web/tests/proxy.test.ts`, `apps/web/tests/proxyOnly.test.ts`
- Modify: `apps/web/vitest.config.ts`

---

- [ ] **Step 1: 프록시를 만든다 (도메인 이름이 한 번도 등장하지 않는다)**

`apps/web/src/app/api/[...path]/route.ts`:

```ts
// apps/api(NestJS)로의 투명 중계. 이 파일은 도메인을 모른다 —
// 바디를 파싱하지 않고 스트림 그대로 흘리므로 DTO를 만질 방법 자체가 없다 (설계 §7.1).
export const dynamic = "force-dynamic";

/** 중계할 헤더만 고른다 — host·content-length 등 홉 단위 헤더는 넘기지 않는다 */
function forwardHeaders(req: Request): Headers {
  const allowed = ["cookie", "authorization", "content-type", "accept"];
  const headers = new Headers();
  for (const name of allowed) {
    const value = req.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  return headers;
}

async function proxy(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const origin = process.env.API_ORIGIN;
  if (!origin) throw new Error("API_ORIGIN 환경변수가 설정되지 않았습니다");

  const { path } = await params;
  const { search } = new URL(req.url);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  return fetch(`${origin}/${path.join("/")}${search}`, {
    method: req.method,
    headers: forwardHeaders(req),
    body: hasBody ? req.body : undefined,
    // 요청 바디를 스트림으로 흘릴 때 필요하다 (undici)
    ...(hasBody ? { duplex: "half" } : {}),
  } as RequestInit);
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
```

- [ ] **Step 2: 바이트 동일성 테스트를 쓴다 (§7.1의 회귀 방어선)**

`apps/web/vitest.config.ts`의 `include`에 `tests/`를 추가한다 —
프록시 테스트를 `src/app/api/` 밖에 두어야 §11의 "이 폴더 파일은 하나뿐" 조건이 유지된다:

```ts
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
```

`apps/web/tests/proxy.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/[...path]/route";

/** UTF-8 BOM + {"a":1} — 파싱해서 다시 만들면 절대 보존되지 않는 바이트열 */
const BODY_BYTES = new Uint8Array([0xef, 0xbb, 0xbf, 0x7b, 0x22, 0x61, 0x22, 0x3a, 0x31, 0x7d]);

let seen: { url: string; init: RequestInit } | null = null;

beforeEach(() => {
  process.env.API_ORIGIN = "http://api.test";
  seen = null;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(BODY_BYTES, { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const params = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe("catch-all 프록시", () => {
  it("경로와 쿼리를 그대로 이어 붙인다", async () => {
    await GET(new Request("http://web.test/api/anything/42?x=1&y=2"), params(["anything", "42"]));
    expect(seen?.url).toBe("http://api.test/anything/42?x=1&y=2");
  });

  it("요청 바디를 바이트 단위로 그대로 흘린다", async () => {
    const request = new Request("http://web.test/api/anything", {
      method: "POST",
      body: BODY_BYTES,
      headers: { "content-type": "application/json" },
    });

    await POST(request, params(["anything"]));

    const forwarded = new Uint8Array(
      await new Response(seen?.init.body as BodyInit).arrayBuffer(),
    );
    expect([...forwarded]).toEqual([...BODY_BYTES]);
  });

  it("응답 바디를 바이트 단위로 그대로 돌려준다", async () => {
    const res = await GET(new Request("http://web.test/api/anything"), params(["anything"]));
    const received = new Uint8Array(await res.arrayBuffer());
    expect([...received]).toEqual([...BODY_BYTES]);
  });

  it("허용 목록 밖 헤더는 넘기지 않는다", async () => {
    await GET(
      new Request("http://web.test/api/anything", {
        headers: { cookie: "s=1", "x-secret": "nope" },
      }),
      params(["anything"]),
    );
    const headers = seen?.init.headers as Headers;
    expect(headers.get("cookie")).toBe("s=1");
    expect(headers.get("x-secret")).toBeNull();
  });
});
```

```bash
pnpm --filter web exec vitest run tests/proxy.test.ts
```

Expected: PASS — 4 tests.

- [ ] **Step 3: 유지 조건 2개를 CI가 지키게 한다 (스펙 §11)**

스펙 §11은 `apps/web/src/app/api/` **파일 수 검사(=1)를 CI에 넣으라**고 명시한다. Task 13의 일회성
스크립트로만 두면 전환이 끝난 뒤 누군가 도메인 route.ts를 되살려도 아무것도 실패하지 않는다 —
`apps/api` 쪽에서 `check-module-graph.mjs`를 lint에 물린 것과 대칭이 맞아야 한다. 바이트 동일성
테스트는 프록시 파일 자체가 변형될 때만 깨지고 이 회귀는 감지하지 못한다.

`apps/web/tests/proxyOnly.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const API_DIR = path.resolve(__dirname, "../src/app/api");
const DOMAINS = /picks|results|statistics|simulation|generator|lotterietus|identity|draw/i;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe("프록시 유지 조건 (설계 §7.1)", () => {
  const files = walk(API_DIR);

  it("app/api 아래 파일은 [...path]/route.ts 하나뿐이다", () => {
    expect(files.map((f) => path.relative(API_DIR, f))).toEqual([
      path.join("[...path]", "route.ts"),
    ]);
  });

  it("프록시 파일에 도메인 이름이 등장하지 않는다", () => {
    expect(readFileSync(files[0]!, "utf8")).not.toMatch(DOMAINS);
  });
});
```

```bash
pnpm --filter web exec vitest run tests/proxyOnly.test.ts
```

Expected: PASS — 2 tests. (Task 4 시점에는 도메인 `route.ts` 7개가 아직 살아 있으므로 **첫 테스트는
실패한다** — 이것이 정상이다. `it.skip`으로 두고 Task 11에서 마지막 `route.ts`를 지운 직후 `skip`을
떼어 CI 상시 검사로 올린다. Task 13 Step 1의 5·6번 수동 검사는 이 테스트로 대체된다.)

- [ ] **Step 4: 프록시 파일에 도메인 이름이 없는지 확인한다**

```bash
grep -Ein "picks|results|statistics|simulation|generator|lotterietus|identity|draw" \
  "apps/web/src/app/api/[...path]/route.ts" ; echo "exit=$?"
```

Expected: 출력 없음 (`exit=1`).

- [ ] **Step 5: 기존 7개 경로가 여전히 우선하는지 확인한다**

```bash
docker compose up -d
pnpm --filter web build && (cd apps/web && pnpm exec next start) & WEB_PID=$!
sleep 6
curl -s -o /dev/null -w "statistics=%{http_code}\n" http://localhost:3000/api/statistics
kill $WEB_PID
```

Expected: `statistics=200` — Nest는 아직 안 떠 있으므로, 이 200은 구체 `route.ts`가 처리했다는 뜻이다(프록시가 탔다면 연결 실패로 500이 났을 것이다).

- [ ] **Step 6: 커밋**

```bash
git add "apps/web/src/app/api/[...path]" apps/web/tests apps/web/vitest.config.ts
git commit -m "feat(web): apps/api로의 투명 catch-all 프록시 + 바이트 동일성 회귀 테스트"
```

---

## 도메인 이전 태스크(5~11)의 공통 규칙

**매 태스크가 끝나면 그 도메인은 완전히 Nest에서 동작한다.** 절차는 항상 같다:

1. `packages/core`의 코드를 `apps/api/src/modules/<domain>/`의 4계층으로 **복사해 다시 배치한다**(`git mv`가 아니라 `cp` — 원본은 Task 12까지 그대로 남아 계속 컴파일되고, 그것이 롤백 안전망이다).
2. 순수 함수와 그 테스트는 **로직 변경 없이** 복사하고 import 경로만 고친다.
3. `<domain>.module.ts`를 `app.module.ts`에 등록한다.
4. `apps/web/src/app/api/<domain>/route.ts`를 **지운다** → 그 순간부터 catch-all 프록시가 그 경로를 Nest로 넘긴다.
5. `apps/web/src/server/container.ts`에서 그 도메인의 항목을 지운다.
6. `pnpm lint && pnpm test && pnpm build` + 수동 확인.

**롤백:** 문제가 생기면 그 도메인만 Next로 되돌린다 — 다만 **파일 하나가 아니라 두 곳**을 되살려야 한다.
현재 `route.ts`들은 전부 `container`의 항목에 직접 의존하는데(예: `picks/route.ts` → `container.identity`·
`container.listPicks`·`container.savePick`), 위 4~5번이 그 둘을 같은 스텝에서 지우기 때문이다:

1. 지웠던 `apps/web/src/app/api/<domain>/route.ts`
2. `apps/web/src/server/container.ts`의 그 도메인 항목과 해당 `import` 줄

**롤백 유효 기간:** Task 11이 `apps/web/src/server`를 통째로 지우므로 그 이후에는 `server/` 복원까지
필요하고, Task 12가 `packages/core`를 지우면 **롤백이 불가능하다.** 그 시점부터는 Nest 쪽 수정으로만
대응한다 — 이 경계를 넘기 전에 각 도메인이 실제로 동작하는지 확인해 두는 것이 안전망의 전부다.

**다른 모듈의 데이터가 필요할 때 도메인 타입을 빌려오지 않는다.** 모듈 경계를 넘는 타입은 DTO뿐이므로, 소비하는 모듈은 자기 `domain`에 **필요한 최소 형태**를 스스로 선언한다(예: `statistics/domain/model/drawRecord.model.ts`). 구조적 타이핑 덕에 변환 코드 없이 맞물리고, 결합은 0이다.

---

## Task 5: `identity` 이전 — Nest 배관을 여기서 뚫는다

외부 의존이 0이라 DI·토큰·테스트 하네스를 검증하기 가장 좋다. HTTP 엔드포인트가 없고(다른 모듈만 부른다) context도 없다.

**Files:**
- Create: `packages/contract/src/identity/identity.dto.ts`, `index.ts`
- Create: `apps/api/src/modules/identity/identity.module.ts`
- Create: `.../domain/model/user.model.ts`, `.../domain/repository/identity.repository.ts`, `.../domain/index.ts`
- Create: `.../business/getCurrentUser.business.ts`, `.../business/getCurrentUser.business.test.ts`, `.../business/index.ts`
- Create: `.../interface/identity.facade.ts`, `.../interface/index.ts`
- Create: `.../infra/persistence/guestIdentity.adapter.ts`, `.../infra/index.ts`
- Modify: `apps/api/src/app.module.ts`

---

- [ ] **Step 1: 계약에 identity DTO를 추가한다 (스펙 §9.1 신규)**

`packages/contract/src/identity/identity.dto.ts`:

```ts
/** 사용자 신원 응답 DTO — picks·results가 Facade로 받아가는 유일한 타입 */
export interface UserResponse {
  id: string;
  isGuest: boolean;
}
```

`packages/contract/src/identity/index.ts`:

```ts
export * from "./identity.dto";
```

- [ ] **Step 2: domain을 만든다 (Model + 리포지토리 계약)**

`apps/api/src/modules/identity/domain/model/user.model.ts`:

```ts
/**
 * identity 도메인 — MVP는 게스트 단일 사용자.
 * 후속: Supabase Auth 어댑터로 실제 사용자 식별.
 */
export const GUEST_USER_ID = "guest";

export interface User {
  readonly id: string;
  readonly isGuest: boolean;
}
```

`apps/api/src/modules/identity/domain/repository/identity.repository.ts` — **abstract class**여야 Nest DI 토큰이 된다:

```ts
import type { User } from "../model/user.model";

/** 현재 요청의 사용자 식별 계약 — MVP: 게스트 고정 / 후속: Supabase Auth 세션 */
export abstract class IdentityRepository {
  abstract getCurrentUser(): Promise<User>;
  // ⚠️ 인증 도입 시 이 해석은 **요청 스코프**여야 한다. MVP의 GuestIdentityAdapter는 상태가 없어
  // 싱글턴으로 안전하지만, Supabase Auth 어댑터가 같은 싱글턴 자리에 들어가면 동시 요청 사이에
  // 사용자 신원이 섞이고 picks·results가 그 키로 데이터를 스코프하므로 곧 타인의 픽 조회·삭제가 된다.
  // 그때 필요한 변경: 바인딩을 { scope: Scope.REQUEST }로 올리고 어댑터가 @Inject(REQUEST)로
  // 현재 요청을 읽는다. 현재 사용자를 싱글턴 필드에 캐시하지 않는다.
}
```

`apps/api/src/modules/identity/domain/index.ts`:

```ts
export * from "./model/user.model";
export * from "./repository/identity.repository";
```

- [ ] **Step 3: business 테스트를 먼저 쓴다**

`apps/api/src/modules/identity/business/getCurrentUser.business.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { IdentityRepository, type User } from "../domain";
import { GetCurrentUserBusiness } from "./getCurrentUser.business";

class FakeIdentityRepository extends IdentityRepository {
  constructor(private readonly user: User) {
    super();
  }
  async getCurrentUser(): Promise<User> {
    return this.user;
  }
}

describe("GetCurrentUserBusiness", () => {
  it("리포지토리가 준 사용자를 그대로 돌려준다", async () => {
    const business = new GetCurrentUserBusiness(
      new FakeIdentityRepository({ id: "u1", isGuest: false }),
    );
    await expect(business.execute()).resolves.toEqual({ id: "u1", isGuest: false });
  });
});
```

```bash
pnpm --filter @fortuna-lottery/api exec vitest run src/modules/identity/business/getCurrentUser.business.test.ts
```

Expected: FAIL — `Failed to resolve import "./getCurrentUser.business"`.

- [ ] **Step 4: business를 만든다**

`apps/api/src/modules/identity/business/getCurrentUser.business.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { IdentityRepository, type User } from "../domain";

/** 현재 사용자 조회 정책 — 자기 domain 하나로 끝나므로 context가 없다 (§4.1) */
@Injectable()
export class GetCurrentUserBusiness {
  constructor(private readonly repository: IdentityRepository) {}

  execute(): Promise<User> {
    return this.repository.getCurrentUser();
  }
}
```

`apps/api/src/modules/identity/business/index.ts`:

```ts
export * from "./getCurrentUser.business";
```

```bash
pnpm --filter @fortuna-lottery/api exec vitest run src/modules/identity/business/getCurrentUser.business.test.ts
```

Expected: PASS — 1 test.

- [ ] **Step 5: interface(Facade)와 infra 어댑터를 만든다**

`apps/api/src/modules/identity/interface/identity.facade.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type { UserResponse } from "@fortuna-lottery/contract/identity";
import { GetCurrentUserBusiness } from "../business";

/** 모듈 공개 API — picks·results가 부르는 유일한 문. 입출력은 반드시 DTO다 (§5.1) */
@Injectable()
export class IdentityFacade {
  constructor(private readonly getCurrentUser: GetCurrentUserBusiness) {}

  async currentUser(): Promise<UserResponse> {
    const user = await this.getCurrentUser.execute();
    return { id: user.id, isGuest: user.isGuest };
  }
}
```

`apps/api/src/modules/identity/interface/index.ts`:

```ts
export * from "./identity.facade";
```

`apps/api/src/modules/identity/infra/persistence/guestIdentity.adapter.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { GUEST_USER_ID, IdentityRepository, type User } from "../../domain";

/** 게스트 고정 어댑터 (MVP) — Supabase Auth 도입 시 이 파일만 교체된다 */
@Injectable()
export class GuestIdentityAdapter extends IdentityRepository {
  async getCurrentUser(): Promise<User> {
    return { id: GUEST_USER_ID, isGuest: true };
  }
}
```

`apps/api/src/modules/identity/infra/index.ts`:

```ts
export * from "./persistence/guestIdentity.adapter";
```

- [ ] **Step 6: 모듈을 만들고 앱에 등록한다**

`apps/api/src/modules/identity/identity.module.ts` — 계약↔구현체를 묶는 컴포지션 루트(여기만 `infra`를 본다):

```ts
import { Module } from "@nestjs/common";
import { GetCurrentUserBusiness } from "./business";
import { IdentityRepository } from "./domain";
import { GuestIdentityAdapter } from "./infra";
import { IdentityFacade } from "./interface";

@Module({
  providers: [
    { provide: IdentityRepository, useClass: GuestIdentityAdapter },
    GetCurrentUserBusiness,
    IdentityFacade,
  ],
  exports: [IdentityFacade],
})
export class IdentityModule {}
```

`apps/api/src/app.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { IdentityModule } from "./modules/identity/identity.module";
import { PrismaModule } from "./shared/prisma.module";

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), IdentityModule],
})
export class AppModule {}
```

- [ ] **Step 7: Nest DI가 실제로 물리는지 확인한다 (배관 검증)**

`apps/api/src/modules/identity/identity.module.test.ts`:

```ts
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { IdentityModule } from "./identity.module";
import { IdentityFacade } from "./interface";

describe("IdentityModule (DI 배관)", () => {
  it("IdentityRepository 토큰에 GuestIdentityAdapter가 바인딩된다", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [IdentityModule] }).compile();
    const facade = moduleRef.get(IdentityFacade);

    await expect(facade.currentUser()).resolves.toEqual({ id: "guest", isGuest: true });
    await moduleRef.close();
  });
});
```

```bash
pnpm --filter @fortuna-lottery/api test
pnpm --filter @fortuna-lottery/api lint
```

Expected: 테스트 2개 통과, lint 통과(`모듈 그래프 OK — 1개 모듈, 순환 없음`).

- [ ] **Step 8: 커밋**

```bash
git add packages/contract/src/identity apps/api
git commit -m "feat(api): identity 모듈 이전 — 4계층 골격과 Nest DI 배관 검증"
```

---

## Task 6: `lotterietus` 이전 — 첫 컨트롤러 · 첫 context · worker 흡수

**Files:**
- Create: `apps/api/src/modules/lotterietus/**` (아래 목록)
- Modify: `apps/api/src/app.module.ts`
- Delete: `apps/web/src/app/api/lotterietus/route.ts`, `apps/worker/`
- Modify: `apps/web/src/server/container.ts`, `pnpm-workspace.yaml`(불필요 — `apps/*` 글롭)

---

- [ ] **Step 1: domain을 옮긴다 (순수 계산은 로직 변경 없이 이사)**

`apps/api/src/modules/lotterietus/domain/model/draw.model.ts`:

```ts
/** 한 회차 추첨 결과 — 사용자와 완전히 무관한 도메인 데이터 */
export interface Draw {
  readonly round: number;
  /** 당첨 번호 6개 (오름차순) */
  readonly numbers: readonly number[];
  readonly bonus: number;
  /** 추첨 시각 ISO 문자열 */
  readonly drawnAt: string;
}
```

```bash
cd "$(git rev-parse --show-toplevel)"
mkdir -p apps/api/src/modules/lotterietus/domain/{model,repository}
cp packages/core/src/lotterietus/domain/schedule.ts       apps/api/src/modules/lotterietus/domain/schedule.ts
cp packages/core/src/lotterietus/domain/schedule.test.ts  apps/api/src/modules/lotterietus/domain/schedule.test.ts
cp packages/core/src/lotterietus/domain/drawn-at.ts       apps/api/src/modules/lotterietus/domain/drawnAt.ts
cp packages/core/src/lotterietus/domain/drawn-at.test.ts  apps/api/src/modules/lotterietus/domain/drawnAt.test.ts
```

`drawnAt.test.ts`의 import 경로를 고친다: `from "./drawn-at"` → `from "./drawnAt"`.

`apps/api/src/modules/lotterietus/domain/repository/draw.repository.ts`:

```ts
import type { Draw } from "../model/draw.model";

/**
 * 회차 데이터 읽기 계약.
 * 반환 배열은 회차 오름차순을 보장한다 (마지막 원소 = 최신 회차).
 */
export abstract class DrawRepository {
  abstract getAllDraws(): Promise<readonly Draw[]>;
}
```

`apps/api/src/modules/lotterietus/domain/repository/drawWriter.repository.ts`:

```ts
import type { Draw } from "../model/draw.model";

/** 추첨 결과 영속화 계약 — 수집 전용 */
export abstract class DrawWriterRepository {
  /** 저장된 최대 회차. 저장된 것이 없으면 0 */
  abstract getMaxRound(): Promise<number>;
  /** 회차 기준 멱등 저장 — 이미 있는 회차는 갱신한다 */
  abstract upsertDraws(draws: readonly Draw[]): Promise<void>;
}
```

`apps/api/src/modules/lotterietus/domain/index.ts`:

```ts
export * from "./model/draw.model";
export * from "./drawnAt";
export * from "./schedule";
export * from "./repository/draw.repository";
export * from "./repository/drawWriter.repository";
```

- [ ] **Step 2: context와 그 port를 만든다 (외부 재료 = 동행복권 API)**

`apps/api/src/modules/lotterietus/context/port/drawSource.port.ts`:

```ts
import type { Draw } from "../../domain";

/**
 * 원격 추첨 결과 조회 계약 — 수집 전용.
 * 구현체는 지정한 회차 근방의 묶음을 반환한다. 반환 순서는 보장하지 않으며(context가 정렬한다),
 * 요청한 회차가 **아직 존재하지 않으면 빈 배열**을 반환해야 한다 — 이 규약이 수집의 종료 조건이다.
 */
export abstract class DrawSourcePort {
  abstract fetchBatch(centerRound: number): Promise<readonly Draw[]>;
}
```

`apps/api/src/modules/lotterietus/context/port/index.ts`:

```ts
export * from "./drawSource.port";
```

`apps/api/src/modules/lotterietus/context/ingestDraws.context.ts` — 재료 조립만, 정책 판단은 없다:

```ts
import { Injectable } from "@nestjs/common";
import { DrawWriterRepository, type Draw } from "../domain";
import { DrawSourcePort } from "./port";

/** 수집 유즈케이스 전용 재료 조립 — 원격 조회·정렬·저장을 한자리에 모은다 */
@Injectable()
export class IngestDrawsContext {
  constructor(
    private readonly source: DrawSourcePort,
    private readonly writer: DrawWriterRepository,
  ) {}

  currentMaxRound(): Promise<number> {
    return this.writer.getMaxRound();
  }

  /** 원격 창에서 저장분보다 뒤인 회차만 회차 오름차순으로 추린다 */
  async freshAfter(maxRound: number, step: number): Promise<Draw[]> {
    const batch = await this.source.fetchBatch(maxRound + step);
    return batch.filter((draw) => draw.round > maxRound).sort((a, b) => a.round - b.round);
  }

  persist(draws: readonly Draw[]): Promise<void> {
    return this.writer.upsertDraws(draws);
  }
}
```

`apps/api/src/modules/lotterietus/context/index.ts`:

```ts
export * from "./ingestDraws.context";
export * from "./port";
```

- [ ] **Step 3: business 2개를 만들고 기존 테스트를 이식한다**

`apps/api/src/modules/lotterietus/business/getLotterietusStatus.business.ts` — 자기 domain만 쓰므로 **context 없음**(§4.3):

```ts
import { Injectable } from "@nestjs/common";
import { DrawRepository, nextDrawAt, type Draw } from "../domain";

export interface LotterietusStatus {
  latest: Draw | null;
  nextRound: number;
  nextDrawAt: Date;
}

/** 로또 현황 정책 — 최근 회차 + 다음 추첨 정보를 한 번의 조회로 계산한다 */
@Injectable()
export class GetLotterietusStatusBusiness {
  constructor(private readonly draws: DrawRepository) {}

  async execute(now: Date = new Date()): Promise<LotterietusStatus> {
    const draws = await this.draws.getAllDraws();
    const latest = draws[draws.length - 1] ?? null;
    return {
      latest,
      nextRound: (latest?.round ?? 0) + 1,
      nextDrawAt: nextDrawAt(now),
    };
  }
}
```

`apps/api/src/modules/lotterietus/business/ingestDraws.business.ts` — 원본 유스케이스의 알고리즘을 **그대로** 옮긴다(fetch·정렬·저장만 context로 빠졌다):

```ts
import { Injectable } from "@nestjs/common";
import { IngestDrawsContext } from "../context";

export interface IngestDrawsOptions {
  /** 요청 간 대기 — 원격 차단 방지. 테스트에서 주입한다 */
  sleep?: (ms: number) => Promise<void>;
  requestDelayMs?: number;
  logger?: (message: string) => void;
}

export interface IngestDrawsResult {
  /** 사이클 시작 시점의 최대 회차 */
  startRound: number;
  /** 따라잡은 뒤의 최대 회차 */
  latestRound: number;
  /** 이번 사이클에 저장한 회차 수 */
  ingestedCount: number;
  /** 원격 요청 횟수 */
  requestCount: number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * 수집 catch-up 사이클 1회 — 백필과 정기 수집이 같은 경로를 탄다.
 *
 * 저장된 최대 회차부터 원격 최신 회차까지 **빈 구간 없이** 따라잡고 종료한다.
 * 원격은 "요청한 회차가 존재하는가"만 빈 배열 여부로 알려주므로, 크게 점프했다가
 * 빈 응답(또는 저장분과 이어지지 않는 창)을 받으면 폭을 절반으로 줄여 경계를 찾는다.
 */
@Injectable()
export class IngestDrawsBusiness {
  /**
   * 한 번에 앞서가 볼 폭.
   * 원격 창이 [R-5, R+4]이므로 maxRound + 6을 요청하면 창의 아래쪽 끝이 정확히
   * maxRound + 1이 되어, 한 요청당 신규 10회차를 빈틈없이 가져온다.
   */
  private static readonly PROBE_AHEAD = 6;

  constructor(private readonly context: IngestDrawsContext) {}

  async execute(options: IngestDrawsOptions = {}): Promise<IngestDrawsResult> {
    const { sleep = defaultSleep, requestDelayMs = 1000, logger = () => {} } = options;

    const startRound = await this.context.currentMaxRound();
    let maxRound = startRound;
    let step = IngestDrawsBusiness.PROBE_AHEAD;
    let ingestedCount = 0;
    let requestCount = 0;

    for (;;) {
      const fresh = await this.context.freshAfter(maxRound, step);
      requestCount += 1;

      const first = fresh[0];
      const last = fresh[fresh.length - 1];
      const isContiguous =
        first !== undefined &&
        last !== undefined &&
        first.round === maxRound + 1 &&
        last.round - first.round + 1 === fresh.length;

      if (isContiguous) {
        // 저장분과 이어지는 구간만 저장한다 — 창이 앞서가 생긴 구멍을 절대 남기지 않는다
        await this.context.persist(fresh);
        ingestedCount += fresh.length;
        maxRound = last.round;
        step = IngestDrawsBusiness.PROBE_AHEAD;
        logger(`수집: ${first.round}~${last.round}회차 (${fresh.length}개)`);
      } else if (step > 1) {
        // 너무 앞서갔다 (빈 응답이거나 창이 저장분과 이어지지 않음) — 폭을 줄여 재시도
        step = Math.max(1, Math.floor(step / 2));
      } else {
        if (first !== undefined) {
          logger(
            `경고: ${maxRound + 1}회차를 직접 요청했지만 응답이 이어지지 않습니다 (받은 최소 회차 ${first.round}). 이번 사이클을 중단합니다.`,
          );
        }
        break;
      }

      await sleep(requestDelayMs);
    }

    return { startRound, latestRound: maxRound, ingestedCount, requestCount };
  }
}
```

`apps/api/src/modules/lotterietus/business/index.ts`:

```ts
export * from "./getLotterietusStatus.business";
export * from "./ingestDraws.business";
```

기존 테스트 2개를 이식한다(원본은 core에 그대로 둔다):

```bash
mkdir -p apps/api/src/modules/lotterietus/business
cp packages/core/src/lotterietus/application/usecases/get-lotterietus-status.test.ts \
   apps/api/src/modules/lotterietus/business/getLotterietusStatus.business.test.ts
cp packages/core/src/lotterietus/application/usecases/ingest-draws.test.ts \
   apps/api/src/modules/lotterietus/business/ingestDraws.business.test.ts
```

`getLotterietusStatus.business.test.ts` — 상단 import와 조립부를 아래로 바꾼다(검증 기대값은 그대로 두되, 반환이 DTO가 아니라 도메인 상태이므로 `latest`를 통해 확인한다):

```ts
import { describe, expect, it, vi } from "vitest";
import { DrawRepository, type Draw } from "../domain";
import { GetLotterietusStatusBusiness } from "./getLotterietusStatus.business";

class FakeDrawRepository extends DrawRepository {
  constructor(private readonly draws: readonly Draw[]) {
    super();
  }
  async getAllDraws(): Promise<readonly Draw[]> {
    return this.draws;
  }
}

describe("GetLotterietusStatusBusiness", () => {
  it("한 번의 조회로 최근 회차 + 다음 추첨 정보를 함께 계산한다", async () => {
    const draws: Draw[] = [
      { round: 10, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2026-06-27T11:35:00.000Z" },
      {
        round: 11,
        numbers: [10, 20, 30, 40, 41, 42],
        bonus: 43,
        drawnAt: "2026-07-04T11:35:00.000Z",
      },
    ];
    const repository = new FakeDrawRepository(draws);
    const spy = vi.spyOn(repository, "getAllDraws");
    const business = new GetLotterietusStatusBusiness(repository);

    const status = await business.execute(new Date("2026-07-01T00:00:00.000Z"));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(status.latest?.round).toBe(11);
    expect(status.nextRound).toBe(12);
    expect(status.nextDrawAt.toISOString()).toBe("2026-07-04T11:35:00.000Z");
  });

  it("저장된 회차가 없으면 latest는 null이고 다음 회차는 1이다", async () => {
    const business = new GetLotterietusStatusBusiness(new FakeDrawRepository([]));
    const status = await business.execute(new Date("2026-07-01T00:00:00.000Z"));
    expect(status.latest).toBeNull();
    expect(status.nextRound).toBe(1);
  });
});
```

`ingestDraws.business.test.ts` — 기존 파일의 **fake source 로직과 시나리오 검증은 그대로 두고**, 조립부만 바꾼다. 파일 상단 import와 `makeIngestDraws(...)` 호출부를 아래 형태로 교체한다:

```ts
import { describe, expect, it, vi } from "vitest";
import { DrawWriterRepository, type Draw } from "../domain";
import { IngestDrawsContext, DrawSourcePort } from "../context";
import { IngestDrawsBusiness } from "./ingestDraws.business";

/** 인메모리 writer — 기존 테스트의 fakeWriter를 계약 구현체로 바꾼 것 */
class FakeDrawWriter extends DrawWriterRepository {
  readonly stored = new Map<number, Draw>();
  async getMaxRound(): Promise<number> {
    return this.stored.size === 0 ? 0 : Math.max(...this.stored.keys());
  }
  async upsertDraws(draws: readonly Draw[]): Promise<void> {
    for (const draw of draws) this.stored.set(draw.round, draw);
  }
}

/** 기존 파일의 fakeSource 본문을 그대로 옮겨 담는다 */
class FakeDrawSource extends DrawSourcePort {
  readonly calls: number[] = [];
  constructor(private readonly latest: number) {
    super();
  }
  async fetchBatch(centerRound: number): Promise<readonly Draw[]> {
    this.calls.push(centerRound);
    if (centerRound > this.latest || centerRound < 1) return [];
    const end = Math.min(centerRound + 4, this.latest);
    const start = Math.max(1, end - 9);
    const rounds: number[] = [];
    for (let r = end; r >= start; r -= 1) rounds.push(r);
    return rounds.map((round) => ({
      round,
      numbers: [1, 2, 3, 4, 5, 6],
      bonus: 7,
      drawnAt: "2026-08-01T11:35:00.000Z",
    }));
  }
}

const setup = (latest: number) => {
  const source = new FakeDrawSource(latest);
  const writer = new FakeDrawWriter();
  const business = new IngestDrawsBusiness(new IngestDrawsContext(source, writer));
  const run = () => business.execute({ sleep: async () => {}, requestDelayMs: 0 });
  return { source, writer, run };
};

describe("IngestDrawsBusiness (수집 catch-up)", () => {
  it("빈 저장소를 최신 회차까지 빈틈없이 채운다", async () => {
    const { writer, run } = setup(23);
    const result = await run();
    expect(result.latestRound).toBe(23);
    expect(result.ingestedCount).toBe(23);
    expect([...writer.stored.keys()].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 23 }, (_, i) => i + 1),
    );
  });

  it("이미 최신이면 아무것도 저장하지 않는다", async () => {
    const { writer, run } = setup(23);
    await run();
    const second = await run();
    expect(second.ingestedCount).toBe(0);
    expect(second.startRound).toBe(23);
    expect(writer.stored.size).toBe(23);
  });

  it("멱등 — 두 번 돌려도 회차가 중복 생성되지 않는다", async () => {
    const { writer, run } = setup(15);
    await run();
    await run();
    expect(writer.stored.size).toBe(15);
  });

  it("원격 요청 사이에 대기를 넣는다", async () => {
    const source = new FakeDrawSource(12);
    const writer = new FakeDrawWriter();
    const sleep = vi.fn(async () => {});
    const business = new IngestDrawsBusiness(new IngestDrawsContext(source, writer));
    await business.execute({ sleep, requestDelayMs: 1000 });
    expect(sleep).toHaveBeenCalledWith(1000);
  });
});
```

- [ ] **Step 4: infra 어댑터 4개를 옮긴다**

`apps/api/src/modules/lotterietus/infra/persistence/prismaDraw.repository.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { DrawRepository, drawnAtFromDate, type Draw } from "../../domain";
import { PrismaService } from "../../../../shared/prisma.service";

/** draws 테이블 읽기 어댑터 — 계약대로 회차 오름차순으로 반환한다 */
@Injectable()
export class PrismaDrawRepository extends DrawRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getAllDraws(): Promise<readonly Draw[]> {
    const rows = await this.prisma.draw.findMany({ orderBy: { round: "asc" } });
    return rows.map(
      (row): Draw => ({
        round: row.round,
        numbers: Object.freeze([row.n1, row.n2, row.n3, row.n4, row.n5, row.n6]),
        bonus: row.bonus,
        drawnAt: drawnAtFromDate(row.drawnAt),
      }),
    );
  }
}
```

`apps/api/src/modules/lotterietus/infra/persistence/prismaDrawWriter.repository.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { DrawWriterRepository, type Draw } from "../../domain";
import { PrismaService } from "../../../../shared/prisma.service";

function toRow(draw: Draw) {
  const [n1, n2, n3, n4, n5, n6] = draw.numbers;
  if (
    n1 === undefined ||
    n2 === undefined ||
    n3 === undefined ||
    n4 === undefined ||
    n5 === undefined ||
    n6 === undefined
  ) {
    throw new Error(`회차 ${draw.round}의 번호가 6개가 아닙니다: ${draw.numbers.length}개`);
  }
  return {
    round: draw.round,
    n1,
    n2,
    n3,
    n4,
    n5,
    n6,
    bonus: draw.bonus,
    // @db.Date 컬럼이라 날짜만 저장된다 — 읽을 때 drawnAtFromDate가 추첨 시각을 복원한다
    drawnAt: new Date(draw.drawnAt),
  };
}

/** draws 테이블 쓰기 어댑터 — 회차 PK 기준 멱등(upsert) */
@Injectable()
export class PrismaDrawWriterRepository extends DrawWriterRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getMaxRound(): Promise<number> {
    const { _max } = await this.prisma.draw.aggregate({ _max: { round: true } });
    return _max.round ?? 0;
  }

  async upsertDraws(draws: readonly Draw[]): Promise<void> {
    if (draws.length === 0) return;
    const rows = draws.map(toRow);
    await this.prisma.$transaction(
      rows.map((row) =>
        this.prisma.draw.upsert({ where: { round: row.round }, create: row, update: row }),
      ),
    );
  }
}
```

`apps/api/src/modules/lotterietus/infra/gateway/dhlotteryDrawSource.adapter.ts` — 기존 `dhlottery-draw-source.adapter.ts`의 본문을 그대로 옮기고 클래스로 감싼다:

```bash
mkdir -p apps/api/src/modules/lotterietus/infra/{gateway,persistence}
cp packages/core/src/lotterietus/infrastructure/adapters/dhlottery-draw-source.adapter.ts \
   apps/api/src/modules/lotterietus/infra/gateway/dhlotteryDrawSource.adapter.ts
```

그 파일의 상단 import와 마지막 export를 아래로 바꾼다(`ENDPOINT`·`USER_AGENT`·`DhlotteryRow`·`toDraw`는 그대로 둔다):

```ts
import { Injectable } from "@nestjs/common";
import { DrawSourcePort } from "../../context";
import { drawnAtFromYmd, type Draw } from "../../domain";
import { createCombination, LOTTO_MAX, LOTTO_MIN } from "../../../../shared";
```

```ts
/**
 * 동행복권 비공식 엔드포인트 어댑터.
 *
 * 요청 회차 R 기준 [R-5, R+4] 창을 내림차순으로 돌려주며, 양 끝에서는 창을 밀어 항상 10개를
 * 채운다. R이 아직 없는 회차면 빈 목록을 준다 (수집의 종료 조건).
 * 공식 API가 아니므로 호출 간격(requestDelayMs)을 반드시 둔다.
 */
@Injectable()
export class DhlotteryDrawSourceAdapter extends DrawSourcePort {
  private static readonly TIMEOUT_MS = 10_000;

  async fetchBatch(centerRound: number): Promise<readonly Draw[]> {
    const response = await fetch(`${ENDPOINT}?srchDir=center&srchLtEpsd=${centerRound}`, {
      headers: {
        Referer: RESULT_PAGE,
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(DhlotteryDrawSourceAdapter.TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`동행복권 응답 실패 (${centerRound}회차 요청): HTTP ${response.status}`);
    }

    const payload = (await response.json()) as DhlotteryResponse;
    const list = payload.data?.list;
    return Array.isArray(list) ? list.map(toDraw) : [];
  }
}
```

더미 어댑터도 테스트·시드용으로 옮긴다:

```bash
cp packages/core/src/lotterietus/infrastructure/adapters/dummy-draw-data.adapter.ts \
   apps/api/src/modules/lotterietus/infra/persistence/dummyDraw.repository.ts
cp packages/core/src/lotterietus/infrastructure/adapters/dummy-draw-data.adapter.test.ts \
   apps/api/src/modules/lotterietus/infra/persistence/dummyDraw.repository.test.ts
```

옮긴 `dummyDraw.repository.ts`의 상단 import와 팩토리 선언을 바꾼다:

```ts
import { LOTTO_MAX, LOTTO_PICK_COUNT, mulberry32 } from "../../../../shared";
import { DrawRepository, type Draw } from "../../domain";
```

```ts
/**
 * 더미 회차 데이터 — 시드 고정 결정적 생성. 테스트·시드 전용이며 모듈에 등록하지 않는다.
 * DrawRepository 계약 뒤에 있으므로 실어댑터와 자리를 맞바꿔도 business·context는 무수정이다.
 */
export class DummyDrawRepository extends DrawRepository {
  private cache: readonly Draw[] | null = null;

  constructor(private readonly options: DummyDrawDataOptions = {}) {
    super();
  }

  async getAllDraws(): Promise<readonly Draw[]> {
    this.cache ??= this.generate();
    return this.cache;
  }

  private generate(): readonly Draw[] {
    const { rounds = 1182, seed = 20021207 } = this.options;
    /* 기존 generate() 본문을 그대로 둔다 */
  }
}
```

`dummyDraw.repository.test.ts`의 `createDummyDrawDataAdapter({ rounds: N })` 호출을 `new DummyDrawRepository({ rounds: N })`로 바꾼다(검증 내용은 그대로).

`apps/api/src/modules/lotterietus/infra/index.ts`:

```ts
export * from "./persistence/prismaDraw.repository";
export * from "./persistence/prismaDrawWriter.repository";
export * from "./persistence/dummyDraw.repository";
export * from "./gateway/dhlotteryDrawSource.adapter";
```

- [ ] **Step 5: interface — Facade · Controller · Scheduler**

`apps/api/src/modules/lotterietus/interface/lotterietus.facade.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type {
  DrawResponse,
  LotterietusStatusResponse,
} from "@fortuna-lottery/contract/lotterietus";
import { GetLotterietusStatusBusiness } from "../business";
import { DrawRepository } from "../domain";

/** 모듈 공개 API — statistics·simulation·results가 회차 데이터를 받아가는 유일한 문 */
@Injectable()
export class LotterietusFacade {
  constructor(
    private readonly getStatus: GetLotterietusStatusBusiness,
    private readonly draws: DrawRepository,
  ) {}

  async status(): Promise<LotterietusStatusResponse> {
    const { latest, nextRound, nextDrawAt } = await this.getStatus.execute();
    return {
      round: latest?.round ?? 0,
      numbers: latest ? [...latest.numbers] : [],
      bonus: latest?.bonus ?? 0,
      drawnAt: latest?.drawnAt ?? "",
      nextRound,
      nextDrawAt: nextDrawAt.toISOString(),
    };
  }

  /** 회차 오름차순 전체 목록 — 경계를 넘으므로 DTO로 나간다 (§5.1) */
  async listAllDraws(): Promise<DrawResponse[]> {
    const draws = await this.draws.getAllDraws();
    return draws.map((draw) => ({
      round: draw.round,
      numbers: [...draw.numbers],
      bonus: draw.bonus,
      drawnAt: draw.drawnAt,
    }));
  }
}
```

`apps/api/src/modules/lotterietus/interface/lotterietus.controller.ts`:

```ts
import { Controller, Get } from "@nestjs/common";
import type { LotterietusStatusResponse } from "@fortuna-lottery/contract/lotterietus";
import { LotterietusFacade } from "./lotterietus.facade";

@Controller("lotterietus")
export class LotterietusController {
  constructor(private readonly facade: LotterietusFacade) {}

  @Get()
  status(): Promise<LotterietusStatusResponse> {
    return this.facade.status();
  }
}
```

`apps/api/src/modules/lotterietus/interface/lotterietus.scheduler.ts` — `apps/worker`를 흡수한다:

```ts
import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { IngestDrawsBusiness } from "../business";

/**
 * 수집 스케줄러 — 구 apps/worker의 역할.
 * 단일 인스턴스 전제다. 스케일아웃 시에는 DB 어드바이저리 락이 선결 조건이다.
 */
@Injectable()
export class LotterietusScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(LotterietusScheduler.name);

  constructor(private readonly ingest: IngestDrawsBusiness) {}

  /** 부팅 직후 1회 — 백필과 정기 수집이 같은 경로를 탄다 */
  onApplicationBootstrap(): void {
    void this.run();
  }

  /** 매주 토요일 12:00 UTC (= 21:00 KST) — 추첨(20:35 KST) 이후 결과가 올라올 여유를 둔다 */
  @Cron("0 0 12 * * 6", { timeZone: "UTC" })
  async weekly(): Promise<void> {
    await this.run();
  }

  private async run(): Promise<void> {
    try {
      const result = await this.ingest.execute({ logger: (m) => this.logger.log(m) });
      this.logger.log(
        `사이클 완료 — ${result.startRound} → ${result.latestRound}회차, ` +
          `${result.ingestedCount}개 저장, 원격 요청 ${result.requestCount}회`,
      );
    } catch (error) {
      this.logger.error(`사이클 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
```

`apps/api/src/modules/lotterietus/interface/index.ts`:

```ts
export * from "./lotterietus.facade";
export * from "./lotterietus.controller";
export * from "./lotterietus.scheduler";
```

- [ ] **Step 6: 모듈을 만들고 등록한다**

`apps/api/src/modules/lotterietus/lotterietus.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { GetLotterietusStatusBusiness, IngestDrawsBusiness } from "./business";
import { DrawSourcePort, IngestDrawsContext } from "./context";
import { DrawRepository, DrawWriterRepository } from "./domain";
import {
  DhlotteryDrawSourceAdapter,
  PrismaDrawRepository,
  PrismaDrawWriterRepository,
} from "./infra";
import { LotterietusController, LotterietusFacade, LotterietusScheduler } from "./interface";

@Module({
  controllers: [LotterietusController],
  providers: [
    { provide: DrawRepository, useClass: PrismaDrawRepository },
    { provide: DrawWriterRepository, useClass: PrismaDrawWriterRepository },
    { provide: DrawSourcePort, useClass: DhlotteryDrawSourceAdapter },
    IngestDrawsContext,
    GetLotterietusStatusBusiness,
    IngestDrawsBusiness,
    LotterietusFacade,
    LotterietusScheduler,
  ],
  exports: [LotterietusFacade],
})
export class LotterietusModule {}
```

`apps/api/src/app.module.ts`의 `imports`에 `LotterietusModule`을 추가한다:

```ts
  imports: [PrismaModule, ScheduleModule.forRoot(), IdentityModule, LotterietusModule],
```

- [ ] **Step 7: 컨트롤러 스모크 테스트**

`apps/api/src/modules/lotterietus/interface/lotterietus.controller.test.ts`:

```ts
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { GetLotterietusStatusBusiness } from "../business";
import { DrawRepository, type Draw } from "../domain";
import { LotterietusController } from "./lotterietus.controller";
import { LotterietusFacade } from "./lotterietus.facade";

class FixedDrawRepository extends DrawRepository {
  async getAllDraws(): Promise<readonly Draw[]> {
    return [
      { round: 11, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2026-07-04T11:35:00.000Z" },
    ];
  }
}

describe("LotterietusController (스모크)", () => {
  it("GET /lotterietus 가 상태 DTO를 준다", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LotterietusController],
      providers: [
        { provide: DrawRepository, useClass: FixedDrawRepository },
        GetLotterietusStatusBusiness,
        LotterietusFacade,
      ],
    }).compile();

    const status = await moduleRef.get(LotterietusController).status();

    expect(status.round).toBe(11);
    expect(status.nextRound).toBe(12);
    expect(typeof status.nextDrawAt).toBe("string");
    await moduleRef.close();
  });
});
```

- [ ] **Step 8: Next 쪽 경로를 지우고 worker를 삭제한다**

```bash
cd "$(git rev-parse --show-toplevel)"
rm apps/web/src/app/api/lotterietus/route.ts
rmdir apps/web/src/app/api/lotterietus
git rm -r --quiet apps/worker
```

`apps/web/src/server/container.ts`에서 `getLotterietusStatus`와 그 import를 지운다. `drawData`는 statistics·simulation·results가 아직 쓰므로 **남긴다.**

```ts
import { createPrismaClient, createPrismaDrawDataAdapter } from "@fortuna-lottery/core/lotterietus/infrastructure";
```

```ts
  return {
    identity,
    getStatistics: makeGetStatistics(drawData),
    generateCombination: makeGenerateCombination(Math.random),
    backtestCombination: makeBacktestCombination(drawData),
    savePick: makeSavePick({ repository: pickRepository }),
    listPicks: makeListPicks(pickRepository),
    deletePick: makeDeletePick(pickRepository),
    checkResults: makeCheckResults(pickRepository, drawData),
  };
```

- [ ] **Step 9: 컷오버 확인**

```bash
docker compose up -d
pnpm --filter @fortuna-lottery/api build
(cd apps/api && node --env-file=.env dist/main.js) & API_PID=$!
sleep 6
curl -s http://localhost:4000/lotterietus | head -c 200 ; echo
pnpm --filter web build && (cd apps/web && pnpm exec next start) & WEB_PID=$!
sleep 6
curl -s http://localhost:3000/api/lotterietus | head -c 200 ; echo
kill $WEB_PID $API_PID
```

Expected: 두 응답이 같은 JSON(`round`·`numbers`·`bonus`·`drawnAt`·`nextRound`·`nextDrawAt`)이다 — 프록시가 Nest로 넘긴 것이다.

- [ ] **Step 10: 검증과 커밋**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: 전부 통과.

```bash
git add -A
git commit -m "feat(api): lotterietus 모듈 이전 — 컨트롤러·context·스케줄러(worker 흡수)"
```

---

## Task 7: `generator` 이전 — 가장 단순 (context·infra 없음)

**Files:**
- Create: `apps/api/src/modules/generator/**`
- Modify: `apps/api/src/app.module.ts`
- Delete: `apps/web/src/app/api/generator/route.ts`
- Modify: `apps/web/src/server/container.ts`

---

- [ ] **Step 1: 순수 계산과 테스트를 이사한다 (로직 무변경)**

```bash
cd "$(git rev-parse --show-toplevel)"
mkdir -p apps/api/src/modules/generator/{domain,business,interface}
cp packages/core/src/generator/domain/generate.ts       apps/api/src/modules/generator/domain/generate.ts
cp packages/core/src/generator/domain/generate.test.ts  apps/api/src/modules/generator/domain/generate.test.ts
```

`generate.ts`의 상단 import를 순수 커널 배럴로 바꾼다:

```ts
import {
  createCombination,
  err,
  LOTTO_MAX,
  LOTTO_MIN,
  LOTTO_PICK_COUNT,
  type Combination,
  type RandomPort,
  type Result,
} from "../../../shared";
```

`generate.test.ts`의 상단 import:

```ts
import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../../shared";
import { generate } from "./generate";
```

`apps/api/src/modules/generator/domain/index.ts`:

```ts
export * from "./generate";
```

- [ ] **Step 2: business를 만든다 (context 없음 — 외부 재료가 0이다)**

`apps/api/src/modules/generator/business/generateCombination.business.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type { GenerateRequest } from "@fortuna-lottery/contract/generator";
import { ok, type RandomPort, type Result } from "../../../shared";
import { generate } from "../domain";

/**
 * 조합 생성 정책 — 자기 domain 순수 계산 하나로 끝나므로 context가 없다 (§4.1).
 * 난수는 인자로 주입 가능하게 두어 테스트가 결정적으로 돌 수 있게 한다.
 */
@Injectable()
export class GenerateCombinationBusiness {
  execute(request: GenerateRequest, random: RandomPort = Math.random): Result<number[]> {
    const result = generate(random, request.fixedNumbers ?? [], request.excludedNumbers ?? []);
    if (!result.ok) return result;
    return ok([...result.value]);
  }
}
```

`apps/api/src/modules/generator/business/index.ts`:

```ts
export * from "./generateCombination.business";
```

- [ ] **Step 3: interface(Facade + Controller)를 만든다**

`apps/api/src/modules/generator/interface/generator.facade.ts`:

```ts
import { BadRequestException, Injectable } from "@nestjs/common";
import type { GenerateRequest, GenerateResponse } from "@fortuna-lottery/contract/generator";
import { GenerateCombinationBusiness } from "../business";

@Injectable()
export class GeneratorFacade {
  constructor(private readonly generate: GenerateCombinationBusiness) {}

  generateCombination(request: GenerateRequest): GenerateResponse {
    const result = this.generate.execute(request);
    if (!result.ok) throw new BadRequestException(result.error);
    return { numbers: result.value };
  }
}
```

`apps/api/src/modules/generator/interface/generator.controller.ts`:

```ts
import { Body, Controller, Post } from "@nestjs/common";
import type { GenerateRequest, GenerateResponse } from "@fortuna-lottery/contract/generator";
import { GeneratorFacade } from "./generator.facade";

@Controller("generator")
export class GeneratorController {
  constructor(private readonly facade: GeneratorFacade) {}

  @Post()
  generate(@Body() body: GenerateRequest): GenerateResponse {
    return this.facade.generateCombination(body ?? {});
  }
}
```

`apps/api/src/modules/generator/interface/index.ts`:

```ts
export * from "./generator.facade";
export * from "./generator.controller";
```

- [ ] **Step 4: 모듈과 스모크 테스트**

`apps/api/src/modules/generator/generator.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { GenerateCombinationBusiness } from "./business";
import { GeneratorController, GeneratorFacade } from "./interface";

@Module({
  controllers: [GeneratorController],
  providers: [GenerateCombinationBusiness, GeneratorFacade],
  exports: [GeneratorFacade],
})
export class GeneratorModule {}
```

`apps/api/src/app.module.ts`의 `imports`에 `GeneratorModule` 추가.

`apps/api/src/modules/generator/interface/generator.controller.test.ts`:

```ts
import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { GeneratorModule } from "../generator.module";
import { GeneratorController } from "./generator.controller";

describe("GeneratorController (스모크)", () => {
  it("POST /generator 가 6개 조합을 준다", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [GeneratorModule] }).compile();
    const response = moduleRef.get(GeneratorController).generate({});

    expect(response.numbers).toHaveLength(6);
    expect(new Set(response.numbers).size).toBe(6);
    await moduleRef.close();
  });

  it("고정 번호가 잘못되면 400을 던진다", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [GeneratorModule] }).compile();
    expect(() => moduleRef.get(GeneratorController).generate({ fixedNumbers: [1, 1] })).toThrow(
      BadRequestException,
    );
    await moduleRef.close();
  });
});
```

- [ ] **Step 5: 컷오버 + 검증 + 커밋**

```bash
cd "$(git rev-parse --show-toplevel)"
rm apps/web/src/app/api/generator/route.ts
rmdir apps/web/src/app/api/generator
```

`apps/web/src/server/container.ts`에서 `generateCombination` 줄과 그 import를 지운다.

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: 전부 통과.

```bash
git add -A
git commit -m "feat(api): generator 모듈 이전 — 순수 계산 도메인, context·infra 없음"
```

---

## Task 8: `picks` 이전 — 첫 모듈 간 gateway

**Facade 표면 2가지:**
- `listForCurrentUser()` — 자기 컨트롤러용. context가 identity로 현재 사용자를 푼다.
- `listByUser(userKey)` — 다른 모듈(results)용. 스펙 §5.1의 시그니처 그대로.

`business`는 항상 **명시적 userKey**를 받는 순수 정책으로 두고, 현재 사용자 해석은 `interface`가 `context`에 묻는다(§3.1은 `interface → context`를 허용한다).

**Files:**
- Create: `apps/api/src/modules/picks/**`
- Modify: `apps/api/src/app.module.ts`
- Delete: `apps/web/src/app/api/picks/route.ts`, `apps/web/src/app/api/picks/[id]/route.ts`
- Modify: `apps/web/src/server/container.ts`

---

- [ ] **Step 1: domain — Model · VO · 리포지토리 계약**

`apps/api/src/modules/picks/domain/model/pick.model.ts` (**`Entity` 용어 폐기** — §8):

```ts
/**
 * 저장된 픽 — picks 테이블과 1:1 (도메인 단일 책임 규칙).
 * 사용자 정보는 userId 키로만 연결한다. users 테이블에 픽 정보를 두지 않는다.
 */
export interface Pick {
  readonly id: string;
  readonly userId: string;
  readonly numbers: readonly number[];
  readonly createdAt: string;
}
```

`apps/api/src/modules/picks/domain/model/combination.vo.ts`:

```ts
import { createCombination, err, ok, type Combination, type Result } from "../../../../shared";

/**
 * 픽 전용 값 객체 — 사용자 키 + 검증된 조합.
 * 조합 자체의 검증(6개·1~45·중복 없음)은 4개 모듈이 공유하므로 shared/combination이 소유한다.
 */
export interface PickCombinationVO {
  readonly userId: string;
  readonly combination: Combination;
}

export function createPickCombinationVO(
  userId: string,
  numbers: readonly number[],
): Result<PickCombinationVO> {
  if (!userId) return err("사용자 식별자가 없습니다");
  const combination = createCombination(numbers);
  if (!combination.ok) return combination;
  return ok({ userId, combination: combination.value });
}
```

`apps/api/src/modules/picks/domain/repository/pick.repository.ts`:

```ts
import type { Pick } from "../model/pick.model";

/** 픽 저장소 계약 — MVP: InMemory / 후속: Supabase(Postgres) 어댑터로 교체 */
export abstract class PickRepository {
  abstract save(pick: Pick): Promise<void>;
  abstract findAllByUser(userId: string): Promise<Pick[]>;
  /** 삭제 성공 여부 반환 (소유자 불일치·미존재 시 false) */
  abstract deleteById(userId: string, pickId: string): Promise<boolean>;
}
```

`apps/api/src/modules/picks/domain/index.ts`:

```ts
export * from "./model/pick.model";
export * from "./model/combination.vo";
export * from "./repository/pick.repository";
```

- [ ] **Step 2: context 3개와 identity port**

`apps/api/src/modules/picks/context/port/identityProvider.port.ts`:

```ts
import type { UserResponse } from "@fortuna-lottery/contract/identity";

/** picks가 외부(identity 모듈)에 대해 선언하는 자기 계약 */
export abstract class IdentityProvider {
  abstract currentUser(): Promise<UserResponse>;
}
```

`apps/api/src/modules/picks/context/port/index.ts`:

```ts
export * from "./identityProvider.port";
```

세 유즈케이스가 각자 자기 context를 갖는다(§4.1 — 유즈케이스 1개 : context 최대 1개). 지금은 셋 다 "현재 사용자 키"만 필요하지만, 인증/등급이 붙으면 서로 다른 재료를 갖게 되므로 합치지 않는다.

`apps/api/src/modules/picks/context/listPicks.context.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { IdentityProvider } from "./port";

@Injectable()
export class ListPicksContext {
  constructor(private readonly identity: IdentityProvider) {}

  async currentUserKey(): Promise<string> {
    return (await this.identity.currentUser()).id;
  }
}
```

`apps/api/src/modules/picks/context/savePick.context.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { IdentityProvider } from "./port";

@Injectable()
export class SavePickContext {
  constructor(private readonly identity: IdentityProvider) {}

  async currentUserKey(): Promise<string> {
    return (await this.identity.currentUser()).id;
  }
}
```

`apps/api/src/modules/picks/context/deletePick.context.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { IdentityProvider } from "./port";

@Injectable()
export class DeletePickContext {
  constructor(private readonly identity: IdentityProvider) {}

  async currentUserKey(): Promise<string> {
    return (await this.identity.currentUser()).id;
  }
}
```

`apps/api/src/modules/picks/context/index.ts`:

```ts
export * from "./listPicks.context";
export * from "./savePick.context";
export * from "./deletePick.context";
export * from "./port";
```

- [ ] **Step 3: business 3개**

`apps/api/src/modules/picks/business/listPicks.business.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { PickRepository, type Pick } from "../domain";

/** 픽 목록 정책 — 최신 저장순 */
@Injectable()
export class ListPicksBusiness {
  constructor(private readonly repository: PickRepository) {}

  async execute(userKey: string): Promise<Pick[]> {
    const picks = await this.repository.findAllByUser(userKey);
    return picks.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
```

`apps/api/src/modules/picks/business/savePick.business.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { ok, type Result } from "../../../shared";
import { createPickCombinationVO, PickRepository, type Pick } from "../domain";

export interface SavePickOptions {
  idGenerator?: () => string;
  clock?: () => Date;
}

/** 런타임 의존성 없는 시각+난수 조합 (충돌 확률 무시 가능한 MVP 수준) */
const defaultIdGenerator = () =>
  `pick_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

/** 픽 저장 정책 — VO 검증 → Model 저장 */
@Injectable()
export class SavePickBusiness {
  constructor(private readonly repository: PickRepository) {}

  async execute(
    userKey: string,
    numbers: readonly number[],
    options: SavePickOptions = {},
  ): Promise<Result<Pick>> {
    const { idGenerator = defaultIdGenerator, clock = () => new Date() } = options;

    const vo = createPickCombinationVO(userKey, numbers);
    if (!vo.ok) return vo;

    const pick: Pick = {
      id: idGenerator(),
      userId: vo.value.userId,
      numbers: vo.value.combination,
      createdAt: clock().toISOString(),
    };
    await this.repository.save(pick);
    return ok(pick);
  }
}
```

`apps/api/src/modules/picks/business/deletePick.business.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { err, ok, type Result } from "../../../shared";
import { PickRepository } from "../domain";

/** 픽 삭제 정책 — 소유자 검증 포함 */
@Injectable()
export class DeletePickBusiness {
  constructor(private readonly repository: PickRepository) {}

  async execute(userKey: string, pickId: string): Promise<Result<true>> {
    const deleted = await this.repository.deleteById(userKey, pickId);
    if (!deleted) return err("삭제할 픽을 찾을 수 없습니다");
    return ok(true);
  }
}
```

`apps/api/src/modules/picks/business/index.ts`:

```ts
export * from "./listPicks.business";
export * from "./savePick.business";
export * from "./deletePick.business";
```

- [ ] **Step 4: infra — 인메모리 저장소 + identity gateway**

`apps/api/src/modules/picks/infra/persistence/inMemoryPick.repository.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { PickRepository, type Pick } from "../../domain";

/**
 * 인메모리 픽 저장소 — MVP 전용 (프로세스 재시작 시 휘발).
 * PickRepository 계약 뒤에 있으므로 Supabase 어댑터 교체 시 business·context 무수정.
 */
@Injectable()
export class InMemoryPickRepository extends PickRepository {
  private readonly store = new Map<string, Pick>();

  async save(pick: Pick): Promise<void> {
    this.store.set(pick.id, pick);
  }

  async findAllByUser(userId: string): Promise<Pick[]> {
    return [...this.store.values()].filter((pick) => pick.userId === userId);
  }

  async deleteById(userId: string, pickId: string): Promise<boolean> {
    const existing = this.store.get(pickId);
    if (!existing || existing.userId !== userId) return false;
    return this.store.delete(pickId);
  }
}
```

`apps/api/src/modules/picks/infra/gateway/identityFacade.adapter.ts` — **identity 모듈을 아는 유일한 파일**:

```ts
import { Injectable } from "@nestjs/common";
import type { UserResponse } from "@fortuna-lottery/contract/identity";
import { IdentityProvider } from "../../context";
import { IdentityFacade } from "../../../identity/interface";

/** 분리 시 이 파일만 HTTP 어댑터로 바뀐다 — context·business·domain은 무수정 (§5.2) */
@Injectable()
export class IdentityFacadeAdapter extends IdentityProvider {
  constructor(private readonly identity: IdentityFacade) {
    super();
  }

  currentUser(): Promise<UserResponse> {
    return this.identity.currentUser();
  }
}
```

`apps/api/src/modules/picks/infra/index.ts`:

```ts
export * from "./persistence/inMemoryPick.repository";
export * from "./gateway/identityFacade.adapter";
```

- [ ] **Step 5: interface — Facade + Controller**

`apps/api/src/modules/picks/interface/picks.facade.ts`:

```ts
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { PickResponse, SavePickRequest } from "@fortuna-lottery/contract/picks";
import { DeletePickBusiness, ListPicksBusiness, SavePickBusiness } from "../business";
import { DeletePickContext, ListPicksContext, SavePickContext } from "../context";
import type { Pick } from "../domain";

const toResponse = (pick: Pick): PickResponse => ({
  id: pick.id,
  numbers: [...pick.numbers],
  createdAt: pick.createdAt,
});

/** 모듈 공개 API — 입출력은 반드시 DTO다 (§5.1) */
@Injectable()
export class PicksFacade {
  constructor(
    private readonly listPicks: ListPicksBusiness,
    private readonly savePick: SavePickBusiness,
    private readonly deletePick: DeletePickBusiness,
    private readonly listContext: ListPicksContext,
    private readonly saveContext: SavePickContext,
    private readonly deleteContext: DeletePickContext,
  ) {}

  /** 다른 모듈(results)이 부르는 문 — 사용자 키를 이미 알고 있다 */
  async listByUser(userKey: string): Promise<PickResponse[]> {
    return (await this.listPicks.execute(userKey)).map(toResponse);
  }

  async listForCurrentUser(): Promise<PickResponse[]> {
    return this.listByUser(await this.listContext.currentUserKey());
  }

  async saveForCurrentUser(request: SavePickRequest): Promise<PickResponse> {
    const userKey = await this.saveContext.currentUserKey();
    const result = await this.savePick.execute(userKey, request.numbers);
    if (!result.ok) throw new BadRequestException(result.error);
    return toResponse(result.value);
  }

  async deleteForCurrentUser(pickId: string): Promise<{ deleted: true }> {
    const userKey = await this.deleteContext.currentUserKey();
    const result = await this.deletePick.execute(userKey, pickId);
    if (!result.ok) throw new NotFoundException(result.error);
    return { deleted: true };
  }
}
```

`apps/api/src/modules/picks/interface/picks.controller.ts`:

```ts
import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import type { PickResponse, SavePickRequest } from "@fortuna-lottery/contract/picks";
import { PicksFacade } from "./picks.facade";

@Controller("picks")
export class PicksController {
  constructor(private readonly facade: PicksFacade) {}

  @Get()
  list(): Promise<PickResponse[]> {
    return this.facade.listForCurrentUser();
  }

  @Post()
  save(@Body() body: SavePickRequest): Promise<PickResponse> {
    return this.facade.saveForCurrentUser(body);
  }

  @Delete(":id")
  remove(@Param("id") id: string): Promise<{ deleted: true }> {
    return this.facade.deleteForCurrentUser(id);
  }
}
```

`apps/api/src/modules/picks/interface/index.ts`:

```ts
export * from "./picks.facade";
export * from "./picks.controller";
```

- [ ] **Step 6: 모듈 등록**

`apps/api/src/modules/picks/picks.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { DeletePickBusiness, ListPicksBusiness, SavePickBusiness } from "./business";
import { DeletePickContext, IdentityProvider, ListPicksContext, SavePickContext } from "./context";
import { PickRepository } from "./domain";
import { IdentityFacadeAdapter, InMemoryPickRepository } from "./infra";
import { PicksController, PicksFacade } from "./interface";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [IdentityModule],
  controllers: [PicksController],
  providers: [
    { provide: PickRepository, useClass: InMemoryPickRepository },
    { provide: IdentityProvider, useClass: IdentityFacadeAdapter },
    ListPicksContext,
    SavePickContext,
    DeletePickContext,
    ListPicksBusiness,
    SavePickBusiness,
    DeletePickBusiness,
    PicksFacade,
  ],
  exports: [PicksFacade],
})
export class PicksModule {}
```

`apps/api/src/app.module.ts`의 `imports`에 `PicksModule` 추가.

- [ ] **Step 7: 기존 유스케이스 테스트를 business 테스트로 이식한다**

```bash
cd "$(git rev-parse --show-toplevel)"
cp packages/core/src/picks/application/usecases/picks.usecases.test.ts \
   apps/api/src/modules/picks/business/picks.business.test.ts
```

`apps/api/src/modules/picks/business/picks.business.test.ts`의 상단 `setup()`을 아래로 바꾼다(검증 본문은 그대로 두되, `savePick(userId, {numbers})` 호출을 `savePick(userId, numbers)`로, `listPicks(userId)`/`deletePick(userId, id)`는 그대로 쓴다):

```ts
import { describe, expect, it } from "vitest";
import { InMemoryPickRepository } from "../infra";
import { DeletePickBusiness, ListPicksBusiness, SavePickBusiness } from "./index";

const setup = () => {
  const repository = new InMemoryPickRepository();
  let seq = 0;
  let tick = 0;
  const save = new SavePickBusiness(repository);
  return {
    repository,
    savePick: (userId: string, numbers: number[]) =>
      save.execute(userId, numbers, {
        idGenerator: () => `pick-${++seq}`,
        clock: () => new Date(Date.UTC(2026, 6, 1, 0, 0, ++tick)),
      }),
    listPicks: (userId: string) => new ListPicksBusiness(repository).execute(userId),
    deletePick: (userId: string, id: string) =>
      new DeletePickBusiness(repository).execute(userId, id),
  };
};
```

> 테스트가 `savePick`의 반환에서 `result.value.numbers`·`result.value.id`를 읽는 부분은 그대로 동작한다 — business가 DTO가 아니라 `Pick` Model을 돌려주지만 두 타입의 해당 필드가 같다. `createdAt`이 필요한 검증만 `result.value.createdAt`으로 읽으면 된다.

컨트롤러 스모크 1개도 추가한다(§11). `apps/api/src/modules/picks/interface/picks.controller.test.ts`:

```ts
import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { PicksModule } from "../picks.module";
import { PicksController } from "./picks.controller";

describe("PicksController (스모크)", () => {
  it("저장 → 목록 → 삭제가 게스트 사용자로 이어진다", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [PicksModule] }).compile();
    const controller = moduleRef.get(PicksController);

    const saved = await controller.save({ numbers: [6, 5, 4, 3, 2, 1] });
    expect(saved.numbers).toEqual([1, 2, 3, 4, 5, 6]); // VO가 정렬한다

    expect((await controller.list()).map((p) => p.id)).toEqual([saved.id]);

    await expect(controller.remove(saved.id)).resolves.toEqual({ deleted: true });
    expect(await controller.list()).toEqual([]);
    await expect(controller.remove(saved.id)).rejects.toBeInstanceOf(NotFoundException);

    await moduleRef.close();
  });
});
```

- [ ] **Step 8: 컷오버**

```bash
cd "$(git rev-parse --show-toplevel)"
rm apps/web/src/app/api/picks/route.ts "apps/web/src/app/api/picks/[id]/route.ts"
rmdir "apps/web/src/app/api/picks/[id]" apps/web/src/app/api/picks
```

`apps/web/src/server/container.ts`에서 `savePick`·`listPicks`·`deletePick`·`pickRepository`와 그 import를 지운다. `checkResults`는 아직 Next에 있으므로 `pickRepository`가 필요하다 — **지우지 말고 남긴다.**

> ⚠️ **이 시점에 "결과 확인"은 항상 빈 목록을 준다.** 픽은 Nest 프로세스 메모리에 저장되는데 `checkResults`는 아직 Next 프로세스의 저장소를 읽기 때문이다. Task 9에서 해소된다.

- [ ] **Step 9: 검증과 커밋**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: 전부 통과. lint의 그래프 검사가 `모듈 그래프 OK — 4개 모듈, 순환 없음`을 출력한다.

```bash
git add -A
git commit -m "feat(api): picks 모듈 이전 — context 3개 + identity gateway (첫 모듈 간 경계)"
```

---

## Task 9: `results` 이전 — 모듈 간 port 3개 (가장 복잡)

**스펙 §10 순서에서 앞당긴 이유:** picks가 Nest로 넘어간 뒤 results가 Next에 남아 있으면 서로 다른 프로세스의 인메모리 저장소를 보게 된다(Task 8 Step 8의 경고). 의존(identity·picks·lotterietus)은 이미 전부 이전됐으므로 지금이 가장 이르게 안전한 시점이다.

**Files:**
- Create: `apps/api/src/modules/results/**`
- Modify: `apps/api/src/app.module.ts`
- Delete: `apps/web/src/app/api/results/route.ts`
- Modify: `apps/web/src/server/container.ts`

---

- [ ] **Step 1: domain — 자기 모듈의 최소 형태를 스스로 선언한다**

`apps/api/src/modules/results/domain/model/result.model.ts`:

```ts
/** 대조 기준 회차의 최소 형태 — lotterietus의 Draw를 참조하지 않는다 (모듈 경계) */
export interface DrawRecord {
  readonly round: number;
  readonly numbers: readonly number[];
  readonly bonus: number;
  readonly drawnAt: string;
}

/** 대조 대상 픽의 최소 형태 */
export interface PickRecord {
  readonly id: string;
  readonly numbers: readonly number[];
  readonly createdAt: string;
}

/** 픽 1건의 채점 결과 — 근접 정도를 사실 그대로 담는다 (과장 없음) */
export interface ResultItem {
  readonly pickId: string;
  readonly numbers: number[];
  readonly matchedNumbers: number[];
  readonly matchedCount: number;
  readonly bonusMatched: boolean;
  readonly rank: number;
}

/** 대조 결과 전체 */
export interface CheckedResults {
  readonly draw: DrawRecord | null;
  readonly items: ResultItem[];
}
```

`apps/api/src/modules/results/domain/index.ts`:

```ts
export * from "./model/result.model";
```

- [ ] **Step 2: context port 3개**

`apps/api/src/modules/results/context/port/identityProvider.port.ts`:

```ts
import type { UserResponse } from "@fortuna-lottery/contract/identity";

export abstract class IdentityProvider {
  abstract currentUser(): Promise<UserResponse>;
}
```

`apps/api/src/modules/results/context/port/picksProvider.port.ts`:

```ts
import type { PickResponse } from "@fortuna-lottery/contract/picks";

export abstract class PicksProvider {
  abstract listByUser(userKey: string): Promise<PickResponse[]>;
}
```

`apps/api/src/modules/results/context/port/drawProvider.port.ts`:

```ts
import type { DrawResponse } from "@fortuna-lottery/contract/lotterietus";

export abstract class DrawProvider {
  abstract listAllDraws(): Promise<DrawResponse[]>;
}
```

`apps/api/src/modules/results/context/port/index.ts`:

```ts
export * from "./identityProvider.port";
export * from "./picksProvider.port";
export * from "./drawProvider.port";
```

- [ ] **Step 3: context — 재료 조립 (정책 판단 없음)**

`apps/api/src/modules/results/context/checkResults.context.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type { DrawRecord, PickRecord } from "../domain";
import { DrawProvider, IdentityProvider, PicksProvider } from "./port";

export interface CheckResultsMaterial {
  latest: DrawRecord | null;
  picks: PickRecord[];
}

/** 당첨 대조 유즈케이스 전용 재료 조립 — 사용자 해석 후 픽과 회차를 병렬로 모은다 */
@Injectable()
export class CheckResultsContext {
  constructor(
    private readonly identity: IdentityProvider,
    private readonly picks: PicksProvider,
    private readonly draws: DrawProvider,
  ) {}

  async gather(): Promise<CheckResultsMaterial> {
    const user = await this.identity.currentUser();
    const [picks, draws] = await Promise.all([
      this.picks.listByUser(user.id),
      this.draws.listAllDraws(),
    ]);
    return { latest: draws[draws.length - 1] ?? null, picks };
  }
}
```

`apps/api/src/modules/results/context/index.ts`:

```ts
export * from "./checkResults.context";
export * from "./port";
```

- [ ] **Step 4: business — 등수 판정 정책만**

`apps/api/src/modules/results/business/checkResults.business.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { createCombination, scoreAgainstDraw } from "../../../shared";
import { CheckResultsContext } from "../context";
import type { CheckedResults, DrawRecord, PickRecord, ResultItem } from "../domain";

/**
 * 당첨 대조 정책 — 저장된 픽을 최신 회차와 대조해 채점한다.
 * 근접 정도(matchedNumbers)는 사실 그대로 제공한다 (과장 없음 — 다크패턴 회피).
 */
@Injectable()
export class CheckResultsBusiness {
  constructor(private readonly context: CheckResultsContext) {}

  async execute(): Promise<CheckedResults> {
    const { latest, picks } = await this.context.gather();
    if (!latest) return { draw: null, items: [] };

    const items = picks
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((pick) => CheckResultsBusiness.score(pick, latest));

    return { draw: latest, items };
  }

  /** 저장 시 검증된 조합이지만 채점 전 안전하게 재검증한다 */
  private static score(pick: PickRecord, draw: DrawRecord): ResultItem {
    const combination = createCombination(pick.numbers);
    const score = combination.ok
      ? scoreAgainstDraw(combination.value, draw.numbers, draw.bonus)
      : { matchedNumbers: [], matchedCount: 0, bonusMatched: false, rank: 0 as const };

    return {
      pickId: pick.id,
      numbers: [...pick.numbers],
      matchedNumbers: [...score.matchedNumbers],
      matchedCount: score.matchedCount,
      bonusMatched: score.bonusMatched,
      rank: score.rank,
    };
  }
}
```

`apps/api/src/modules/results/business/index.ts`:

```ts
export * from "./checkResults.business";
```

- [ ] **Step 5: business 테스트를 이식한다 (fake port 주입 — DB·HTTP 없음)**

구 `check-results.test.ts`는 저장소를 직접 주입했지만 새 구조에서는 port 3개를 주입하므로, 복사가 아니라 **새로 작성**한다(검증하는 동작은 동일하다). `apps/api/src/modules/results/business/checkResults.business.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { DrawResponse } from "@fortuna-lottery/contract/lotterietus";
import type { PickResponse } from "@fortuna-lottery/contract/picks";
import type { UserResponse } from "@fortuna-lottery/contract/identity";
import { CheckResultsContext, DrawProvider, IdentityProvider, PicksProvider } from "../context";
import { CheckResultsBusiness } from "./checkResults.business";

class FakeIdentity extends IdentityProvider {
  async currentUser(): Promise<UserResponse> {
    return { id: "guest", isGuest: true };
  }
}

class FakePicks extends PicksProvider {
  constructor(private readonly picks: PickResponse[]) {
    super();
  }
  async listByUser(): Promise<PickResponse[]> {
    return this.picks;
  }
}

class FakeDraws extends DrawProvider {
  constructor(private readonly draws: DrawResponse[]) {
    super();
  }
  async listAllDraws(): Promise<DrawResponse[]> {
    return this.draws;
  }
}

const build = (picks: PickResponse[], draws: DrawResponse[]) =>
  new CheckResultsBusiness(
    new CheckResultsContext(new FakeIdentity(), new FakePicks(picks), new FakeDraws(draws)),
  );

const DRAWS: DrawResponse[] = [
  { round: 1, numbers: [10, 11, 12, 13, 14, 15], bonus: 16, drawnAt: "2026-06-20T11:35:00.000Z" },
  { round: 2, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2026-06-27T11:35:00.000Z" },
];

describe("CheckResultsBusiness (당첨 대조)", () => {
  it("저장된 픽을 최신 회차와 대조해 채점한다", async () => {
    const results = await build(
      [{ id: "p1", numbers: [1, 2, 3, 40, 41, 42], createdAt: "2026-07-01T00:00:00.000Z" }],
      DRAWS,
    ).execute();

    expect(results.draw?.round).toBe(2);
    expect(results.items).toHaveLength(1);
    expect(results.items[0]?.matchedCount).toBe(3);
    expect(results.items[0]?.rank).toBe(5);
    expect(results.items[0]?.matchedNumbers).toEqual([1, 2, 3]);
  });

  it("최신 저장순으로 정렬한다", async () => {
    const results = await build(
      [
        { id: "old", numbers: [1, 2, 3, 4, 5, 6], createdAt: "2026-07-01T00:00:00.000Z" },
        { id: "new", numbers: [7, 8, 9, 10, 11, 12], createdAt: "2026-07-02T00:00:00.000Z" },
      ],
      DRAWS,
    ).execute();

    expect(results.items.map((i) => i.pickId)).toEqual(["new", "old"]);
  });

  it("회차가 없으면 빈 결과를 준다", async () => {
    const results = await build([], []).execute();
    expect(results).toEqual({ draw: null, items: [] });
  });
});
```

- [ ] **Step 6: infra gateway 3개 — 다른 모듈을 아는 파일은 여기뿐**

`apps/api/src/modules/results/infra/gateway/identityFacade.adapter.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type { UserResponse } from "@fortuna-lottery/contract/identity";
import { IdentityProvider } from "../../context";
import { IdentityFacade } from "../../../identity/interface";

@Injectable()
export class IdentityFacadeAdapter extends IdentityProvider {
  constructor(private readonly identity: IdentityFacade) {
    super();
  }

  currentUser(): Promise<UserResponse> {
    return this.identity.currentUser();
  }
}
```

`apps/api/src/modules/results/infra/gateway/picksFacade.adapter.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type { PickResponse } from "@fortuna-lottery/contract/picks";
import { PicksProvider } from "../../context";
import { PicksFacade } from "../../../picks/interface";

@Injectable()
export class PicksFacadeAdapter extends PicksProvider {
  constructor(private readonly picks: PicksFacade) {
    super();
  }

  listByUser(userKey: string): Promise<PickResponse[]> {
    return this.picks.listByUser(userKey);
  }
}
```

`apps/api/src/modules/results/infra/gateway/lotterietusFacade.adapter.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type { DrawResponse } from "@fortuna-lottery/contract/lotterietus";
import { DrawProvider } from "../../context";
import { LotterietusFacade } from "../../../lotterietus/interface";

@Injectable()
export class LotterietusFacadeAdapter extends DrawProvider {
  constructor(private readonly lotterietus: LotterietusFacade) {
    super();
  }

  listAllDraws(): Promise<DrawResponse[]> {
    return this.lotterietus.listAllDraws();
  }
}
```

`apps/api/src/modules/results/infra/index.ts`:

```ts
export * from "./gateway/identityFacade.adapter";
export * from "./gateway/picksFacade.adapter";
export * from "./gateway/lotterietusFacade.adapter";
```

- [ ] **Step 7: interface + 모듈**

`apps/api/src/modules/results/interface/results.facade.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type { ResultsResponse } from "@fortuna-lottery/contract/results";
import { CheckResultsBusiness } from "../business";

@Injectable()
export class ResultsFacade {
  constructor(private readonly checkResults: CheckResultsBusiness) {}

  async check(): Promise<ResultsResponse> {
    const { draw, items } = await this.checkResults.execute();
    return {
      draw: draw
        ? {
            round: draw.round,
            numbers: [...draw.numbers],
            bonus: draw.bonus,
            drawnAt: draw.drawnAt,
          }
        : null,
      items: items.map((item) => ({ ...item })),
    };
  }
}
```

`apps/api/src/modules/results/interface/results.controller.ts`:

```ts
import { Controller, Get } from "@nestjs/common";
import type { ResultsResponse } from "@fortuna-lottery/contract/results";
import { ResultsFacade } from "./results.facade";

@Controller("results")
export class ResultsController {
  constructor(private readonly facade: ResultsFacade) {}

  @Get()
  check(): Promise<ResultsResponse> {
    return this.facade.check();
  }
}
```

`apps/api/src/modules/results/interface/index.ts`:

```ts
export * from "./results.facade";
export * from "./results.controller";
```

컨트롤러 스모크 1개(§11) — Facade가 DTO로만 나가는지까지 확인한다. `apps/api/src/modules/results/interface/results.controller.test.ts`:

```ts
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { CheckResultsBusiness } from "../business";
import { CheckResultsContext } from "../context";
import { ResultsController } from "./results.controller";
import { ResultsFacade } from "./results.facade";

class StubContext {
  async gather() {
    return {
      latest: { round: 2, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2026-06-27T11:35:00.000Z" },
      picks: [{ id: "p1", numbers: [1, 2, 3, 40, 41, 42], createdAt: "2026-07-01T00:00:00.000Z" }],
    };
  }
}

describe("ResultsController (스모크)", () => {
  it("GET /results 가 대조 결과 DTO를 준다", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ResultsController],
      providers: [
        { provide: CheckResultsContext, useClass: StubContext },
        CheckResultsBusiness,
        ResultsFacade,
      ],
    }).compile();

    const response = await moduleRef.get(ResultsController).check();

    expect(response.draw?.round).toBe(2);
    expect(response.items).toHaveLength(1);
    expect(response.items[0]?.rank).toBe(5);
    await moduleRef.close();
  });
});
```

`apps/api/src/modules/results/results.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { CheckResultsBusiness } from "./business";
import { CheckResultsContext, DrawProvider, IdentityProvider, PicksProvider } from "./context";
import {
  IdentityFacadeAdapter,
  LotterietusFacadeAdapter,
  PicksFacadeAdapter,
} from "./infra";
import { ResultsController, ResultsFacade } from "./interface";
import { IdentityModule } from "../identity/identity.module";
import { LotterietusModule } from "../lotterietus/lotterietus.module";
import { PicksModule } from "../picks/picks.module";

@Module({
  imports: [IdentityModule, PicksModule, LotterietusModule],
  controllers: [ResultsController],
  providers: [
    { provide: IdentityProvider, useClass: IdentityFacadeAdapter },
    { provide: PicksProvider, useClass: PicksFacadeAdapter },
    { provide: DrawProvider, useClass: LotterietusFacadeAdapter },
    CheckResultsContext,
    CheckResultsBusiness,
    ResultsFacade,
  ],
  exports: [ResultsFacade],
})
export class ResultsModule {}
```

`apps/api/src/app.module.ts`의 `imports`에 `ResultsModule` 추가.

- [ ] **Step 8: 컷오버 + 검증 + 커밋**

```bash
cd "$(git rev-parse --show-toplevel)"
rm apps/web/src/app/api/results/route.ts
rmdir apps/web/src/app/api/results
```

`apps/web/src/server/container.ts`에서 `checkResults`·`pickRepository`·`identity`와 그 import를 지운다. 이제 남는 것은 `getStatistics`·`backtestCombination`과 `drawData`뿐이다:

```ts
// 컴포지션 루트 — 아직 Nest로 넘어가지 않은 도메인만 남아 있다 (백엔드 v4 전환 중)
import { makeGetStatistics } from "@fortuna-lottery/core/statistics/application";
import { makeBacktestCombination } from "@fortuna-lottery/core/simulation/application";
import {
  createPrismaClient,
  createPrismaDrawDataAdapter,
} from "@fortuna-lottery/core/lotterietus/infrastructure";

function buildContainer() {
  const drawData = createPrismaDrawDataAdapter(createPrismaClient());
  return {
    getStatistics: makeGetStatistics(drawData),
    backtestCombination: makeBacktestCombination(drawData),
  };
}

type Container = ReturnType<typeof buildContainer>;

const globalRef = globalThis as typeof globalThis & { __fortunaLotteryContainer?: Container };
export const container: Container = (globalRef.__fortunaLotteryContainer ??= buildContainer());
```

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: 전부 통과. 그래프 검사가 `모듈 그래프 OK — 5개 모듈, 순환 없음`.

수동 확인 — 픽 저장 후 결과 대조가 다시 이어진다:

```bash
docker compose up -d
pnpm --filter @fortuna-lottery/api build
(cd apps/api && node --env-file=.env dist/main.js) & API_PID=$!
sleep 6
curl -s -X POST http://localhost:4000/picks -H 'content-type: application/json' \
  -d '{"numbers":[1,2,3,4,5,6]}' ; echo
curl -s http://localhost:4000/results | head -c 300 ; echo
kill $API_PID
```

Expected: POST가 `{"id":"pick_...","numbers":[1,2,3,4,5,6],"createdAt":"..."}`, GET `/results`가 그 픽을 `items`에 담아 돌려준다.

```bash
git add -A
git commit -m "feat(api): results 모듈 이전 — 모듈 간 port 3개, picks 인메모리 저장소 단절 해소"
```

---

## Task 10: `statistics` 이전

**Files:**
- Create/Move: `apps/api/src/modules/statistics/**`
- Modify: `apps/api/src/app.module.ts`
- Delete: `apps/web/src/app/api/statistics/route.ts`
- Modify: `apps/web/src/server/container.ts`

---

- [ ] **Step 1: domain — 순수 계산 이사 + 자기 회차 형태 선언 + ReadModel 용어 폐기**

```bash
cd "$(git rev-parse --show-toplevel)"
mkdir -p apps/api/src/modules/statistics/domain/model
cp packages/core/src/statistics/domain/calculations.ts       apps/api/src/modules/statistics/domain/calculations.ts
cp packages/core/src/statistics/domain/calculations.test.ts  apps/api/src/modules/statistics/domain/calculations.test.ts
```

`apps/api/src/modules/statistics/domain/model/drawRecord.model.ts`:

```ts
/** 통계 계산에 필요한 회차의 최소 형태 — lotterietus의 Draw를 참조하지 않는다 (모듈 경계) */
export interface DrawRecord {
  readonly round: number;
  readonly numbers: readonly number[];
  readonly bonus: number;
}
```

`apps/api/src/modules/statistics/domain/model/statistics.model.ts` (**구 `StatisticsReadModel`** — §8에 따라 `Model`로 통합):

```ts
/**
 * 통계 — 회차 데이터로부터 순수 계산되는 도메인 데이터.
 * 리포지토리가 없다는 사실이 곧 "영속되지 않는 파생 데이터"임을 드러낸다.
 */
export interface Statistics {
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
}
```

`calculations.ts`의 상단 import 2줄을 아래로 바꾸고, 파일 안의 `Draw` 타입 참조를 전부 `DrawRecord`로 바꾼다(계산 본문은 한 줄도 바뀌지 않는다):

```ts
import { LOTTO_MAX } from "../../../shared";
import type { DrawRecord } from "./model/drawRecord.model";
```

```bash
perl -i -pe 's/\breadonly Draw\[\]/readonly DrawRecord[]/g' apps/api/src/modules/statistics/domain/calculations.ts
```

`calculations.test.ts` — import를 바꾸고 픽스처에서 `drawnAt`을 뺀다(`DrawRecord`에 없는 필드다):

```ts
import { describe, expect, it } from "vitest";
import type { DrawRecord } from "./model/drawRecord.model";
import {
  frequency,
  hotCold,
  lowCountDistribution,
  oddCountDistribution,
  sumDistribution,
  topPairs,
  zoneCounts,
} from "./calculations";

const draw = (round: number, numbers: number[], bonus = 45): DrawRecord => ({
  round,
  numbers,
  bonus,
});

// 검증용 소형 픽스처: 계산을 손으로 확인할 수 있는 크기
const DRAWS: DrawRecord[] = [
```

(그 아래 `draw(1, …)` 세 줄과 검증 본문은 그대로 둔다.)

`apps/api/src/modules/statistics/domain/index.ts`:

```ts
export * from "./calculations";
export * from "./model/drawRecord.model";
export * from "./model/statistics.model";
```

- [ ] **Step 2: context + port (외부 재료 = draws)**

`apps/api/src/modules/statistics/context/port/drawProvider.port.ts`:

```ts
import type { DrawResponse } from "@fortuna-lottery/contract/lotterietus";

export abstract class DrawProvider {
  abstract listAllDraws(): Promise<DrawResponse[]>;
}
```

`apps/api/src/modules/statistics/context/port/index.ts`:

```ts
export * from "./drawProvider.port";
```

`apps/api/src/modules/statistics/context/getStatistics.context.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type { DrawRecord } from "../domain";
import { DrawProvider } from "./port";

/** 통계 유즈케이스 전용 재료 조립 — 회차 DTO를 자기 domain 형태로 옮긴다 */
@Injectable()
export class GetStatisticsContext {
  constructor(private readonly draws: DrawProvider) {}

  async allDraws(): Promise<DrawRecord[]> {
    const draws = await this.draws.listAllDraws();
    return draws.map((draw) => ({ round: draw.round, numbers: draw.numbers, bonus: draw.bonus }));
  }
}
```

`apps/api/src/modules/statistics/context/index.ts`:

```ts
export * from "./getStatistics.context";
export * from "./port";
```

- [ ] **Step 3: business**

`apps/api/src/modules/statistics/business/getStatistics.business.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { GetStatisticsContext } from "../context";
import {
  frequency,
  hotCold,
  lowCountDistribution,
  oddCountDistribution,
  sumDistribution,
  topPairs,
  zoneCounts,
  type Statistics,
} from "../domain";

/** 통계 정책 — 회차 데이터를 한 번 읽어 8종 통계를 일괄 계산한다 */
@Injectable()
export class GetStatisticsBusiness {
  /** 잔디밭: 최근 1년치 */
  private static readonly GRID_ROUNDS = 52;
  private static readonly TOP_PAIRS = 15;

  constructor(private readonly context: GetStatisticsContext) {}

  async execute(): Promise<Statistics> {
    const draws = await this.context.allDraws();
    const latest = draws[draws.length - 1];
    return {
      totalDraws: draws.length,
      latestRound: latest?.round ?? 0,
      frequency: frequency(draws),
      sumDistribution: sumDistribution(draws),
      oddCountDist: oddCountDistribution(draws),
      lowCountDist: lowCountDistribution(draws),
      zoneCounts: zoneCounts(draws),
      hotCold: hotCold(draws),
      topPairs: topPairs(draws, GetStatisticsBusiness.TOP_PAIRS),
      recentGrid: draws.slice(-GetStatisticsBusiness.GRID_ROUNDS).map((draw) => ({
        round: draw.round,
        numbers: [...draw.numbers],
      })),
    };
  }
}
```

`apps/api/src/modules/statistics/business/index.ts`:

```ts
export * from "./getStatistics.business";
```

- [ ] **Step 4: context 단위 테스트를 쓴다 (fake port 주입 — §11)**

`apps/api/src/modules/statistics/context/getStatistics.context.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { DrawResponse } from "@fortuna-lottery/contract/lotterietus";
import { DrawProvider } from "./port";
import { GetStatisticsContext } from "./getStatistics.context";

class FakeDrawProvider extends DrawProvider {
  async listAllDraws(): Promise<DrawResponse[]> {
    return [
      { round: 1, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2026-06-20T11:35:00.000Z" },
      { round: 2, numbers: [7, 8, 9, 10, 11, 12], bonus: 13, drawnAt: "2026-06-27T11:35:00.000Z" },
    ];
  }
}

describe("GetStatisticsContext", () => {
  it("회차 DTO를 자기 domain 형태(DrawRecord)로 옮긴다 — drawnAt은 버린다", async () => {
    const records = await new GetStatisticsContext(new FakeDrawProvider()).allDraws();
    expect(records).toEqual([
      { round: 1, numbers: [1, 2, 3, 4, 5, 6], bonus: 7 },
      { round: 2, numbers: [7, 8, 9, 10, 11, 12], bonus: 13 },
    ]);
  });
});
```

- [ ] **Step 5: interface + infra + 모듈**

`apps/api/src/modules/statistics/interface/statistics.facade.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type { StatisticsResponse } from "@fortuna-lottery/contract/statistics";
import { TOTAL_COMBINATIONS } from "../../../shared";
import { GetStatisticsBusiness } from "../business";

@Injectable()
export class StatisticsFacade {
  constructor(private readonly getStatistics: GetStatisticsBusiness) {}

  async statistics(): Promise<StatisticsResponse> {
    const statistics = await this.getStatistics.execute();
    // 6/45 전체 조합 수는 고정 분모 정직성 장치다 — 계산이 아니라 계약의 일부다
    return { ...statistics, totalCombinations: TOTAL_COMBINATIONS };
  }
}
```

`apps/api/src/modules/statistics/interface/statistics.controller.ts`:

```ts
import { Controller, Get } from "@nestjs/common";
import type { StatisticsResponse } from "@fortuna-lottery/contract/statistics";
import { StatisticsFacade } from "./statistics.facade";

@Controller("statistics")
export class StatisticsController {
  constructor(private readonly facade: StatisticsFacade) {}

  @Get()
  statistics(): Promise<StatisticsResponse> {
    return this.facade.statistics();
  }
}
```

`apps/api/src/modules/statistics/interface/index.ts`:

```ts
export * from "./statistics.facade";
export * from "./statistics.controller";
```

`apps/api/src/modules/statistics/infra/gateway/lotterietusFacade.adapter.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type { DrawResponse } from "@fortuna-lottery/contract/lotterietus";
import { DrawProvider } from "../../context";
import { LotterietusFacade } from "../../../lotterietus/interface";

/** lotterietus 모듈을 아는 유일한 파일 */
@Injectable()
export class LotterietusFacadeAdapter extends DrawProvider {
  constructor(private readonly lotterietus: LotterietusFacade) {
    super();
  }

  listAllDraws(): Promise<DrawResponse[]> {
    return this.lotterietus.listAllDraws();
  }
}
```

`apps/api/src/modules/statistics/infra/index.ts`:

```ts
export * from "./gateway/lotterietusFacade.adapter";
```

`apps/api/src/modules/statistics/statistics.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { GetStatisticsBusiness } from "./business";
import { DrawProvider, GetStatisticsContext } from "./context";
import { LotterietusFacadeAdapter } from "./infra";
import { StatisticsController, StatisticsFacade } from "./interface";
import { LotterietusModule } from "../lotterietus/lotterietus.module";

@Module({
  imports: [LotterietusModule],
  controllers: [StatisticsController],
  providers: [
    { provide: DrawProvider, useClass: LotterietusFacadeAdapter },
    GetStatisticsContext,
    GetStatisticsBusiness,
    StatisticsFacade,
  ],
  exports: [StatisticsFacade],
})
export class StatisticsModule {}
```

`apps/api/src/app.module.ts`의 `imports`에 `StatisticsModule` 추가.

컨트롤러 스모크 1개(§11). `apps/api/src/modules/statistics/interface/statistics.controller.test.ts`:

```ts
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import type { DrawResponse } from "@fortuna-lottery/contract/lotterietus";
import { GetStatisticsBusiness } from "../business";
import { DrawProvider, GetStatisticsContext } from "../context";
import { StatisticsController } from "./statistics.controller";
import { StatisticsFacade } from "./statistics.facade";

class StubDrawProvider extends DrawProvider {
  async listAllDraws(): Promise<DrawResponse[]> {
    return [
      { round: 1, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2026-06-20T11:35:00.000Z" },
      { round: 2, numbers: [1, 2, 3, 40, 41, 42], bonus: 8, drawnAt: "2026-06-27T11:35:00.000Z" },
    ];
  }
}

describe("StatisticsController (스모크)", () => {
  it("GET /statistics 가 통계 DTO를 준다 — 고정 분모 포함", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        { provide: DrawProvider, useClass: StubDrawProvider },
        GetStatisticsContext,
        GetStatisticsBusiness,
        StatisticsFacade,
      ],
    }).compile();

    const response = await moduleRef.get(StatisticsController).statistics();

    expect(response.totalDraws).toBe(2);
    expect(response.latestRound).toBe(2);
    expect(response.frequency).toHaveLength(45);
    expect(response.frequency[0]).toBe(2); // 1번이 두 회차 모두 출현
    expect(response.totalCombinations).toBe(8_145_060);
    await moduleRef.close();
  });
});
```

- [ ] **Step 6: 컷오버 + 검증 + 커밋**

```bash
cd "$(git rev-parse --show-toplevel)"
rm apps/web/src/app/api/statistics/route.ts
rmdir apps/web/src/app/api/statistics
```

`apps/web/src/server/container.ts`에서 `getStatistics`와 그 import를 지운다(남는 것은 `backtestCombination`뿐).

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: 전부 통과. 그래프 검사 `6개 모듈, 순환 없음`.

```bash
git add -A
git commit -m "feat(api): statistics 모듈 이전 — ReadModel 용어 폐기, 자기 DrawRecord 선언"
```

---

## Task 11: `simulation` 이전 (마지막 도메인)

**Files:**
- Create/Move: `apps/api/src/modules/simulation/**`
- Modify: `apps/api/src/app.module.ts`
- Delete: `apps/web/src/app/api/simulation/route.ts`
- Delete: `apps/web/src/server/container.ts`

---

- [ ] **Step 1: domain — 순수 계산 이사 + 자기 회차 형태 + ReadModel 용어 폐기**

```bash
cd "$(git rev-parse --show-toplevel)"
mkdir -p apps/api/src/modules/simulation/domain/model
cp packages/core/src/simulation/domain/backtest.ts       apps/api/src/modules/simulation/domain/backtest.ts
cp packages/core/src/simulation/domain/backtest.test.ts  apps/api/src/modules/simulation/domain/backtest.test.ts
```

`apps/api/src/modules/simulation/domain/model/drawRecord.model.ts`:

```ts
/** 백테스트에 필요한 회차의 최소 형태 — lotterietus의 Draw를 참조하지 않는다 (모듈 경계) */
export interface DrawRecord {
  readonly round: number;
  readonly numbers: readonly number[];
  readonly bonus: number;
}
```

`apps/api/src/modules/simulation/domain/model/backtest.model.ts` (**구 `BacktestReadModel`**):

```ts
/** 백테스트 결과 — 순수 계산의 산출물 (영속되지 않는다) */
export interface BacktestResult {
  totalDraws: number;
  /** index = 등수 (0 = 낙첨, 1~5 = 등수별 횟수) */
  rankCounts: number[];
  /** 당첨(5등 이상) 회차 목록 — 회차 오름차순 */
  wins: { round: number; rank: number; matchedCount: number }[];
}
```

`apps/api/src/modules/simulation/domain/backtest.ts` 전체:

```ts
import { scoreAgainstDraw, type Combination } from "../../../shared";
import type { BacktestResult } from "./model/backtest.model";
import type { DrawRecord } from "./model/drawRecord.model";

/**
 * 타임머신 백테스트 — "이 번호를 과거 전 회차에 넣었다면?"
 * 전 회차를 채점해 등수별 횟수를 집계한다 (사실 기반, 미래 예측 아님).
 */
export function backtest(
  combination: Combination,
  draws: readonly DrawRecord[],
): BacktestResult {
  const rankCounts = new Array<number>(6).fill(0);
  const wins: BacktestResult["wins"] = [];
  for (const draw of draws) {
    const { rank, matchedCount } = scoreAgainstDraw(combination, draw.numbers, draw.bonus);
    rankCounts[rank] = (rankCounts[rank] ?? 0) + 1;
    if (rank > 0) wins.push({ round: draw.round, rank, matchedCount });
  }
  return { totalDraws: draws.length, rankCounts, wins };
}
```

`backtest.test.ts`의 상단 import와 `draw()` 헬퍼를 바꾼다(검증 본문은 그대로):

```ts
import { describe, expect, it } from "vitest";
import { createCombination } from "../../../shared";
import type { DrawRecord } from "./model/drawRecord.model";
import { backtest } from "./backtest";

const combo = (ns: number[]) => {
  const r = createCombination(ns);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

const draw = (round: number, numbers: number[], bonus: number): DrawRecord => ({
  round,
  numbers,
  bonus,
});
```

`apps/api/src/modules/simulation/domain/index.ts`:

```ts
export * from "./backtest";
export * from "./model/backtest.model";
export * from "./model/drawRecord.model";
```

- [ ] **Step 2: context + port + business**

`apps/api/src/modules/simulation/context/port/drawProvider.port.ts`:

```ts
import type { DrawResponse } from "@fortuna-lottery/contract/lotterietus";

export abstract class DrawProvider {
  abstract listAllDraws(): Promise<DrawResponse[]>;
}
```

`apps/api/src/modules/simulation/context/port/index.ts`:

```ts
export * from "./drawProvider.port";
```

`apps/api/src/modules/simulation/context/backtestCombination.context.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type { DrawRecord } from "../domain";
import { DrawProvider } from "./port";

@Injectable()
export class BacktestCombinationContext {
  constructor(private readonly draws: DrawProvider) {}

  async allDraws(): Promise<DrawRecord[]> {
    const draws = await this.draws.listAllDraws();
    return draws.map((draw) => ({ round: draw.round, numbers: draw.numbers, bonus: draw.bonus }));
  }
}
```

`apps/api/src/modules/simulation/context/index.ts`:

```ts
export * from "./backtestCombination.context";
export * from "./port";
```

`apps/api/src/modules/simulation/business/backtestCombination.business.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { createCombination, ok, type Result } from "../../../shared";
import { BacktestCombinationContext } from "../context";
import { backtest, type BacktestResult } from "../domain";

/** 백테스트 정책 — 조합 검증 후 전 회차 채점 */
@Injectable()
export class BacktestCombinationBusiness {
  constructor(private readonly context: BacktestCombinationContext) {}

  async execute(numbers: readonly number[]): Promise<Result<BacktestResult>> {
    const combination = createCombination(numbers);
    if (!combination.ok) return combination;
    const draws = await this.context.allDraws();
    return ok(backtest(combination.value, draws));
  }
}
```

`apps/api/src/modules/simulation/business/index.ts`:

```ts
export * from "./backtestCombination.business";
```

- [ ] **Step 3: interface + infra + 모듈**

`apps/api/src/modules/simulation/interface/simulation.facade.ts`:

```ts
import { BadRequestException, Injectable } from "@nestjs/common";
import type { SimulationRequest, SimulationResponse } from "@fortuna-lottery/contract/simulation";
import { BacktestCombinationBusiness } from "../business";

@Injectable()
export class SimulationFacade {
  constructor(private readonly backtest: BacktestCombinationBusiness) {}

  async run(request: SimulationRequest): Promise<SimulationResponse> {
    const result = await this.backtest.execute(request.numbers);
    if (!result.ok) throw new BadRequestException(result.error);
    return result.value;
  }
}
```

`apps/api/src/modules/simulation/interface/simulation.controller.ts`:

```ts
import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import type { SimulationRequest, SimulationResponse } from "@fortuna-lottery/contract/simulation";
import { SimulationFacade } from "./simulation.facade";

@Controller("simulation")
export class SimulationController {
  constructor(private readonly facade: SimulationFacade) {}

  @Post()
  @HttpCode(200)
  run(@Body() body: SimulationRequest): Promise<SimulationResponse> {
    return this.facade.run(body);
  }
}
```

> `@HttpCode(200)`을 붙이는 이유: Nest의 POST 기본 응답 코드는 201인데, 이 엔드포인트는 자원을 만들지 않고 계산 결과를 돌려준다. 기존 Next Route Handler도 200을 줬으므로 프론트 동작이 바뀌지 않는다.

`apps/api/src/modules/simulation/interface/index.ts`:

```ts
export * from "./simulation.facade";
export * from "./simulation.controller";
```

`apps/api/src/modules/simulation/infra/gateway/lotterietusFacade.adapter.ts`:

```ts
import { Injectable } from "@nestjs/common";
import type { DrawResponse } from "@fortuna-lottery/contract/lotterietus";
import { DrawProvider } from "../../context";
import { LotterietusFacade } from "../../../lotterietus/interface";

/** lotterietus 모듈을 아는 유일한 파일 */
@Injectable()
export class LotterietusFacadeAdapter extends DrawProvider {
  constructor(private readonly lotterietus: LotterietusFacade) {
    super();
  }

  listAllDraws(): Promise<DrawResponse[]> {
    return this.lotterietus.listAllDraws();
  }
}
```

`apps/api/src/modules/simulation/infra/index.ts`:

```ts
export * from "./gateway/lotterietusFacade.adapter";
```

컨트롤러 스모크 1개(§11). `apps/api/src/modules/simulation/interface/simulation.controller.test.ts`:

```ts
import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import type { DrawResponse } from "@fortuna-lottery/contract/lotterietus";
import { BacktestCombinationBusiness } from "../business";
import { BacktestCombinationContext, DrawProvider } from "../context";
import { SimulationController } from "./simulation.controller";
import { SimulationFacade } from "./simulation.facade";

class StubDrawProvider extends DrawProvider {
  async listAllDraws(): Promise<DrawResponse[]> {
    return [
      { round: 1, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2026-06-20T11:35:00.000Z" },
      { round: 2, numbers: [10, 11, 12, 13, 14, 15], bonus: 16, drawnAt: "2026-06-27T11:35:00.000Z" },
    ];
  }
}

const build = async () =>
  Test.createTestingModule({
    controllers: [SimulationController],
    providers: [
      { provide: DrawProvider, useClass: StubDrawProvider },
      BacktestCombinationContext,
      BacktestCombinationBusiness,
      SimulationFacade,
    ],
  }).compile();

describe("SimulationController (스모크)", () => {
  it("POST /simulation 이 등수별 집계를 준다", async () => {
    const moduleRef = await build();
    const response = await moduleRef.get(SimulationController).run({ numbers: [1, 2, 3, 4, 5, 6] });

    expect(response.totalDraws).toBe(2);
    expect(response.rankCounts[1]).toBe(1); // 1회차에서 1등
    expect(response.wins).toEqual([{ round: 1, rank: 1, matchedCount: 6 }]);
    await moduleRef.close();
  });

  it("조합이 잘못되면 400을 던진다", async () => {
    const moduleRef = await build();
    await expect(
      moduleRef.get(SimulationController).run({ numbers: [1, 2, 3] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await moduleRef.close();
  });
});
```

`apps/api/src/modules/simulation/simulation.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { BacktestCombinationBusiness } from "./business";
import { BacktestCombinationContext, DrawProvider } from "./context";
import { LotterietusFacadeAdapter } from "./infra";
import { SimulationController, SimulationFacade } from "./interface";
import { LotterietusModule } from "../lotterietus/lotterietus.module";

@Module({
  imports: [LotterietusModule],
  controllers: [SimulationController],
  providers: [
    { provide: DrawProvider, useClass: LotterietusFacadeAdapter },
    BacktestCombinationContext,
    BacktestCombinationBusiness,
    SimulationFacade,
  ],
  exports: [SimulationFacade],
})
export class SimulationModule {}
```

`apps/api/src/app.module.ts` 최종 형태:

```ts
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { GeneratorModule } from "./modules/generator/generator.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { LotterietusModule } from "./modules/lotterietus/lotterietus.module";
import { PicksModule } from "./modules/picks/picks.module";
import { ResultsModule } from "./modules/results/results.module";
import { SimulationModule } from "./modules/simulation/simulation.module";
import { StatisticsModule } from "./modules/statistics/statistics.module";
import { PrismaModule } from "./shared/prisma.module";

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    IdentityModule,
    LotterietusModule,
    GeneratorModule,
    PicksModule,
    ResultsModule,
    StatisticsModule,
    SimulationModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 4: 마지막 컷오버 — `apps/web`의 API 폴더가 프록시 하나만 남는다**

```bash
cd "$(git rev-parse --show-toplevel)"
rm apps/web/src/app/api/simulation/route.ts
rmdir apps/web/src/app/api/simulation
git rm -r --quiet apps/web/src/server
find apps/web/src/app/api -type f
```

Expected: `apps/web/src/app/api/[...path]/route.ts` 한 줄만 출력된다.

- [ ] **Step 5: 검증과 커밋**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: 전부 통과. 그래프 검사 `7개 모듈, 순환 없음`.

```bash
git add -A
git commit -m "feat(api): simulation 모듈 이전 — 7개 도메인 컷오버 완료, web의 server/ 제거"
```

---

## Task 12: 잔재 제거 — `packages/core` 삭제와 설정 정리

`packages/core`는 Task 2부터 지금까지 **한 줄도 바뀌지 않은 채** 남아 있었고(그래서 언제든 되돌릴 수 있었다), 이제 그것을 참조하는 코드가 없다. Task 5~11에서 만든 `apps/api` 쪽 복사본이 모든 트래픽을 받고 있으므로 원본을 지운다. `packages/core/prisma`와 그 중복 마이그레이션도 함께 사라진다.

**Files:**
- Delete: `packages/core/`
- Modify: `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/eslint.config.mjs`
- Modify: `package.json`(루트), `docker-compose.yml` 주석

---

- [ ] **Step 1: core를 참조하는 곳이 정말 없는지 확인한다**

```bash
cd "$(git rev-parse --show-toplevel)"
grep -rn "@fortuna-lottery/core" --include="*.ts" --include="*.tsx" --include="*.mjs" --include="*.json" \
  apps packages | grep -v node_modules | grep -v "^packages/core/"
```

Expected: 정확히 6줄 — `apps/web/package.json`의 dependency 1줄, `apps/web/next.config.ts`의 transpilePackages 1줄, `apps/web/eslint.config.mjs`의 금지 패턴 4줄(`core/*/application`·`core/*/domain`·`core/*/infrastructure`·`core/shared`가 각각 한 줄). 전부 이 태스크에서 정리한다. **다른 줄이 나오면 그 참조를 먼저 해결한다.**

- [ ] **Step 2: core와 빈 countdown 폴더를 지운다**

```bash
git rm -r --quiet packages/core
rm -rf packages/core
```

> 스펙 §6.3의 `packages/core/src/countdown/`(lotterietus 병합 후 남은 빈 폴더)도 이 삭제에 함께 포함된다.

- [ ] **Step 3: `apps/web` 설정을 정리한다**

`apps/web/package.json`의 `dependencies`에서 `@fortuna-lottery/core`를 지운다:

```json
  "dependencies": {
    "@fortuna-lottery/contract": "workspace:*",
    "next": "^15.3.4",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
```

`apps/web/next.config.ts` 전체:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // packages/contract는 순수 TS 소스 그대로 참조한다 (빌드 스텝 없음)
  transpilePackages: ["@fortuna-lottery/contract"],
};

export default nextConfig;
```

> `serverExternalPackages: ["@prisma/client"]`는 더 이상 필요 없다 — `apps/web`은 Prisma를 쓰지 않는다.

`apps/web/eslint.config.mjs`의 `backendInternalPatterns`를 아래로 교체한다(`@fortuna-lottery/core`도 `@/server`도 존재하지 않으므로, 규칙은 "백엔드는 HTTP로만"이라는 사실 자체를 못 박는 형태로 남긴다):

```js
/** FE는 백엔드 코드를 직접 참조하지 않는다 — 계약(DTO)과 HTTP만 쓴다 */
const backendInternalPatterns = [
  {
    group: ["@fortuna-lottery/api", "@fortuna-lottery/api/*", "@fortuna-lottery/core", "@fortuna-lottery/core/*"],
    message:
      "FE는 백엔드 코드를 직접 import할 수 없습니다. 계약(@fortuna-lottery/contract)과 action(HTTP)만 사용하세요.",
  },
];
```

- [ ] **Step 4: 루트 스크립트와 로컬 실행 문서를 맞춘다**

`package.json`(루트)의 `scripts`에 DB 편의 스크립트를 api 기준으로 다시 건다:

```json
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "db:generate": "pnpm --filter @fortuna-lottery/api db:generate",
    "db:migrate": "pnpm --filter @fortuna-lottery/api db:migrate"
  },
```

`docker-compose.yml` 상단 주석을 갱신한다:

```yaml
# 로컬 개발 전용 Postgres — 앱(web·api)은 컨테이너 밖에서 pnpm으로 실행한다
```

```bash
pnpm install
```

- [ ] **Step 5: 전체 검증**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: 전부 통과.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: packages/core 삭제 및 web 설정 정리 — 백엔드 v4 전환 마무리"
```

---

## Task 13: 완료 기준 검증과 `CLAUDE.md` 갱신

**Files:**
- Modify: `CLAUDE.md`

---

- [ ] **Step 1: 완료 기준을 기계적으로 검증한다**

```bash
cd "$(git rev-parse --show-toplevel)"

echo "--- 1) 7개 도메인 모듈이 4계층 구조인가 ---"
for m in identity lotterietus generator picks results statistics simulation; do
  printf "%-14s " "$m"
  for layer in interface business context domain infra; do
    [ -d "apps/api/src/modules/$m/$layer" ] && printf "%s " "$layer"
  done
  echo
done

echo "--- 2) context가 §4.1 기준대로 존재하는가 (있어야: picks·results·simulation·statistics·lotterietus / 없어야: generator·identity) ---"
find apps/api/src/modules -maxdepth 2 -type d -name context | sort

echo "--- 3) 다른 모듈을 import하는 파일이 infra/gateway 뿐이고 그래프가 DAG인가 ---"
node apps/api/scripts/check-module-graph.mjs

echo "--- 4) Entity·ReadModel 용어가 남아 있는가 (기대: 없음) ---"
grep -rn "ReadModel\|Entity" --include="*.ts" apps/api/src packages/contract/src apps/web/src ; echo "exit=$?"

echo "--- 5) web의 api 폴더에 파일이 하나뿐인가 (기대: 1) ---"
find apps/web/src/app/api -type f | tee /dev/stderr | wc -l

echo "--- 6) 프록시에 도메인 이름이 등장하는가 (기대: 없음) ---"
grep -Ein "picks|results|statistics|simulation|generator|lotterietus|identity|draw" \
  "apps/web/src/app/api/[...path]/route.ts" ; echo "exit=$?"

echo "--- 7) 삭제 대상이 사라졌는가 (기대: 전부 없음) ---"
ls packages/core apps/worker apps/web/src/server 2>&1 | grep -c "No such file"

echo "--- 8) Facade가 DTO만 주고받는가 (수동 리뷰 대상 — 시그니처 출력) ---"
grep -rn -A2 "^\s*\(async \)\?[a-zA-Z]*(.*): Promise<" apps/api/src/modules/*/interface/*.facade.ts \
  | grep -E "Promise<" | grep -vE "Response|\{ deleted: true \}" ; echo "exit=$?"
```

Expected:
1. 7개 모듈 모두 `interface business domain`을 갖고, `context`는 5개(identity·generator 제외), `infra`는 identity·lotterietus·picks·results·statistics·simulation(generator 제외)에 있다.
2. `context` 폴더가 정확히 5개.
3. `모듈 그래프 OK — 7개 모듈, 순환 없음`
4. 출력 없음(`exit=1`).
5. `1`
6. 출력 없음(`exit=1`).
7. `3`
8. 출력 없음(`exit=1`) — Facade 반환 타입에 DTO(`*Response`) 외의 타입이 없다는 뜻이다.

- [ ] **Step 2: MVP 기능 7종을 손으로 확인한다**

```bash
docker compose up -d
pnpm --filter @fortuna-lottery/api build
(cd apps/api && node --env-file=.env dist/main.js) & API_PID=$!
sleep 8
# web만 dev로 띄운다 — `pnpm dev`(turbo)는 apps/api의 nest start도 함께 올려
# 위 인스턴스와 포트 4000이 충돌(EADDRINUSE)하고 수집 스케줄러가 중복 기동된다.
pnpm --filter web dev
```

`http://localhost:3000` 에서:
1. Hero에 최근 회차와 카운트다운 — `GET /api/lotterietus`
2. 번호 생성 3모드 — `POST /api/generator`
3. 통계 탭 8종 — `GET /api/statistics`
4. 시뮬레이션 — `POST /api/simulation`
5. 픽 저장 / 6. 픽 삭제 — `POST`/`DELETE /api/picks`
7. 결과 대조 — `GET /api/results`

그리고 **추첨 수집**: api 로그에 `[LotterietusScheduler] 사이클 완료 — … 회차` 가 부팅 직후 찍히는지 확인한다.

확인 후 `Ctrl+C`(web), `kill $API_PID`, `docker compose down`.

- [ ] **Step 3: `CLAUDE.md`를 v4 기준으로 다시 쓴다**

`## 이 저장소는 무엇인가` 절의 설계 문서 목록을 갱신한다:

```markdown
설계 문서 (v1의 제품 범위·정직성 원칙은 그대로 계승):
- `docs/superpowers/specs/2026-06-04-fortuna-lottery-design.md` — v1: 제품 개요·기능 범위·정직성 원칙 (지금도 유효)
- `docs/superpowers/specs/2026-08-08-fortuna-lottery-backend-architecture-v4-design.md` — v4: 현재 백엔드 아키텍처 (NestJS 4계층 — v2의 Next.js 위 Lean Hexagonal을 대체)
- `docs/superpowers/specs/2026-08-08-fortuna-lottery-client-architecture-v3-refinement-design.md` — v3 보정: 현재 프론트 아키텍처 (View·Presenter·Action + class ViewModel)
- `docs/superpowers/specs/2026-07-03-fortuna-lottery-architecture-v2.md` — v2 (폐기됨 — 백엔드 배치와 2-tier 엄격도는 v4가 대체)
```

`## 명령어` 절을 아래로 교체한다:

````markdown
## 명령어

```bash
pnpm install
docker compose up -d   # 로컬 Postgres
pnpm dev      # turbo dev — apps/web(next dev) + apps/api(nest start --watch)
pnpm test     # turbo test — apps/api(vitest) + apps/web(vitest, jsdom)
pnpm lint     # turbo lint — web: eslint(경계 규칙) / api: eslint + tsc + 모듈 그래프 DAG 검사 / contract: tsc
pnpm build    # turbo build
pnpm db:migrate   # apps/api의 prisma migrate dev
```

패키지 하나만 빠르게 돌릴 때:
```bash
pnpm --filter @fortuna-lottery/api test
pnpm --filter web test
```
파일 하나만: `pnpm --filter @fortuna-lottery/api exec vitest run <path>`

`apps/web`은 `API_ORIGIN`(서버 전용), `apps/api`는 `DATABASE_URL`이 필요하다 — `.env.example` 참고.
````

`## 아키텍처: Next.js 위의 Lean Hexagonal` 절 **전체**를 아래로 교체한다:

````markdown
## 아키텍처: NestJS 4계층 + Next 프록시

브라우저는 언제나 같은 오리진의 `/api/*`만 부르고, `apps/web`의 catch-all 프록시가 그대로
`apps/api`(NestJS)로 흘린다. 프록시는 바디를 파싱하지 않으므로 도메인을 알지 못한다.

```
packages/contract/src/<domain>/     DTO만 — FE·BE·모듈 경계를 넘는 유일한 타입

apps/web/src/
├─ app/page.tsx · home.presenter.ts       모듈 조립 + 셸 상태
├─ app/api/[...path]/route.ts             투명 프록시 (이 폴더의 유일한 파일)
├─ modules/<domain>/  view · action · mapper · model (+ index.ts 배럴)
└─ shared/  ui · lib(fetcher · actionState · lotto-colors)

apps/api/src/
├─ main.ts · app.module.ts
├─ shared/       순수 커널(combination · scoring · rng · result) + PrismaService
└─ modules/<domain>/
   ├─ <domain>.module.ts   컴포지션 루트 — 계약↔구현체 바인딩 (여기만 infra를 본다)
   ├─ interface/           controller · facade (· scheduler) — 모듈을 대표한다
   ├─ business/            유즈케이스 정책 — 도메인 언어로만
   ├─ context/             유즈케이스 전용 재료 조립 (1:1) + port/ (외부에 대한 자기 계약)
   ├─ domain/              model/ · repository/ · 순수 계산
   └─ infra/               persistence/(Prisma) · gateway/(다른 모듈 · 외부 API)
```

**네 계층을 가르는 시금석:** *이 코드를 도메인 전문가에게 그대로 읽어줄 수 있는가?* — 있으면
`business`, 없으면 `context`. 순수 계산이면 `domain`, 캐싱·DB·HTTP면 `infra`.

**context는 외부에서 재료를 받아올 때만 만든다.** 자기 `domain` 하나로 끝나면 만들지 않는다
(현재 있는 곳: picks 3개 · results · simulation · statistics · lotterietus/ingest-draws /
없는 곳: lotterietus/get-status · generator · identity).

**모듈 경계 = 미래의 네트워크 경계.** Facade의 입출력은 반드시 `packages/contract`의 DTO이고,
`Model` · `VO` · `*Context`는 절대 모듈 밖으로 나가지 않는다. 서비스로 분리할 때 바뀌는 파일은
`infra/gateway/*.adapter.ts` 하나와 `*.module.ts`의 바인딩 한 줄뿐이다.
````

`### 모델 타입 용어` 표의 **백엔드 행들**을 아래로 교체한다(`Entity`·`ReadModel` 행 삭제):

````markdown
| 계층 | 타입 | 파일 | 역할 |
|---|---|---|---|
| **공유** | **DTO** | `contract/<d>/*.dto.ts` | 와이어 계약. FE·BE·모듈 경계를 넘는 유일한 타입 |
| interface | **Controller · Facade** | `*.controller.ts` · `*.facade.ts` | HTTP 진입 · 모듈 공개 API |
| business | **Business** | `*.business.ts` | 유즈케이스 정책 — 도메인 언어로만 |
| context | **Context** | `*.context.ts` | 유즈케이스 전용 재료 (1:1) |
| context | **Port** | `port/*.port.ts` | 외부에 대한 계약 (`abstract class`) |
| domain | **Model** | `model/*.model.ts` | 도메인 데이터 (구 Entity · ReadModel 통합) |
| domain | **VO** | `model/*.vo.ts` | 값 객체 — 조합 검증은 `shared/combination`이 소유 |
| domain | **Repository** | `repository/*.repository.ts` | 자기 데이터 계약 (`abstract class`) |
| infra | **Adapter** | `persistence/*` · `gateway/*` | 모든 계약의 구현체 |

port·repository는 예외 없이 `abstract class`다 — Nest DI 토큰은 런타임 값이어야 하는데 TS
interface는 컴파일 후 사라진다. `abstract class`면 토큰과 타입을 한 선언으로 겸한다.
````

`### 2-tier 엄격도` 절 전체를 **삭제**한다(§4.1의 context 생성 기준이 대체한다).

`### import 경계 규칙` 절에 백엔드 규칙 5조를 추가한다:

````markdown
**백엔드(`apps/api`) — `apps/api/eslint.config.mjs` + `scripts/check-module-graph.mjs`로 강제**

1. 역방향 import 금지 — `domain → context`, `context → business`, `business → interface` …
2. 어떤 레이어도 `infra`를 직접 import하지 않는다. 예외는 `*.module.ts`(컴포지션 루트)뿐이다.
3. 다른 모듈은 `interface/**`만, 그것도 `infra/gateway/**`에서만 접근한다.
4. 같은 레이어 횡단 금지 (`business → 다른 모듈 business` 등).
5. `@prisma/client`는 `infra/persistence/**`에만.

모듈 의존 그래프는 DAG여야 하며 `pnpm --filter @fortuna-lottery/api lint`가 검사한다.
DTO는 반드시 `import type`으로 가져온다 — `packages/contract`는 TS 소스 ESM 패키지이고
`apps/api`는 CommonJS라, 값 import를 하면 런타임에 깨진다.
````

`### 영속화 규칙` 절의 마지막 문장에서 v2 참조를 v4로 바꾼다:

```markdown
구체적인 `users` / `picks` / `results` / `draws` 구조는 v4 문서 §9 도메인별 이전 매핑과
`apps/api/prisma/schema.prisma`를 참고한다.
```

`### 마이그레이션 경로 (단일 앱 → 서비스 분리)` 절 전체를 아래로 교체한다:

````markdown
### 마이그레이션 경로 (모듈 → 독립 서비스)

```
분리 전:  PicksFacadeAdapter  →  PicksFacade (인프로세스)
분리 후:  PicksHttpAdapter    →  HTTP  →  picks 서비스의 PicksController
```

`results`의 `context` · `business` · `domain`은 한 줄도 바뀌지 않는다. 바뀌는 파일은
`infra/gateway/*.adapter.ts` 하나와 `results.module.ts`의 바인딩 한 줄이다 — 경계를 넘는 타입이
이미 DTO뿐이라 직렬화 계층을 새로 만들 필요가 없다.
````

`## MVP 현황` 절을 아래로 교체한다:

````markdown
## MVP 현황

회차 데이터는 `apps/api`의 `PrismaDrawRepository`(PostgreSQL, `docker-compose.yml`로 로컬 기동)에서
읽는다 — 실제 동행복권 당첨 데이터가 회차 1부터 빈틈없이 들어 있다. 수집은 별도 프로세스가 아니라
`lotterietus` 모듈의 `LotterietusScheduler`(`@nestjs/schedule`)가 담당한다(부팅 직후 1회 + 매주
토요일 12:00 UTC). `DummyDrawRepository`는 테스트·시드용으로 남아 있지만 모듈에 등록되지 않는다.

픽은 `PickRepository` 계약 뒤의 `InMemoryPickRepository`(api 프로세스 메모리, 실제 DB 아님)에
저장된다 — Supabase로 교체해도 어댑터만 바뀌고 business·context·DTO·FE는 무수정이다.
인증은 아직 없다(게스트 전용). `IdentityProvider` port는 이미 자리를 잡아 두었으므로 Supabase Auth
도입 시 어댑터 교체와 Nest Guard 추가로 끝난다.

**운영 조건:** 프록시가 홉을 하나 추가하므로 `apps/web`과 `apps/api`는 **같은 리전에 배포**한다.
`apps/api`는 **프록시만 도달 가능한 사설망(또는 루프백)에 바인딩**한다 — 인증이 없는 쓰기 엔드포인트
(`POST`/`DELETE /picks`)가 프록시를 우회해 노출되면 헤더 허용목록 통제가 전부 무력해진다. 기본값은
`API_HOST=127.0.0.1`이고, 프록시가 다른 호스트에 있을 때만 의도적으로 넓힌다.
`DATABASE_URL`은 `apps/api`에만 배포한다 — 웹 티어는 Prisma를 쓰지 않는다(최소 권한).
**스케일아웃 선결 조건:** 수집 스케줄러가 다중 인스턴스에서 중복 실행되지 않도록 DB 어드바이저리
락이 필요하다 (지금은 단일 인스턴스 전제라 무해).
````

`## TDD` 절의 경로 예시를 갱신한다:

```markdown
구현 전에 대상 파일 옆에 `*.test.ts`를 먼저 작성한다 — 백엔드는 `apps/api/src/**`
(`domain/*.test.ts` 순수 계산 · `business/*.business.test.ts` 정책 · `context/*.context.test.ts`는
fake port 주입 · `interface/*.controller.test.ts`는 스모크 1개), 프론트는
`apps/web/src/modules/**/model/*.viewmodel.test.ts` · `mapper/*.mapper.test.ts` ·
`view/*.presenter.test.ts` 를 참고한다.
```

- [ ] **Step 4: 최종 검증과 커밋**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: 전부 통과.

```bash
git add CLAUDE.md
git commit -m "docs(CLAUDE.md): 백엔드 구조를 v4(NestJS 4계층 + Next 프록시) 기준으로 다시 씀"
```

---

## 완료 기준 체크리스트 (스펙 §13)

Task 13 Step 1의 검증 스크립트가 1~7을 기계적으로 확인한다.

- [ ] `apps/api`가 7개 도메인 모듈을 갖고 각 모듈이 `interface/business/context/domain(+infra)` 구조를 따른다 — *스크립트 1*
- [ ] §3.2의 금지 규칙 5개가 ESLint로 강제되고 위반 시 CI가 실패한다 — *Task 3*
- [ ] context가 §4.1 기준대로 5개만 존재한다 — *스크립트 2*
- [ ] 모든 Facade의 입출력이 `packages/contract`의 DTO다 (`Model`·`VO`·`*Context`가 모듈 밖으로 나가지 않는다) — *스크립트 8 + 리뷰*
- [ ] 다른 모듈을 import하는 파일이 `infra/gateway/**`로 한정된다 — *그래프 검사*
- [ ] 모듈 의존 그래프에 순환이 없다 — *그래프 검사*
- [ ] `apps/web/src/app/api/` 아래 파일이 `[...path]/route.ts` 하나뿐이고, 도메인 이름이 등장하지 않으며, 바이트 동일성 테스트가 통과한다 — *`tests/proxyOnly.test.ts`(CI 상시, Task 11에서 `skip` 해제) + `tests/proxy.test.ts`*
- [ ] `packages/core` · `apps/worker` · `apps/web/src/server/` · 빈 `countdown/`이 삭제됐다 — *스크립트 7*
- [ ] `Entity` · `ReadModel` 용어가 코드베이스에서 사라졌다 — *스크립트 4*
- [ ] `CLAUDE.md`가 갱신됐다 — *Task 13 Step 3*
- [ ] 기존 도메인 순수 함수 테스트가 로직 변경 없이 전부 통과한다 — *`pnpm test`*
- [ ] MVP 기능 7종이 전환 후 동일하게 동작한다 — *Task 13 Step 2 수동 확인*
- [ ] `pnpm test` · `pnpm lint` · `pnpm build`가 전부 통과한다 — *Task 13 Step 4*

---

## 이 계획이 남기는 후속 과제 (스펙 §12에서 기록된 것)

- **수집 스케줄러 다중 인스턴스** — 스케일아웃 시 DB 어드바이저리 락이 선결 조건이다.
- **인증** — Supabase Auth 도입 시 `interface`에 Nest Guard를 추가하고 `GuestIdentityAdapter`를 교체한다. `IdentityProvider` port를 이미 깔아 뒀으므로 `context`·`business`는 무수정이다.
- **`listAllDraws()`의 전량 전송** — 지금은 인프로세스라 무해하지만, `lotterietus`를 별도 서비스로 분리하는 시점에는 회차 전량을 HTTP로 넘기는 비용을 다시 본다(집계를 서비스 쪽으로 밀거나 캐시를 둔다). 측정 전에는 손대지 않는다.



