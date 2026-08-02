# 실제 추첨 데이터 수집 + PostgreSQL 영속화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `DummyDrawDataAdapter`(시드 고정 생성 데이터)를 동행복권 실제 추첨 데이터로 교체하고, 전용 워커 프로세스가 PostgreSQL에 수집·영속화하도록 만든다.

**Architecture:** `packages/core/src/lotterietus`에 수집 전용 포트 2개(`DrawSourcePort`·`DrawWriterPort`)와 유스케이스 `IngestDraws`를 추가한다. `IngestDraws`는 "저장된 최대 회차 → 원격 최신 회차"를 빈 구간 없이 따라잡는 catch-up 사이클 1회를 실행하는 순수 유스케이스이며, 백필과 주 1회 정기 수집이 같은 경로를 탄다. 신규 `apps/worker`는 이 유스케이스를 실어댑터로 조립해 반복 호출하는 얇은 엔트리포인트다. `apps/web`은 `container.ts` 한 줄만 바꿔 `PrismaDrawDataAdapter`로 읽는다 — 유스케이스·DTO·FE 모듈은 **한 줄도 바뀌지 않는다**.

**Tech Stack:** TypeScript(strict, `noUncheckedIndexedAccess`), Vitest, Prisma + PostgreSQL 17(docker-compose), Node 22 `fetch`, tsx(워커 TS 실행), pnpm workspaces + turbo.

---

## Global Constraints

- **설계 문서**: `docs/superpowers/specs/2026-07-31-draw-data-ingestion-design.md` — 이 계획의 근거. 아래 "스펙과 달라지는 점"에 명시한 3가지 외에는 스펙을 그대로 따른다.
- **Node 22 필수**: 이 저장소의 `pnpm`은 Node 20에서 `node:sqlite` 오류로 실행되지 않는다. 모든 명령 전에:
  ```bash
  nvm use 22 && node -v   # v22.x 확인
  ```
- **작업 디렉터리**: `/Users/rojaebl/orca/workspaces/FortunaLottery/implement` (브랜치 `implement`). 시작 시 작업 트리가 깨끗해야 한다.
- **Docker 필요**: Task 4부터 로컬 Postgres 컨테이너가 필요하다 (Docker 28.1.1 / Compose v2.35.1 확인됨).
- **커밋**: 각 Task 끝에 한 번, 관련 파일만 정확히 `git add`한다 (`git add -A` 금지).
- **변경 금지**: `apps/web/src/modules/**` 전체, `apps/web/src/app/**`, `packages/core/src/{generator,picks,results,simulation,statistics,identity,shared}/**`, `dummy-draw-data.adapter.ts`(코드는 그대로 남긴다 — 테스트/시드 용도).

### 실측으로 확정한 원격 엔드포인트 동작 (2026-08-02 직접 호출로 검증)

스펙 배경에 적힌 내용 중 **응답 형태와 창(window) 방향이 실제와 달라** 아래를 기준으로 구현한다.

```
GET https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd={R}
Headers: Referer: https://www.dhlottery.co.kr/lt645/result
         X-Requested-With: XMLHttpRequest
```

| 항목 | 실측 결과 |
|---|---|
| 응답 봉투 | `{"resultCode":null,"resultMessage":null,"data":{"list":[ ... ]}}` — **최상위가 배열이 아니다** |
| 정렬 | `data.list`는 **내림차순**(최신 회차가 배열 첫 원소) |
| 창 범위 | 요청 회차 R에 대해 **`[R-5, R+4]`** — 즉 요청 회차보다 **위쪽 4개**가 함께 온다 |
| 하한 클램프 | `R=1`, `R=3` 모두 `[1..10]` 반환 (창을 위로 밀어 항상 10개) |
| 상한 클램프 | 최신이 1235일 때 `R=1235` → `[1226..1235]` (창을 아래로 당겨 항상 10개) |
| 미래 회차 | `R=1236`, `R=9999` → `data.list: []` (빈 배열, 자동 보정 없음) |
| 사용 필드 | `ltEpsd`(회차), `tm1WnNo`~`tm6WnNo`(번호), `bnsWnNo`(보너스), `ltRflYmd`(추첨일 `"20260801"` 형식) |
| 현재 최신 회차 | **1235회 / `ltRflYmd` = `20260801`** (2026-08-02 기준) |

### 스펙과 달라지는 점 (3가지) — 반드시 이 계획을 따른다

**1. 점프 목표를 `maxRound + 10` → `maxRound + 6`으로 바꾸고, 연속성 검사를 추가한다 (구멍 방지 — 중요)**

스펙 §4의 루프는 `fetchBatch(maxRound + step)`(step=10)으로 시작한다. 창이 `[R-5, R+4]`이므로 빈 DB에서 `fetchBatch(10)`을 호출하면 **`[5..14]`가 돌아오고, "maxRound보다 큰 회차를 모두 저장"하면 1~4회차가 영구히 누락된다.** 창 방향이 실측으로 밝혀졌으므로 다음 두 가지로 고친다:

- 점프 목표를 `maxRound + 6`으로 둔다 → 창의 아래쪽 끝이 정확히 `maxRound + 1`이 되어 **매 요청마다 신규 10회차를 빈틈없이** 가져온다 (백필 요청 수는 스펙 추정치와 동일한 ~124회).
- 저장 직전에 **연속성 검사**를 한다: 가져온 신규 회차의 최솟값이 `maxRound + 1`이 아니면(=구멍) 저장하지 않고 점프 폭을 줄여 재시도한다. 이 검사 덕분에 원격이 나중에 창 방식을 바꿔도(예: `[R, R+9]`로 변경) 구멍 없이 수렴한다 — 스펙이 의도했던 "원격 동작 변화에 안전" 성질이 실제로 보장된다. Task 3의 마지막 테스트가 이 성질을 검증한다.

**2. `drawnAt` 변환 규칙을 도메인에 명시한다**

원격은 날짜만(`"20260801"`) 주고, DB 컬럼은 `@db.Date`(시각 없음)인데 `Draw.drawnAt`은 ISO 문자열이다. 왕복(원격→DB→앱) 시 값이 흔들리지 않도록, **추첨일 → "그 날짜의 정식 추첨 시각(20:35 KST = 11:35 UTC)" ISO**로 변환하는 순수 함수를 도메인에 두고 쓰기·읽기 어댑터가 함께 쓴다 (Task 1). 이 11:35 UTC 규칙은 기존 `DummyDrawDataAdapter`·`schedule.ts`가 이미 쓰는 값과 동일하므로 통계/백테스트 결과가 기존과 어긋나지 않는다.

**3. `@prisma/client`는 `packages/core`만 의존한다**

스펙 §6은 `apps/worker`가 core의 infrastructure를 import한다고만 적었다. pnpm 워크스페이스에서 생성된 Prisma 클라이언트는 `packages/core/node_modules/.prisma/client`에 놓이므로, **앱이 `@prisma/client`를 직접 import하면 런타임에 클라이언트를 못 찾는다.** 따라서 core가 `createPrismaClient()`를 export하고 앱들은 그것만 쓴다 — 앱 `package.json`에 `@prisma/client`를 넣지 않는다. 헥사고날 원칙에도 더 맞는다(Prisma는 core 인프라의 세부사항).

### 최종 파일 구조 (이 계획이 만드는/고치는 파일)

```
packages/core/
├─ prisma/schema.prisma                                     [신규] Draw 모델 1개
├─ package.json                                             [수정] prisma 의존성 + 스크립트
├─ tsconfig.json                                            [수정] types에 "node" 추가
└─ src/lotterietus/
   ├─ domain/
   │  ├─ schedule.ts                                        [수정] 추첨 시각 상수 export
   │  ├─ drawn-at.ts            [신규] 추첨일 → ISO 변환 (순수)
   │  ├─ drawn-at.test.ts       [신규]
   │  └─ index.ts                                           [수정] drawn-at re-export
   ├─ application/
   │  ├─ ports/draw-source.port.ts   [신규] 원격 조회 포트
   │  ├─ ports/draw-writer.port.ts   [신규] 영속화 포트
   │  ├─ usecases/ingest-draws.ts    [신규] catch-up 사이클 1회
   │  ├─ usecases/ingest-draws.test.ts [신규]
   │  └─ index.ts                                           [수정] 포트·유스케이스 export
   └─ infrastructure/
      ├─ prisma-client.ts                    [신규] PrismaClient 생성 (core 전용 진입점)
      ├─ adapters/dhlottery-draw-source.adapter.ts [신규] 원격 HTTP
      ├─ adapters/prisma-draw-writer.adapter.ts    [신규] 쓰기
      ├─ adapters/prisma-draw-data.adapter.ts      [신규] 읽기 (DrawDataPort 구현)
      └─ index.ts                                          [수정] 신규 3종 + client export

apps/worker/                    [신규 앱] package.json · tsconfig.json · src/main.ts
apps/web/
├─ next.config.ts                                          [수정] serverExternalPackages
└─ src/server/container.ts                                 [수정] Dummy → Prisma 어댑터

레포 루트: docker-compose.yml [신규] · .env.example [신규]
(로컬 전용, git 추적 안 됨: packages/core/.env · apps/web/.env.local · apps/worker/.env)
```

---

### Task 0: 환경 준비 + 베이스라인 확인

변경 전 상태가 통과하는지 먼저 확인해야, 이후 실패가 내 변경 때문인지 판별할 수 있다.

**Files:** 없음 (커밋 없음)

- [ ] **Step 1: Node 22 + 작업 트리 확인**

```bash
nvm use 22
node -v
git branch --show-current
git status --short
```
Expected: `v22.x` / `implement` / `git status --short` 출력 없음(깨끗함)

- [ ] **Step 2: 의존성 설치**

```bash
pnpm install
```
Expected: 설치 완료, 에러 없음

- [ ] **Step 3: 베이스라인 lint**

```bash
pnpm lint
```
Expected: `@fortuna-lottery/web`(eslint) + `@fortuna-lottery/core`(tsc --noEmit) 모두 성공

- [ ] **Step 4: 베이스라인 테스트**

```bash
pnpm test
```
Expected: `@fortuna-lottery/core` **10 files / 46 tests passed**, `@fortuna-lottery/web` 3 files / 10 tests passed, 실패 0

- [ ] **Step 5: Docker 확인**

```bash
docker compose version
docker ps
```
Expected: Compose 버전 출력, `docker ps`가 에러 없이 실행됨(Docker 데몬 기동 중)

> Step 3~5 중 하나라도 실패하면 **여기서 멈추고 사용자에게 보고한다.**

---

### Task 1: 추첨일 → ISO 변환 도메인 헬퍼 (TDD)

원격은 `"20260801"`, DB는 `date` 컬럼, 앱은 ISO 문자열을 쓴다. 세 표현 사이 변환을 한 곳에 모아 왕복 손실을 없앤다. 순수 함수이므로 TDD로 먼저 테스트를 쓴다.

**Files:**
- Modify: `packages/core/src/lotterietus/domain/schedule.ts` (상수 2개 `export`로 변경)
- Create: `packages/core/src/lotterietus/domain/drawn-at.ts`
- Create: `packages/core/src/lotterietus/domain/drawn-at.test.ts`
- Modify: `packages/core/src/lotterietus/domain/index.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`packages/core/src/lotterietus/domain/drawn-at.test.ts` 신규 작성:

```ts
import { describe, expect, it } from "vitest";
import { drawnAtFromDate, drawnAtFromYmd } from "./drawn-at";

describe("drawnAtFromYmd (동행복권 추첨일 → ISO)", () => {
  it("YYYYMMDD를 그 날짜의 정식 추첨 시각(11:35 UTC = 20:35 KST) ISO로 바꾼다", () => {
    expect(drawnAtFromYmd("20260801")).toBe("2026-08-01T11:35:00.000Z");
  });

  it("1회차 추첨일(2002-12-07)도 같은 규칙으로 변환한다", () => {
    expect(drawnAtFromYmd("20021207")).toBe("2002-12-07T11:35:00.000Z");
  });

  it("8자리 숫자가 아니면 에러를 던진다", () => {
    expect(() => drawnAtFromYmd("2026-08-01")).toThrow();
    expect(() => drawnAtFromYmd("")).toThrow();
  });
});

describe("drawnAtFromDate (DB date 컬럼 → ISO)", () => {
  it("자정 UTC Date를 같은 날짜의 추첨 시각 ISO로 바꾼다", () => {
    expect(drawnAtFromDate(new Date("2026-08-01T00:00:00.000Z"))).toBe(
      "2026-08-01T11:35:00.000Z",
    );
  });

  it("원격 → DB → 앱 왕복에서 값이 변하지 않는다", () => {
    const fromRemote = drawnAtFromYmd("20260801");
    // Prisma의 @db.Date는 날짜만 저장하므로 읽을 때 자정 UTC로 돌아온다
    const fromDb = new Date("2026-08-01T00:00:00.000Z");
    expect(drawnAtFromDate(fromDb)).toBe(fromRemote);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm --filter @fortuna-lottery/core exec vitest run src/lotterietus/domain/drawn-at.test.ts
```
Expected: FAIL — `Failed to resolve import "./drawn-at"`

- [ ] **Step 3: `schedule.ts`의 추첨 시각 상수를 export로 바꾼다**

`packages/core/src/lotterietus/domain/schedule.ts`의 첫 3줄 중 앞 2줄을 다음처럼 고친다 (`SATURDAY`는 그대로 둔다):

```ts
/** 추첨 스케줄 — 매주 토요일 20:35 KST (= 11:35 UTC) */
export const DRAW_UTC_HOUR = 11;
export const DRAW_UTC_MINUTE = 35;
const SATURDAY = 6;
```

- [ ] **Step 4: 최소 구현 작성**

`packages/core/src/lotterietus/domain/drawn-at.ts` 신규 작성:

```ts
import { DRAW_UTC_HOUR, DRAW_UTC_MINUTE } from "./schedule";

/** UTC 연·월·일에 정식 추첨 시각을 붙여 ISO 문자열로 만든다 */
function atDrawTime(year: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex, day, DRAW_UTC_HOUR, DRAW_UTC_MINUTE)).toISOString();
}

/**
 * 동행복권 `ltRflYmd`("20260801") → `Draw.drawnAt` ISO 문자열.
 * 원격은 날짜만 주므로 그 날짜의 정식 추첨 시각(20:35 KST)을 붙인다.
 */
export function drawnAtFromYmd(ymd: string): string {
  if (!/^\d{8}$/.test(ymd)) {
    throw new Error(`추첨일 형식이 올바르지 않습니다 (YYYYMMDD 필요): ${ymd}`);
  }
  return atDrawTime(
    Number(ymd.slice(0, 4)),
    Number(ymd.slice(4, 6)) - 1,
    Number(ymd.slice(6, 8)),
  );
}

/**
 * DB `date` 컬럼에서 읽은 Date(자정 UTC) → `Draw.drawnAt` ISO 문자열.
 * drawnAtFromYmd와 같은 규칙을 쓰므로 원격 → DB → 앱 왕복에서 값이 변하지 않는다.
 */
export function drawnAtFromDate(date: Date): string {
  return atDrawTime(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
pnpm --filter @fortuna-lottery/core exec vitest run src/lotterietus/domain/drawn-at.test.ts
```
Expected: PASS — 5 tests passed

- [ ] **Step 6: 도메인 배럴에 추가**

`packages/core/src/lotterietus/domain/index.ts` 전체를 다음으로 교체:

```ts
export * from "./draw";
export * from "./drawn-at";
export * from "./schedule";
```

- [ ] **Step 7: 전체 테스트 + 타입체크**

```bash
pnpm --filter @fortuna-lottery/core test
pnpm --filter @fortuna-lottery/core lint
```
Expected: **11 files / 51 tests passed** (46 + 5), lint 출력 없이 성공

- [ ] **Step 8: 커밋**

```bash
git add packages/core/src/lotterietus/domain/drawn-at.ts \
        packages/core/src/lotterietus/domain/drawn-at.test.ts \
        packages/core/src/lotterietus/domain/schedule.ts \
        packages/core/src/lotterietus/domain/index.ts
git commit -m "feat(core): 추첨일 → ISO 변환 도메인 헬퍼 추가 (원격/DB/앱 표현 통일)"
```

---

### Task 2: 수집 전용 포트 2개 신설

기존 `DrawDataPort`(읽기)는 시그니처를 바꾸지 않는다. 인터페이스만 추가하므로 독립적으로 컴파일되고 커밋 가능하다.

**Files:**
- Create: `packages/core/src/lotterietus/application/ports/draw-source.port.ts`
- Create: `packages/core/src/lotterietus/application/ports/draw-writer.port.ts`
- Modify: `packages/core/src/lotterietus/application/index.ts`

- [ ] **Step 1: `draw-source.port.ts` 작성**

```ts
import type { Draw } from "../../domain/draw";

/**
 * 원격 추첨 결과 조회 포트 — 수집(워커) 전용.
 *
 * 구현체는 지정한 회차 근방의 회차 묶음을 반환한다. 반환 순서는 보장하지 않으며
 * (유스케이스가 정렬한다), 요청한 회차가 **아직 존재하지 않으면 빈 배열**을 반환해야 한다.
 * 이 "빈 배열" 규약이 IngestDraws의 종료 조건이다.
 */
export interface DrawSourcePort {
  fetchBatch(centerRound: number): Promise<readonly Draw[]>;
}
```

- [ ] **Step 2: `draw-writer.port.ts` 작성**

```ts
import type { Draw } from "../../domain/draw";

/** 추첨 결과 영속화 포트 — 수집(워커) 전용 */
export interface DrawWriterPort {
  /** 저장된 최대 회차. 저장된 것이 없으면 0 */
  getMaxRound(): Promise<number>;
  /** 회차 기준 멱등 저장 — 이미 있는 회차는 갱신한다 */
  upsertDraws(draws: readonly Draw[]): Promise<void>;
}
```

- [ ] **Step 3: application 배럴에 추가**

`packages/core/src/lotterietus/application/index.ts` 전체를 다음으로 교체:

```ts
export * from "./ports/draw-data.port";
export * from "./ports/draw-source.port";
export * from "./ports/draw-writer.port";
export * from "./usecases/get-lotterietus-status";
```

- [ ] **Step 4: 타입체크**

```bash
pnpm --filter @fortuna-lottery/core lint
```
Expected: 출력 없이 성공

- [ ] **Step 5: 커밋**

```bash
git add packages/core/src/lotterietus/application/ports/draw-source.port.ts \
        packages/core/src/lotterietus/application/ports/draw-writer.port.ts \
        packages/core/src/lotterietus/application/index.ts
git commit -m "feat(core): 수집 전용 포트(DrawSourcePort·DrawWriterPort) 신설"
```

---

### Task 3: `IngestDraws` 유스케이스 (TDD)

이 계획의 핵심. 실네트워크·실DB 없이 Fake 포트만으로 전부 검증한다. **테스트를 먼저 쓴다.**

Fake 원격은 실측한 동작(`[R-5, R+4]` 창, 내림차순, 양끝 클램프, 미래 회차는 빈 배열)을 그대로 흉내내므로, 테스트가 통과하면 실제 엔드포인트에서도 동일하게 동작한다.

**Files:**
- Create: `packages/core/src/lotterietus/application/usecases/ingest-draws.test.ts`
- Create: `packages/core/src/lotterietus/application/usecases/ingest-draws.ts`
- Modify: `packages/core/src/lotterietus/application/index.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`packages/core/src/lotterietus/application/usecases/ingest-draws.test.ts` 신규 작성:

```ts
import { describe, expect, it, vi } from "vitest";
import type { Draw } from "../../domain/draw";
import type { DrawSourcePort } from "../ports/draw-source.port";
import type { DrawWriterPort } from "../ports/draw-writer.port";
import { makeIngestDraws } from "./ingest-draws";

const makeDraw = (round: number): Draw => ({
  round,
  numbers: [1, 2, 3, 4, 5, 6],
  bonus: 7,
  drawnAt: "2026-08-01T11:35:00.000Z",
});

/**
 * 동행복권 실동작 Fake — 요청 회차 R에 대해 [R-5, R+4] 창을 내림차순으로 반환하고,
 * 양 끝에서는 창을 밀어 항상 10개를 채운다. R이 아직 없는 회차면 빈 배열.
 * (2026-08-02 실측 동작)
 */
const fakeSource = (latest: number) => {
  const calls: number[] = [];
  const port: DrawSourcePort = {
    async fetchBatch(centerRound) {
      calls.push(centerRound);
      if (centerRound > latest || centerRound < 1) return [];
      const end = Math.min(centerRound + 4, latest);
      const start = Math.max(1, end - 9);
      const windowEnd = Math.min(latest, start + 9);
      const rows: Draw[] = [];
      for (let round = windowEnd; round >= start; round -= 1) rows.push(makeDraw(round));
      return rows;
    },
  };
  return { port, calls };
};

/** 창이 [R, R+9](위쪽으로만)인 가상의 원격 — 원격 동작이 바뀌어도 구멍이 없는지 검증용 */
const forwardWindowSource = (latest: number) => {
  const calls: number[] = [];
  const port: DrawSourcePort = {
    async fetchBatch(centerRound) {
      calls.push(centerRound);
      if (centerRound > latest || centerRound < 1) return [];
      const rows: Draw[] = [];
      for (let round = centerRound; round <= Math.min(centerRound + 9, latest); round += 1) {
        rows.push(makeDraw(round));
      }
      return rows;
    },
  };
  return { port, calls };
};

const fakeWriter = (initialMax = 0) => {
  const saved: number[] = [];
  let max = initialMax;
  const port: DrawWriterPort = {
    async getMaxRound() {
      return max;
    },
    async upsertDraws(draws) {
      for (const draw of draws) saved.push(draw.round);
      max = Math.max(max, ...draws.map((draw) => draw.round));
    },
  };
  return { port, saved };
};

const noSleep = async () => {};

describe("ingestDraws (수집 catch-up 사이클)", () => {
  it("빈 DB에서 1회차부터 최신 회차까지 빠짐없이 저장한다", async () => {
    const source = fakeSource(12);
    const writer = fakeWriter(0);
    const ingest = makeIngestDraws({ source: source.port, writer: writer.port, sleep: noSleep });

    const result = await ingest();

    expect(writer.saved).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(result.startRound).toBe(0);
    expect(result.latestRound).toBe(12);
    expect(result.ingestedCount).toBe(12);
  });

  it("이미 저장된 회차 다음부터 이어서 수집한다 (중단 후 재개)", async () => {
    const source = fakeSource(12);
    const writer = fakeWriter(10);
    const ingest = makeIngestDraws({ source: source.port, writer: writer.port, sleep: noSleep });

    const result = await ingest();

    expect(writer.saved).toEqual([11, 12]);
    expect(result.startRound).toBe(10);
    expect(result.latestRound).toBe(12);
  });

  it("이미 최신이면 아무것도 저장하지 않고 점프 폭을 줄이다 종료한다", async () => {
    const source = fakeSource(12);
    const writer = fakeWriter(12);
    const ingest = makeIngestDraws({ source: source.port, writer: writer.port, sleep: noSleep });

    const result = await ingest();

    expect(writer.saved).toEqual([]);
    expect(result.ingestedCount).toBe(0);
    // 6 → 3 → 1로 좁히며 "다음 회차 없음"을 확정한다
    expect(source.calls).toEqual([18, 15, 13]);
  });

  it("배치에 성공하면 점프 폭이 다시 최대로 리셋된다", async () => {
    const source = fakeSource(30);
    const writer = fakeWriter(0);
    const ingest = makeIngestDraws({ source: source.port, writer: writer.port, sleep: noSleep });

    await ingest();

    // 매번 10회차씩 전진 — 성공 후 폭이 줄어든 채로 남지 않는다
    expect(source.calls.slice(0, 3)).toEqual([6, 16, 26]);
  });

  it("요청 사이마다 지정한 지연만큼 대기한다 (종료 직전에는 대기하지 않음)", async () => {
    const sleep = vi.fn(async () => {});
    const source = fakeSource(12);
    const writer = fakeWriter(12);
    const ingest = makeIngestDraws({
      source: source.port,
      writer: writer.port,
      sleep,
      requestDelayMs: 1500,
    });

    await ingest();

    expect(source.calls).toHaveLength(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(1500);
  });

  it("응답 창이 저장분과 이어지지 않으면 저장하지 않고 폭을 줄인다 (구멍 방지)", async () => {
    // 원격이 [R, R+9] 창으로 바뀐 상황 — 순진하게 저장하면 앞쪽 회차가 통째로 빈다
    const source = forwardWindowSource(20);
    const writer = fakeWriter(0);
    const ingest = makeIngestDraws({ source: source.port, writer: writer.port, sleep: noSleep });

    const result = await ingest();

    expect(writer.saved).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(result.latestRound).toBe(20);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm --filter @fortuna-lottery/core exec vitest run src/lotterietus/application/usecases/ingest-draws.test.ts
```
Expected: FAIL — `Failed to resolve import "./ingest-draws"`

- [ ] **Step 3: 구현 작성**

`packages/core/src/lotterietus/application/usecases/ingest-draws.ts` 신규 작성:

```ts
import type { DrawSourcePort } from "../ports/draw-source.port";
import type { DrawWriterPort } from "../ports/draw-writer.port";

/**
 * 한 번에 앞서가 볼 폭.
 * 원격 창이 [R-5, R+4]이므로 maxRound + 6을 요청하면 창의 아래쪽 끝이 정확히
 * maxRound + 1이 되어, 한 요청당 신규 10회차를 빈틈없이 가져온다.
 */
const PROBE_AHEAD = 6;

export interface IngestDrawsDeps {
  source: DrawSourcePort;
  writer: DrawWriterPort;
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
export const makeIngestDraws =
  ({
    source,
    writer,
    sleep = defaultSleep,
    requestDelayMs = 1000,
    logger = () => {},
  }: IngestDrawsDeps) =>
  async (): Promise<IngestDrawsResult> => {
    const startRound = await writer.getMaxRound();
    let maxRound = startRound;
    let step = PROBE_AHEAD;
    let ingestedCount = 0;
    let requestCount = 0;

    for (;;) {
      const batch = await source.fetchBatch(maxRound + step);
      requestCount += 1;

      const fresh = [...batch]
        .filter((draw) => draw.round > maxRound)
        .sort((a, b) => a.round - b.round);
      const first = fresh[0];
      const last = fresh[fresh.length - 1];

      if (first !== undefined && last !== undefined && first.round === maxRound + 1) {
        // 저장분과 이어지는 구간만 저장한다 — 창이 앞서가 생긴 구멍을 절대 남기지 않는다
        await writer.upsertDraws(fresh);
        ingestedCount += fresh.length;
        maxRound = last.round;
        step = PROBE_AHEAD;
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
  };
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm --filter @fortuna-lottery/core exec vitest run src/lotterietus/application/usecases/ingest-draws.test.ts
```
Expected: PASS — 6 tests passed

- [ ] **Step 5: application 배럴에 유스케이스 추가**

`packages/core/src/lotterietus/application/index.ts` 전체를 다음으로 교체:

```ts
export * from "./ports/draw-data.port";
export * from "./ports/draw-source.port";
export * from "./ports/draw-writer.port";
export * from "./usecases/get-lotterietus-status";
export * from "./usecases/ingest-draws";
```

- [ ] **Step 6: 전체 테스트 + 타입체크**

```bash
pnpm --filter @fortuna-lottery/core test
pnpm --filter @fortuna-lottery/core lint
```
Expected: **12 files / 57 tests passed** (51 + 6), lint 출력 없이 성공

- [ ] **Step 7: 커밋**

```bash
git add packages/core/src/lotterietus/application/usecases/ingest-draws.ts \
        packages/core/src/lotterietus/application/usecases/ingest-draws.test.ts \
        packages/core/src/lotterietus/application/index.ts
git commit -m "feat(core): IngestDraws 유스케이스 추가 — 구멍 없는 catch-up 수집 사이클"
```

---

### Task 4: PostgreSQL + Prisma 셋업

컨테이너를 띄우고 스키마를 마이그레이션한다. 아직 어댑터 코드는 없다 — DB와 생성된 클라이언트만 준비한다.

**Files:**
- Create: `docker-compose.yml` (레포 루트)
- Create: `.env.example` (레포 루트)
- Create: `packages/core/prisma/schema.prisma`
- Modify: `packages/core/package.json`
- Modify: `packages/core/tsconfig.json`

- [ ] **Step 1: `docker-compose.yml` 작성 (레포 루트)**

```yaml
# 로컬 개발 전용 Postgres — 앱/워커는 컨테이너 밖에서 pnpm으로 실행한다
services:
  postgres:
    image: postgres:17-alpine
    container_name: fortuna-lottery-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: fortuna
      POSTGRES_PASSWORD: fortuna_local
      POSTGRES_DB: fortuna_lottery
    ports:
      - "5432:5432"
    volumes:
      - fortuna-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fortuna -d fortuna_lottery"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  fortuna-pgdata:
```

- [ ] **Step 2: `.env.example` 작성 (레포 루트)**

```bash
# 로컬 Postgres (docker-compose.yml의 자격증명과 일치해야 한다)
# 이 값을 그대로 packages/core/.env, apps/web/.env.local, apps/worker/.env 에 넣는다
DATABASE_URL="postgresql://fortuna:fortuna_local@localhost:5432/fortuna_lottery?schema=public"
```

> `.gitignore`는 손대지 않는다 — 기존 `node_modules/`(Prisma 생성 클라이언트 위치)와 `.env` / `.env.*`(로컬 자격증명) 규칙이 이미 필요한 것을 모두 덮는다. 반대로 `prisma/migrations/`는 **커밋해야 하므로** 무시 규칙을 추가하지 않는다.

- [ ] **Step 3: Prisma 스키마 작성**

`packages/core/prisma/schema.prisma` 신규 작성 (v2 아키텍처 문서 §5에서 합의된 `draws` 구조):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

/// 한 회차 추첨 결과 — 사용자와 완전히 무관 (DrawDataPort로만 공급)
model Draw {
  round   Int      @id
  n1      Int
  n2      Int
  n3      Int
  n4      Int
  n5      Int
  n6      Int
  bonus   Int
  drawnAt DateTime @map("drawn_at") @db.Date

  @@map("draws")
}
```

- [ ] **Step 4: 의존성 설치**

`fetch`/`AbortSignal.timeout` 타입 때문에 `@types/node`도 함께 넣는다 (core의 tsconfig `types`가 명시 목록이라 자동 포함되지 않는다).

```bash
pnpm --filter @fortuna-lottery/core add @prisma/client
pnpm --filter @fortuna-lottery/core add -D prisma @types/node
```
Expected: 설치 완료. `packages/core/package.json`의 `dependencies`에 `@prisma/client`, `devDependencies`에 `prisma`·`@types/node`가 추가됨

- [ ] **Step 5: `packages/core/package.json`에 스크립트 추가**

`"scripts"` 블록 전체를 다음으로 교체한다. `postinstall`은 설치 직후 Prisma 클라이언트를 생성해 `tsc --noEmit`이 항상 성공하게 만든다:

```json
  "scripts": {
    "postinstall": "prisma generate",
    "test": "vitest run",
    "lint": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev"
  },
```

- [ ] **Step 6: `packages/core/tsconfig.json`의 types에 node 추가**

`"types"` 줄을 다음으로 교체:

```json
    "types": ["vitest/globals", "node"],
```

- [ ] **Step 7: 로컬 env 파일 생성 (git에 커밋되지 않음)**

```bash
cp .env.example packages/core/.env
cp .env.example apps/web/.env.local
```
Expected: 두 파일 생성. `.gitignore`의 `.env` / `.env.*` 규칙으로 추적되지 않는다.
`packages/core/.env`는 Prisma CLI가(`migrate`/`generate` 실행 시 cwd 기준으로) 자동으로 읽고, `apps/web/.env.local`은 Next.js가 자동으로 읽는다.

- [ ] **Step 8: Postgres 기동**

```bash
docker compose up -d
docker compose ps
```
Expected: `fortuna-lottery-db`가 `running (healthy)` 상태 (healthy까지 10~20초 걸릴 수 있다 — `healthy`가 될 때까지 `docker compose ps`를 다시 실행한다)

- [ ] **Step 9: 마이그레이션 실행 + 클라이언트 생성**

```bash
pnpm --filter @fortuna-lottery/core exec prisma migrate dev --name init_draws
```
Expected: `packages/core/prisma/migrations/<timestamp>_init_draws/migration.sql` 생성, `Your database is now in sync with your schema.`, 이어서 `Generated Prisma Client` 메시지

- [ ] **Step 10: 테이블 생성 확인**

```bash
docker compose exec -T postgres psql -U fortuna -d fortuna_lottery -c "\d draws"
```
Expected: `round`(integer, PK), `n1`~`n6`, `bonus`, `drawn_at`(date) 컬럼이 있는 테이블 정의 출력

- [ ] **Step 11: 타입체크**

```bash
pnpm --filter @fortuna-lottery/core lint
```
Expected: 출력 없이 성공

- [ ] **Step 12: 커밋**

마이그레이션 파일(`packages/core/prisma/migrations/**`)도 함께 커밋한다 — 다른 환경에서 같은 스키마를 재현하는 근거다.

```bash
git add docker-compose.yml .env.example \
        packages/core/prisma packages/core/package.json packages/core/tsconfig.json \
        pnpm-lock.yaml
git commit -m "feat: PostgreSQL(docker-compose) + Prisma 스키마·마이그레이션 셋업"
```

---

### Task 5: `DhlotteryDrawSourceAdapter` (원격 조회)

실네트워크에 의존하므로 단위 테스트 대상이 아니다 (스펙 §7). 타입체크로 검증하고, 실제 동작은 Task 9의 통합 검증에서 확인한다.

**Files:**
- Create: `packages/core/src/lotterietus/infrastructure/adapters/dhlottery-draw-source.adapter.ts`

- [ ] **Step 1: 어댑터 작성**

```ts
import type { DrawSourcePort } from "../../application/ports/draw-source.port";
import type { Draw } from "../../domain/draw";
import { drawnAtFromYmd } from "../../domain/drawn-at";

const ENDPOINT = "https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do";
const RESULT_PAGE = "https://www.dhlottery.co.kr/lt645/result";

/** 응답 1행 — 실제로 쓰는 필드만 선언한다 (당첨금·등수 등 나머지는 무시) */
interface DhlotteryRow {
  ltEpsd: number;
  tm1WnNo: number;
  tm2WnNo: number;
  tm3WnNo: number;
  tm4WnNo: number;
  tm5WnNo: number;
  tm6WnNo: number;
  bnsWnNo: number;
  /** 추첨일 "YYYYMMDD" */
  ltRflYmd: string;
}

interface DhlotteryResponse {
  data?: { list?: DhlotteryRow[] | null } | null;
}

export interface DhlotteryDrawSourceOptions {
  /** 요청 타임아웃 (ms) */
  timeoutMs?: number;
}

function toDraw(row: DhlotteryRow): Draw {
  const numbers = [
    row.tm1WnNo,
    row.tm2WnNo,
    row.tm3WnNo,
    row.tm4WnNo,
    row.tm5WnNo,
    row.tm6WnNo,
  ].sort((a, b) => a - b);
  return {
    round: row.ltEpsd,
    numbers: Object.freeze(numbers),
    bonus: row.bnsWnNo,
    drawnAt: drawnAtFromYmd(row.ltRflYmd),
  };
}

/**
 * 동행복권 비공식 엔드포인트 어댑터.
 *
 * 요청 회차 R 기준 [R-5, R+4] 창을 내림차순으로 돌려주며, 양 끝에서는 창을 밀어 항상 10개를
 * 채운다. R이 아직 없는 회차면 빈 목록을 준다 (IngestDraws의 종료 조건).
 * 공식 API가 아니므로 호출 간격(IngestDraws의 requestDelayMs)을 반드시 둔다.
 */
export function createDhlotteryDrawSourceAdapter(
  options: DhlotteryDrawSourceOptions = {},
): DrawSourcePort {
  const { timeoutMs = 10_000 } = options;

  return {
    async fetchBatch(centerRound) {
      const response = await fetch(`${ENDPOINT}?srchDir=center&srchLtEpsd=${centerRound}`, {
        headers: {
          Referer: RESULT_PAGE,
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`동행복권 응답 실패 (${centerRound}회차 요청): HTTP ${response.status}`);
      }

      const payload = (await response.json()) as DhlotteryResponse;
      const list = payload.data?.list;
      return Array.isArray(list) ? list.map(toDraw) : [];
    },
  };
}
```

- [ ] **Step 2: 타입체크**

```bash
pnpm --filter @fortuna-lottery/core lint
```
Expected: 출력 없이 성공 (`fetch`·`AbortSignal.timeout`이 Task 4에서 추가한 `@types/node`로 해석된다)

- [ ] **Step 3: 커밋**

```bash
git add packages/core/src/lotterietus/infrastructure/adapters/dhlottery-draw-source.adapter.ts
git commit -m "feat(core): 동행복권 원격 조회 어댑터(DhlotteryDrawSourceAdapter) 추가"
```

---

### Task 6: Prisma 어댑터 3종 (클라이언트 · 쓰기 · 읽기)

`@prisma/client`는 `packages/core`만 import한다 (Global Constraints의 "스펙과 달라지는 점 3"). 앱은 여기서 export하는 `createPrismaClient()`만 쓴다.

**Files:**
- Create: `packages/core/src/lotterietus/infrastructure/prisma-client.ts`
- Create: `packages/core/src/lotterietus/infrastructure/adapters/prisma-draw-writer.adapter.ts`
- Create: `packages/core/src/lotterietus/infrastructure/adapters/prisma-draw-data.adapter.ts`
- Modify: `packages/core/src/lotterietus/infrastructure/index.ts`

- [ ] **Step 1: `prisma-client.ts` 작성**

```ts
import { PrismaClient } from "@prisma/client";

export type { PrismaClient };

/**
 * PrismaClient 생성 — 앱(웹/워커)이 Prisma에 직접 의존하지 않도록 core가 유일한 진입점을 제공한다.
 * 생성된 클라이언트는 packages/core/node_modules 아래에 있으므로 core에서만 해석된다.
 * 호출한 쪽이 수명(필요 시 `$disconnect()`)을 책임진다.
 */
export function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}
```

- [ ] **Step 2: 쓰기 어댑터 작성**

`packages/core/src/lotterietus/infrastructure/adapters/prisma-draw-writer.adapter.ts`:

```ts
import type { PrismaClient } from "@prisma/client";
import type { DrawWriterPort } from "../../application/ports/draw-writer.port";
import type { Draw } from "../../domain/draw";

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
export function createPrismaDrawWriterAdapter(prisma: PrismaClient): DrawWriterPort {
  return {
    async getMaxRound() {
      const { _max } = await prisma.draw.aggregate({ _max: { round: true } });
      return _max.round ?? 0;
    },

    async upsertDraws(draws) {
      if (draws.length === 0) return;
      const rows = draws.map(toRow);
      await prisma.$transaction(
        rows.map((row) =>
          prisma.draw.upsert({ where: { round: row.round }, create: row, update: row }),
        ),
      );
    },
  };
}
```

- [ ] **Step 3: 읽기 어댑터 작성**

`packages/core/src/lotterietus/infrastructure/adapters/prisma-draw-data.adapter.ts`:

```ts
import type { PrismaClient } from "@prisma/client";
import type { DrawDataPort } from "../../application/ports/draw-data.port";
import type { Draw } from "../../domain/draw";
import { drawnAtFromDate } from "../../domain/drawn-at";

/**
 * draws 테이블 읽기 어댑터 — DummyDrawDataAdapter를 대체한다.
 * DrawDataPort 규약대로 회차 오름차순으로 반환한다 (마지막 원소 = 최신 회차).
 */
export function createPrismaDrawDataAdapter(prisma: PrismaClient): DrawDataPort {
  return {
    async getAllDraws() {
      const rows = await prisma.draw.findMany({ orderBy: { round: "asc" } });
      return rows.map(
        (row): Draw => ({
          round: row.round,
          numbers: Object.freeze([row.n1, row.n2, row.n3, row.n4, row.n5, row.n6]),
          bonus: row.bonus,
          drawnAt: drawnAtFromDate(row.drawnAt),
        }),
      );
    },
  };
}
```

- [ ] **Step 4: infrastructure 배럴에 추가**

`packages/core/src/lotterietus/infrastructure/index.ts` 전체를 다음으로 교체 (Dummy는 스펙 §6대로 **코드와 export를 그대로 남긴다** — container 기본값에서만 빠진다):

```ts
export * from "./prisma-client";
export * from "./adapters/dhlottery-draw-source.adapter";
export * from "./adapters/dummy-draw-data.adapter";
export * from "./adapters/prisma-draw-data.adapter";
export * from "./adapters/prisma-draw-writer.adapter";
```

- [ ] **Step 5: 타입체크 + 전체 테스트**

```bash
pnpm --filter @fortuna-lottery/core lint
pnpm --filter @fortuna-lottery/core test
```
Expected: lint 출력 없이 성공, **12 files / 57 tests passed** (Task 3과 동일 — 새 테스트 없음)

- [ ] **Step 6: 커밋**

```bash
git add packages/core/src/lotterietus/infrastructure/prisma-client.ts \
        packages/core/src/lotterietus/infrastructure/adapters/prisma-draw-writer.adapter.ts \
        packages/core/src/lotterietus/infrastructure/adapters/prisma-draw-data.adapter.ts \
        packages/core/src/lotterietus/infrastructure/index.ts
git commit -m "feat(core): Prisma 어댑터 추가 (읽기·쓰기) + core 전용 PrismaClient 진입점"
```

---

### Task 7: `apps/worker` 신설

실어댑터를 조립해 `IngestDraws`를 반복 호출하는 얇은 엔트리포인트. 이 Task 끝에서 **실제 백필이 돌아 DB가 채워진다.**

`dev` 스크립트는 **일부러 만들지 않는다** — turbo의 `dev`는 `persistent: true`라서 `pnpm dev`(FE 개발)만 해도 워커가 함께 떠 원격에 요청을 보내게 된다. 워커는 항상 명시적으로 실행한다.

**Files:**
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/src/main.ts`

- [ ] **Step 1: `apps/worker/package.json` 작성**

```json
{
  "name": "@fortuna-lottery/worker",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node --env-file=.env --import tsx src/main.ts",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@fortuna-lottery/core": "workspace:*"
  }
}
```

- [ ] **Step 2: `apps/worker/tsconfig.json` 작성**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["node"],
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: `apps/worker/src/main.ts` 작성**

```ts
// 워커 컴포지션 루트 — 실어댑터를 조립해 수집 사이클을 반복한다 (인프라 계층)
import { makeIngestDraws } from "@fortuna-lottery/core/lotterietus/application";
import { nextDrawAt } from "@fortuna-lottery/core/lotterietus/domain";
import {
  createDhlotteryDrawSourceAdapter,
  createPrismaClient,
  createPrismaDrawWriterAdapter,
} from "@fortuna-lottery/core/lotterietus/infrastructure";

/** 추첨 시각 이후 원격에 결과가 올라오기까지의 여유 */
const AFTER_DRAW_BUFFER_MS = 10 * 60 * 1000;
/** 사이클이 실패했을 때 재시도 간격 — 다음 추첨(최대 1주)까지 기다리지 않는다 */
const RETRY_DELAY_MS = 5 * 60 * 1000;

const log = (message: string) => console.log(`[worker ${new Date().toISOString()}] ${message}`);
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const prisma = createPrismaClient();
  const ingestDraws = makeIngestDraws({
    source: createDhlotteryDrawSourceAdapter(),
    writer: createPrismaDrawWriterAdapter(prisma),
    logger: log,
  });

  const shutdown = () => {
    log("종료 신호를 받았습니다. 연결을 정리합니다.");
    void prisma.$disconnect().finally(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  log("수집 워커를 시작합니다.");

  for (;;) {
    let failed = false;
    try {
      const result = await ingestDraws();
      log(
        `사이클 완료 — ${result.startRound} → ${result.latestRound}회차, ` +
          `${result.ingestedCount}개 저장, 원격 요청 ${result.requestCount}회`,
      );
    } catch (error) {
      failed = true;
      log(`사이클 실패: ${error instanceof Error ? error.message : String(error)}`);
    }

    const wakeAt = failed
      ? new Date(Date.now() + RETRY_DELAY_MS)
      : new Date(nextDrawAt(new Date()).getTime() + AFTER_DRAW_BUFFER_MS);
    log(`다음 실행 예정: ${wakeAt.toISOString()}`);
    await sleep(Math.max(0, wakeAt.getTime() - Date.now()));
  }
}

void main();
```

- [ ] **Step 4: 워커 의존성 설치**

```bash
pnpm --filter @fortuna-lottery/worker add -D tsx typescript @types/node
pnpm install
```
Expected: 설치 완료, 에러 없음

- [ ] **Step 5: 워커 env 파일 생성**

```bash
cp .env.example apps/worker/.env
```
Expected: 파일 생성 (gitignore로 추적되지 않음)

- [ ] **Step 6: 타입체크**

```bash
pnpm --filter @fortuna-lottery/worker lint
```
Expected: 출력 없이 성공

- [ ] **Step 7: Postgres 기동 확인 후 워커 실행 (실제 백필)**

```bash
docker compose ps
pnpm --filter @fortuna-lottery/worker start
```
Expected(약 2~3분 소요 — 요청 사이 1초 대기 × 약 127회):
- `[worker ...] 수집 워커를 시작합니다.`
- `[worker ...] 수집: 1~10회차 (10개)` → `수집: 11~20회차 (10개)` → … 계속 10개씩 증가
- 마지막에 `사이클 완료 — 0 → 1235회차, 1235개 저장, 원격 요청 127회` 형태 (회차 수는 실행 시점에 따라 1235 이상)
- `다음 실행 예정: <다음 토요일 11:45 UTC 근처>` 출력 후 대기 상태로 멈춤

`Ctrl+C`로 종료한다.

> 백필 도중 실패하면 다시 `start`하면 된다 — `getMaxRound()`부터 이어서 재개된다.

- [ ] **Step 8: DB에 실제로 들어갔는지 확인**

```bash
docker compose exec -T postgres psql -U fortuna -d fortuna_lottery \
  -c "SELECT count(*) AS rows, min(round) AS first, max(round) AS last FROM draws;"
docker compose exec -T postgres psql -U fortuna -d fortuna_lottery \
  -c "SELECT round, n1,n2,n3,n4,n5,n6, bonus, drawn_at FROM draws ORDER BY round DESC LIMIT 3;"
docker compose exec -T postgres psql -U fortuna -d fortuna_lottery \
  -c "SELECT count(*) AS gaps FROM generate_series(1, (SELECT max(round) FROM draws)) g LEFT JOIN draws d ON d.round = g WHERE d.round IS NULL;"
```
Expected:
- `rows` = `last` 값과 동일, `first` = 1 (빠진 회차 없음)
- 최신 3개 회차가 실제 당첨 번호로 출력됨 — **1235회차의 `drawn_at`은 `2026-08-01`**
- `gaps` = **0** (구멍 없음 — Task 3 알고리즘이 의도대로 동작했다는 증거)

- [ ] **Step 9: 커밋**

```bash
git add apps/worker/package.json apps/worker/tsconfig.json apps/worker/src/main.ts pnpm-lock.yaml
git commit -m "feat(worker): 수집 워커 앱 신설 — 실어댑터 조립 + 주기적 catch-up 실행"
```

---

### Task 8: `apps/web`을 Prisma 읽기로 전환

`container.ts`의 어댑터 한 줄만 바꾼다. 유스케이스·DTO·FE 모듈은 무수정 — 이것이 헥사고날 구조의 검증 지점이다.

**Files:**
- Modify: `apps/web/src/server/container.ts`
- Modify: `apps/web/next.config.ts`

- [ ] **Step 1: `container.ts` 수정**

import 두 줄을 바꾼다. 다음 줄을

```ts
import { createDummyDrawDataAdapter } from "@fortuna-lottery/core/lotterietus/infrastructure";
```

이렇게 교체:

```ts
import {
  createPrismaClient,
  createPrismaDrawDataAdapter,
} from "@fortuna-lottery/core/lotterietus/infrastructure";
```

그리고 `buildContainer()` 안의 다음 두 줄을

```ts
  // MVP 어댑터 — 후속: RealDrawDataAdapter / SupabasePickRepository / SupabaseIdentityAdapter로 교체
  const drawData = createDummyDrawDataAdapter();
```

이렇게 교체:

```ts
  // draws는 워커가 수집해 Postgres에 넣은 실데이터를 읽는다.
  // picks/identity는 아직 MVP 어댑터 — 후속: SupabasePickRepository / SupabaseIdentityAdapter로 교체
  const drawData = createPrismaDrawDataAdapter(createPrismaClient());
```

(`buildContainer()`는 globalThis에 1회만 조립되므로 dev HMR 중에도 PrismaClient가 하나만 생긴다 — 기존 캐싱 구조를 그대로 활용한다.)

- [ ] **Step 2: `next.config.ts` 수정**

Prisma 클라이언트는 네이티브 엔진을 참조하므로 서버 번들에 포함시키지 않고 외부 모듈로 둔다. 파일 전체를 다음으로 교체:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // packages/core는 순수 TS 소스 그대로 참조한다 (빌드 스텝 없음)
  transpilePackages: ["@fortuna-lottery/core"],
  // Prisma는 네이티브 엔진을 쓰므로 서버 번들에 넣지 않고 런타임에 그대로 require 한다
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
```

- [ ] **Step 3: lint + 타입체크**

```bash
pnpm --filter web lint
pnpm --filter web exec tsc --noEmit
```
Expected: 둘 다 출력 없이 성공 (경계 규칙 위반 없음 — `container.ts`는 컴포지션 루트라 core infrastructure import가 허용된다)

- [ ] **Step 4: 기존 테스트 회귀 확인**

```bash
pnpm test
```
Expected: `@fortuna-lottery/core` 12 files / 57 tests, `@fortuna-lottery/web` 3 files / 10 tests — 실패 0

- [ ] **Step 5: 프로덕션 빌드**

```bash
pnpm build
```
Expected: Next.js 빌드 성공. Prisma 관련 모듈 해석 에러가 없어야 한다

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/server/container.ts apps/web/next.config.ts
git commit -m "feat(web): 회차 데이터 소스를 Dummy에서 Prisma(Postgres)로 교체"
```

---

### Task 9: 통합 검증

실제로 화면에 실데이터가 보이는지 확인한다. 코드 변경은 없다 — 문제가 있으면 해당 Task로 돌아간다.

**Files:** 없음 (문제 발견 시에만 수정 커밋)

- [ ] **Step 1: 전체 lint / test / build**

```bash
pnpm lint && pnpm test && pnpm build
```
Expected: 셋 다 성공, 테스트 실패 0

- [ ] **Step 2: Postgres 기동 확인 후 웹 실행**

```bash
docker compose ps
pnpm --filter web dev
```
브라우저에서 `http://localhost:3000` 접속.

- [ ] **Step 3: 화면에서 실데이터 확인**

1. Hero의 최근 회차가 **제1235회 · 2026.08.01 추첨**(또는 그 이후 실제 최신 회차)로 표시된다 — 더미 데이터 시절의 값과 다르다.
2. 당첨 번호 6개 + 보너스가 Task 7 Step 8의 `psql` 출력 최신 행과 **정확히 일치**한다.
3. 카운트다운이 1초마다 갱신된다.
4. [통계] 탭 → "확률 현실" 서브탭이 정상 렌더링된다.
5. [통계] 탭 → "최근 그리드" 서브탭의 최신 회차가 위 1번과 같다.
6. [내 번호] → "현재 번호 저장" → [결과 확인] → "당첨 대조"가 에러 없이 동작한다 (실 회차 데이터와 대조된다).

- [ ] **Step 4: 재수집 멱등성 확인**

워커를 한 번 더 돌려도 중복 저장이나 에러가 없어야 한다.

```bash
pnpm --filter @fortuna-lottery/worker start
```
Expected: 몇 초 안에 `사이클 완료 — 1235 → 1235회차, 0개 저장, 원격 요청 3회` 형태 출력 후 대기. `Ctrl+C`로 종료.

```bash
docker compose exec -T postgres psql -U fortuna -d fortuna_lottery -c "SELECT count(*) FROM draws;"
```
Expected: Task 7 Step 8과 동일한 행 수 (증가하지 않음)

- [ ] **Step 5: 재시작 후에도 데이터가 남는지 확인**

```bash
docker compose restart postgres
sleep 10
docker compose exec -T postgres psql -U fortuna -d fortuna_lottery -c "SELECT count(*) FROM draws;"
```
Expected: 재시작 전과 동일한 행 수 (볼륨에 보존됨)

- [ ] **Step 6: 최종 상태 확인**

```bash
git log --oneline -9
git status --short
```
Expected: Task 1~8이 남긴 커밋 **8개**가 위쪽에 보이고, 커밋되지 않은 변경이 없다 (`.env` 파일들은 gitignore되어 표시되지 않는다)

- [ ] **Step 7: 문제 발견 시 처리**

Step 3~5에서 어긋나는 항목이 있으면 해당 Task의 파일로 돌아가 고치고 Step 1을 다시 실행한 뒤 수정 커밋을 남긴다. 스펙·이 계획과 다르게 판단하고 싶은 지점이 생기면 **임의로 바꾸지 말고 사용자에게 먼저 보고한다.**

---

## 스코프 밖 (스펙 §5 그대로)

- `picks` / `results` / `users` 영속화는 InMemory 유지 — 이번 범위는 draws 데이터 소스 교체 + 수집 파이프라인뿐이다.
- 로깅/모니터링 인프라(Sentry 등) 없음 — `console.log` 수준.
- `apps/web`의 Postgres 장애 폴백(캐시/재시도) 없음 — 에러를 그대로 전파한다.
- `docker-compose.yml`은 Postgres만 — 웹/워커는 로컬 `pnpm`으로 실행.
- 워커는 API 계층 없이 Postgres에 직접 쓴다 (내부 전용 프로세스).
