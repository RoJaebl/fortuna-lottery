# 최근회차(draw) + 다음추첨(countdown) → `lotterietus` 병합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `draw`(최근 회차)와 `countdown`(다음 추첨 카운트다운) 도메인/모듈을 core+FE 전체에서 단일 도메인
`lotterietus`로 병합하고, 두 개였던 API 엔드포인트와 카드 UI를 각각 하나로 통합한다.

**Architecture:** `packages/core/src/draw`와 `packages/core/src/countdown`을 폐기하고
`packages/core/src/lotterietus`(domain/application/dto/infrastructure)로 합친다. FE도
`apps/web/src/modules/draw` + `apps/web/src/modules/countdown` → `apps/web/src/modules/lotterietus`로
합친다. `DrawDataPort`/`Draw` 엔티티는 이름을 바꾸지 않고 위치만 옮기되, 이를 직접 import하는
`statistics`/`results`/`simulation` 3개 도메인의 상대 경로도 함께 갱신한다. API는
`/api/draws` + `/api/countdown` → `/api/lotterietus` 단일 GET 엔드포인트로, `container.ts`의
`getRecentDraws`+`getCountdown` → `getLotterietusStatus` 단일 함수로 줄어든다.

**Tech Stack:** Next.js 15 (App Router) route handler, TypeScript 순수 함수(core), React hook
(viewmodel), Vitest.

## Global Constraints

- 설계 문서: `docs/superpowers/specs/2026-07-29-lotterietus-merge-design.md` (이 계획의 근거, 모든
  값은 이 문서와 정확히 일치해야 한다).
- Tier-2 도메인 규칙(얇게): ViewModel · Model · Assembler · DTO · ReadModel — Mapper 없음(요청 본문
  없음), VO/Entity 없음. `lotterietus`는 읽기 전용/파생 도메인이므로 이 규칙을 그대로 따른다.
- import 경계 규칙(`apps/web/eslint.config.mjs`, 위반 = 빌드 실패): `modules/**`는 core의
  `*/dto`만 타입 import 가능(도메인/애플리케이션/인프라/shared 직접 import 금지); `app/api/**`만
  런타임에 core의 application/infrastructure를 import 가능; 모듈 간에는 상대 모듈의 `index.ts`로만
  통신(deep import 금지).
- 네이밍: 응답 DTO → FE 모델 변환 함수는 "Assembler"(`*ResponseAssembler`류 함수, 여기서는
  `assembleLotterietusStatus`)라 부른다 — "Adapter"라는 이름은 헥사고날 포트 구현체 전용으로 예약되어
  있으므로 쓰지 않는다. ViewModel은 `use*ViewModel`, Model은 `*Model` interface.
- `packages/core/package.json`의 `exports`는 `./*/domain`, `./*/application`, `./*/dto`,
  `./*/infrastructure` 와일드카드이므로 `lotterietus` 폴더를 만들면 자동으로 서브패스 export가
  생긴다 — package.json은 수정하지 않는다.
- DTO 확정 (평탄 구조, 설계 문서 §2):
  `LotterietusStatusResponse = { round: number; numbers: number[]; bonus: number; drawnAt: string; nextRound: number; nextDrawAt: string }`
- UI 확정 (설계 문서 §3): `Card title="로또 현황"` 안에 두 섹션. 최근 회차 섹션은 `Ball size="lg"`(보너스는
  `size="md"`)로 부각, 다음 추첨 섹션은 라벨 `text-slate-400`·값 `text-sm font-medium tabular-nums
  text-slate-500`로 축소. 두 섹션 사이 구분선(`border-t`) 없음, `mt-4` 간격만 사용.
- TDD: 새로 작성하는 로직(`get-lotterietus-status` 유스케이스)은 테스트를 먼저 작성한다. 내용
  변경 없이 위치만 옮기는 기존 테스트(`dummy-draw-data.adapter.test.ts`, `schedule.test.ts`,
  `format-remaining.test.ts`)는 red-green 사이클 없이 이동 후 그대로 통과를 확인한다.
- 회귀 없음: `statistics`/`results`/`simulation`의 로직은 절대 바뀌지 않는다 — import 경로 한 줄만
  바뀐다.
- 커밋은 각 Task 끝에 한 번, 관련 파일만 `git add`로 정확히 지정한다 (`git add -A` 금지).

---

### Task 1: core — `draw`+`countdown` 플러밍(domain/port/infrastructure) 이동 + 병합 usecase (TDD)

**Files:**
- Move (`git mv`, 내용 무변경):
  - `packages/core/src/draw/domain/draw.ts` → `packages/core/src/lotterietus/domain/draw.ts`
  - `packages/core/src/countdown/domain/schedule.ts` → `packages/core/src/lotterietus/domain/schedule.ts`
  - `packages/core/src/countdown/domain/schedule.test.ts` → `packages/core/src/lotterietus/domain/schedule.test.ts`
  - `packages/core/src/draw/application/ports/draw-data.port.ts` → `packages/core/src/lotterietus/application/ports/draw-data.port.ts`
  - `packages/core/src/draw/infrastructure/adapters/dummy-draw-data.adapter.ts` → `packages/core/src/lotterietus/infrastructure/adapters/dummy-draw-data.adapter.ts`
  - `packages/core/src/draw/infrastructure/adapters/dummy-draw-data.adapter.test.ts` → `packages/core/src/lotterietus/infrastructure/adapters/dummy-draw-data.adapter.test.ts`
- Create:
  - `packages/core/src/lotterietus/domain/index.ts`
  - `packages/core/src/lotterietus/dto/lotterietus.dto.ts`
  - `packages/core/src/lotterietus/dto/index.ts`
  - `packages/core/src/lotterietus/application/usecases/get-lotterietus-status.test.ts`
  - `packages/core/src/lotterietus/application/usecases/get-lotterietus-status.ts`
  - `packages/core/src/lotterietus/application/index.ts`
  - `packages/core/src/lotterietus/infrastructure/index.ts`
- Delete (남은 잔여 파일 전체): `packages/core/src/draw/`, `packages/core/src/countdown/`

**Interfaces:**
- Consumes: 없음 (이 태스크가 최초).
- Produces (Task 2/3/4가 그대로 사용):
  - `Draw` interface — `packages/core/src/lotterietus/domain/draw.ts`, 필드 불변
  - `DrawDataPort` interface — `{ getAllDraws(): Promise<readonly Draw[]> }`
  - `nextDrawAt(now: Date): Date` — `packages/core/src/lotterietus/domain/schedule.ts`
  - `LotterietusStatusResponse` — `{ round: number; numbers: number[]; bonus: number; drawnAt: string; nextRound: number; nextDrawAt: string }`
  - `makeGetLotterietusStatus(drawData: DrawDataPort, clock?: () => Date): () => Promise<LotterietusStatusResponse>`
  - `createDummyDrawDataAdapter(options?: { rounds?: number; seed?: number }): DrawDataPort` — 이름/시그니처 불변
  - 서브패스: `@fortuna-lottery/core/lotterietus/domain`, `.../application`, `.../dto`, `.../infrastructure`

- [ ] **Step 1: 변경 없는 파일들을 새 위치로 이동**

```bash
mkdir -p packages/core/src/lotterietus/domain \
  packages/core/src/lotterietus/application/ports \
  packages/core/src/lotterietus/application/usecases \
  packages/core/src/lotterietus/dto \
  packages/core/src/lotterietus/infrastructure/adapters

git mv packages/core/src/draw/domain/draw.ts packages/core/src/lotterietus/domain/draw.ts
git mv packages/core/src/countdown/domain/schedule.ts packages/core/src/lotterietus/domain/schedule.ts
git mv packages/core/src/countdown/domain/schedule.test.ts packages/core/src/lotterietus/domain/schedule.test.ts
git mv packages/core/src/draw/application/ports/draw-data.port.ts packages/core/src/lotterietus/application/ports/draw-data.port.ts
git mv packages/core/src/draw/infrastructure/adapters/dummy-draw-data.adapter.ts packages/core/src/lotterietus/infrastructure/adapters/dummy-draw-data.adapter.ts
git mv packages/core/src/draw/infrastructure/adapters/dummy-draw-data.adapter.test.ts packages/core/src/lotterietus/infrastructure/adapters/dummy-draw-data.adapter.test.ts
```

이 6개 파일은 상대 import 깊이(`src/<domain>/...`)가 그대로 유지되므로 파일 내용은 한 글자도 바꾸지
않는다.

- [ ] **Step 2: domain 배럴 작성**

`packages/core/src/lotterietus/domain/index.ts`:

```ts
export * from "./draw";
export * from "./schedule";
```

- [ ] **Step 3: DTO 작성**

`packages/core/src/lotterietus/dto/lotterietus.dto.ts`:

```ts
/** 로또 현황 응답 DTO — 최근 회차 + 다음 추첨 정보 (와이어 계약, 클라이언트 무관) */
export interface LotterietusStatusResponse {
  round: number;
  numbers: number[];
  bonus: number;
  drawnAt: string;
  nextRound: number;
  nextDrawAt: string;
}
```

`packages/core/src/lotterietus/dto/index.ts`:

```ts
export * from "./lotterietus.dto";
```

- [ ] **Step 4: 실패하는 usecase 테스트 작성**

`packages/core/src/lotterietus/application/usecases/get-lotterietus-status.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import type { Draw } from "../../domain/draw";
import type { DrawDataPort } from "../ports/draw-data.port";
import { makeGetLotterietusStatus } from "./get-lotterietus-status";

const fakeDrawPort = (draws: Draw[]): DrawDataPort => ({
  async getAllDraws() {
    return draws;
  },
});

describe("getLotterietusStatus (로또 현황)", () => {
  it("getAllDraws를 한 번만 호출해서 최근 회차 + 다음 추첨 정보를 함께 반환한다", async () => {
    const draws: Draw[] = [
      { round: 10, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, drawnAt: "2026-06-27T11:35:00.000Z" },
      { round: 11, numbers: [10, 20, 30, 40, 41, 42], bonus: 43, drawnAt: "2026-07-04T11:35:00.000Z" },
    ];
    const getAllDraws = vi.fn(async () => draws);
    const getStatus = makeGetLotterietusStatus(
      { getAllDraws },
      () => new Date("2026-07-01T00:00:00.000Z"),
    );

    const result = await getStatus();

    expect(getAllDraws).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      round: 11,
      numbers: [10, 20, 30, 40, 41, 42],
      bonus: 43,
      drawnAt: "2026-07-04T11:35:00.000Z",
      nextRound: 12,
      nextDrawAt: "2026-07-04T11:35:00.000Z",
    });
  });

  it("회차 데이터가 없으면 회차 0/빈 번호로, 다음 회차는 1로 반환한다", async () => {
    const getStatus = makeGetLotterietusStatus(
      fakeDrawPort([]),
      () => new Date("2026-07-01T00:00:00.000Z"),
    );

    const result = await getStatus();

    expect(result).toEqual({
      round: 0,
      numbers: [],
      bonus: 0,
      drawnAt: "",
      nextRound: 1,
      nextDrawAt: "2026-07-04T11:35:00.000Z",
    });
  });
});
```

(2026-07-01은 수요일 → 다음 토요일 추첨은 2026-07-04T11:35:00.000Z — 기존 `schedule.test.ts`와 동일한
기준일을 재사용한 값이다.)

- [ ] **Step 5: 테스트 실패 확인**

Run: `pnpm --filter @fortuna-lottery/core exec vitest run src/lotterietus/application/usecases/get-lotterietus-status.test.ts`
Expected: FAIL — `get-lotterietus-status` 모듈을 찾을 수 없음

- [ ] **Step 6: usecase 구현**

`packages/core/src/lotterietus/application/usecases/get-lotterietus-status.ts`:

```ts
import { nextDrawAt } from "../../domain/schedule";
import type { LotterietusStatusResponse } from "../../dto/lotterietus.dto";
import type { DrawDataPort } from "../ports/draw-data.port";

/** 로또 현황 유스케이스 — 최근 회차 + 다음 추첨 정보를 getAllDraws 한 번으로 계산한다 */
export const makeGetLotterietusStatus =
  (drawData: DrawDataPort, clock: () => Date = () => new Date()) =>
  async (): Promise<LotterietusStatusResponse> => {
    const draws = await drawData.getAllDraws();
    const latest = draws[draws.length - 1];
    return {
      round: latest?.round ?? 0,
      numbers: latest ? [...latest.numbers] : [],
      bonus: latest?.bonus ?? 0,
      drawnAt: latest?.drawnAt ?? "",
      nextRound: (latest?.round ?? 0) + 1,
      nextDrawAt: nextDrawAt(clock()).toISOString(),
    };
  };
```

- [ ] **Step 7: 테스트 통과 확인**

Run: `pnpm --filter @fortuna-lottery/core exec vitest run src/lotterietus/application/usecases/get-lotterietus-status.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 8: application/infrastructure 배럴 작성**

`packages/core/src/lotterietus/application/index.ts`:

```ts
export * from "./ports/draw-data.port";
export * from "./usecases/get-lotterietus-status";
```

`packages/core/src/lotterietus/infrastructure/index.ts`:

```ts
export * from "./adapters/dummy-draw-data.adapter";
```

- [ ] **Step 9: 옛 draw/countdown 폴더의 잔여 파일 삭제**

Step 1에서 이미 옮긴 6개 파일을 제외하면, `draw/`에는
`application/index.ts`(옛 배럴), `application/usecases/get-recent-draws.ts`(로직이
`get-lotterietus-status.ts`로 대체됨), `domain/index.ts`(옛 배럴), `dto/draw.dto.ts`,
`dto/index.ts`, `infrastructure/index.ts`(옛 배럴)만 남아있고, `countdown/`에는
`application/index.ts`, `application/usecases/get-countdown.ts`(로직 흡수됨), `domain/index.ts`,
`dto/countdown.dto.ts`, `dto/index.ts`만 남아있다. 폴더째로 삭제한다:

```bash
git rm -r packages/core/src/draw packages/core/src/countdown
```

- [ ] **Step 10: core 전체 테스트로 회귀 확인**

Run: `pnpm --filter @fortuna-lottery/core test`
Expected: 모든 테스트 PASS — 특히 옮겨진 `dummy-draw-data.adapter.test.ts`, `schedule.test.ts`가 새
경로에서 그대로 통과해야 한다. (이 시점에는 `statistics`/`results`/`simulation`이 아직 옛 `draw` 경로를
참조하므로 그 파일들만 import 에러로 실패하는 것이 정상이다 — Task 2에서 고친다.)

- [ ] **Step 11: 커밋**

```bash
git add packages/core/src/lotterietus packages/core/src/draw packages/core/src/countdown
git commit -m "refactor(core): draw+countdown 플러밍을 lotterietus로 병합"
```

---

### Task 2: core — `statistics`/`results`/`simulation` import 경로 갱신 (회귀 없음)

**Files:**
- Modify: `packages/core/src/statistics/application/usecases/get-statistics.ts`
- Modify: `packages/core/src/results/application/usecases/check-results.ts`
- Modify: `packages/core/src/results/application/usecases/check-results.test.ts`
- Modify: `packages/core/src/simulation/application/usecases/backtest-combination.ts`

**Interfaces:**
- Consumes (Task 1 산출물): `DrawDataPort`, `Draw` — 위치만 `../../../lotterietus/...`로 바뀜, 시그니처
  불변.
- Produces: 없음 (기존 `makeGetStatistics`/`makeCheckResults`/`makeBacktestCombination` 시그니처 불변,
  Task 4의 `container.ts`가 그대로 계속 사용).

- [ ] **Step 1: statistics import 경로 수정**

`packages/core/src/statistics/application/usecases/get-statistics.ts`에서:

```ts
import type { DrawDataPort } from "../../../draw/application/ports/draw-data.port";
```

를 다음으로 교체:

```ts
import type { DrawDataPort } from "../../../lotterietus/application/ports/draw-data.port";
```

- [ ] **Step 2: results usecase import 경로 수정**

`packages/core/src/results/application/usecases/check-results.ts`에서:

```ts
import type { DrawDataPort } from "../../../draw/application/ports/draw-data.port";
```

를 다음으로 교체:

```ts
import type { DrawDataPort } from "../../../lotterietus/application/ports/draw-data.port";
```

- [ ] **Step 3: results 테스트 import 경로 수정**

`packages/core/src/results/application/usecases/check-results.test.ts`에서:

```ts
import type { Draw } from "../../../draw/domain/draw";
import type { DrawDataPort } from "../../../draw/application/ports/draw-data.port";
```

를 다음으로 교체:

```ts
import type { Draw } from "../../../lotterietus/domain/draw";
import type { DrawDataPort } from "../../../lotterietus/application/ports/draw-data.port";
```

- [ ] **Step 4: simulation import 경로 수정**

`packages/core/src/simulation/application/usecases/backtest-combination.ts`에서:

```ts
import type { DrawDataPort } from "../../../draw/application/ports/draw-data.port";
```

를 다음으로 교체:

```ts
import type { DrawDataPort } from "../../../lotterietus/application/ports/draw-data.port";
```

- [ ] **Step 5: core 전체 테스트로 회귀 확인**

Run: `pnpm --filter @fortuna-lottery/core test`
Expected: 모든 테스트 PASS (Task 1의 `lotterietus` 테스트 + `statistics`/`results`/`simulation` 기존
테스트 전부 — 로직은 안 바뀌었으므로 값 변화 없이 통과해야 한다)

- [ ] **Step 6: core 타입체크로 옛 경로 잔존 여부 확인**

Run: `pnpm --filter @fortuna-lottery/core lint`
Expected: 에러 없음 (0 errors) — `../../../draw/...` 경로가 하나라도 남아있으면 모듈을 찾지 못해 여기서
드러난다.

- [ ] **Step 7: 커밋**

```bash
git add packages/core/src/statistics packages/core/src/results packages/core/src/simulation
git commit -m "refactor(core): statistics/results/simulation의 draw import 경로를 lotterietus로 갱신"
```

---

### Task 3: FE — `lotterietus` 모듈 신설 (모델·어셈블러·API 클라이언트·뷰모델·뷰)

**Files:**
- Create: `apps/web/src/modules/lotterietus/model/lotterietus.model.ts`
- Create: `apps/web/src/modules/lotterietus/transport/assembler/lotterietus.assembler.ts`
- Create: `apps/web/src/modules/lotterietus/api/client.ts`
- Move (`git mv`) + Modify: `apps/web/src/modules/countdown/viewmodel/format-remaining.test.ts` → `apps/web/src/modules/lotterietus/viewmodel/format-remaining.test.ts` (import 경로 한 줄만 수정)
- Create: `apps/web/src/modules/lotterietus/viewmodel/use-lotterietus.viewmodel.ts`
- Create: `apps/web/src/modules/lotterietus/view/lotterietus-card.tsx`
- Create: `apps/web/src/modules/lotterietus/index.ts`

**Interfaces:**
- Consumes (Task 1 산출물, 타입 import만): `LotterietusStatusResponse` from
  `@fortuna-lottery/core/lotterietus/dto`.
- Produces (Task 4가 그대로 사용):
  - `LotterietusModel` — `{ round: number; numbers: number[]; bonus: number; drawnAt: Date; nextRound: number; nextDrawAt: Date }`
  - `fetchLotterietusStatus(): Promise<LotterietusModel>`
  - `useLotterietusViewModel()` → `{ data: LotterietusModel | null; error: string | null; remaining: string | null; formatDrawDate: (d: Date) => string }`
  - `LotterietusCard` 컴포넌트 (props 없음)
  - 모듈 배럴 `@/modules/lotterietus`가 `LotterietusCard`, `LotterietusModel` 타입을 export

- [ ] **Step 1: FE 모델 작성**

`apps/web/src/modules/lotterietus/model/lotterietus.model.ts`:

```ts
/** FE 모델 원형 — ViewModel은 이 인터페이스에만 의존한다 */
export interface LotterietusModel {
  round: number;
  numbers: number[];
  bonus: number;
  drawnAt: Date;
  nextRound: number;
  nextDrawAt: Date;
}
```

- [ ] **Step 2: 어셈블러 작성**

`apps/web/src/modules/lotterietus/transport/assembler/lotterietus.assembler.ts`:

```ts
import type { LotterietusStatusResponse } from "@fortuna-lottery/core/lotterietus/dto";
import type { LotterietusModel } from "../../model/lotterietus.model";

/** 응답 DTO → FE 모델 (와이어 이음새) */
export function assembleLotterietusStatus(dto: LotterietusStatusResponse): LotterietusModel {
  return {
    round: dto.round,
    numbers: [...dto.numbers],
    bonus: dto.bonus,
    drawnAt: new Date(dto.drawnAt),
    nextRound: dto.nextRound,
    nextDrawAt: new Date(dto.nextDrawAt),
  };
}
```

- [ ] **Step 3: API 클라이언트 작성**

`apps/web/src/modules/lotterietus/api/client.ts`:

```ts
import type { LotterietusStatusResponse } from "@fortuna-lottery/core/lotterietus/dto";
import { apiGet } from "@/shared/lib/fetcher";
import { assembleLotterietusStatus } from "../transport/assembler/lotterietus.assembler";
import type { LotterietusModel } from "../model/lotterietus.model";

export async function fetchLotterietusStatus(): Promise<LotterietusModel> {
  return assembleLotterietusStatus(await apiGet<LotterietusStatusResponse>("/api/lotterietus"));
}
```

- [ ] **Step 4: 기존 `formatRemaining` 테스트를 새 위치로 이동하고 import만 수정**

```bash
mkdir -p apps/web/src/modules/lotterietus/viewmodel
git mv apps/web/src/modules/countdown/viewmodel/format-remaining.test.ts apps/web/src/modules/lotterietus/viewmodel/format-remaining.test.ts
```

파일 안의 import 한 줄만 수정 (테스트 내용/함수명은 무변경):

```ts
import { formatRemaining } from "./use-countdown.viewmodel";
```

→

```ts
import { formatRemaining } from "./use-lotterietus.viewmodel";
```

- [ ] **Step 5: 병합 뷰모델 작성 (formatDrawDate + formatRemaining + 데이터 fetch)**

`apps/web/src/modules/lotterietus/viewmodel/use-lotterietus.viewmodel.ts`:

```ts
"use client";
import { useEffect, useState } from "react";
import { fetchLotterietusStatus } from "../api/client";
import type { LotterietusModel } from "../model/lotterietus.model";

/** 순수 presenter — 회차 날짜 표기 */
export function formatDrawDate(drawnAt: Date): string {
  return `${drawnAt.getFullYear()}.${String(drawnAt.getMonth() + 1).padStart(2, "0")}.${String(drawnAt.getDate()).padStart(2, "0")}`;
}

/** 순수 presenter — 남은 시간(ms) → "D-3 12:34:56" */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "추첨 시간!";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const h = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return days > 0 ? `D-${days} ${h}:${m}:${s}` : `${h}:${m}:${s}`;
}

export function useLotterietusViewModel() {
  const [data, setData] = useState<LotterietusModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetchLotterietusStatus()
      .then(setData)
      .catch((e: Error) => setError(e.message));
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = data ? formatRemaining(data.nextDrawAt.getTime() - now) : null;
  return { data, error, remaining, formatDrawDate };
}
```

- [ ] **Step 6: 이동한 테스트 통과 확인**

Run: `pnpm --filter web exec vitest run src/modules/lotterietus/viewmodel/format-remaining.test.ts`
Expected: PASS (3 tests) — `formatRemaining` 로직은 그대로이므로 red-green 없이 바로 통과해야 한다.

- [ ] **Step 7: 병합 카드 뷰 작성**

`apps/web/src/modules/lotterietus/view/lotterietus-card.tsx`:

```tsx
"use client";
import { Ball } from "@/shared/ui/ball";
import { Card } from "@/shared/ui/card";
import { useLotterietusViewModel } from "../viewmodel/use-lotterietus.viewmodel";

export function LotterietusCard() {
  const { data, error, remaining, formatDrawDate } = useLotterietusViewModel();

  return (
    <Card title="로또 현황">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {data ? (
        <>
          <div>
            <p className="text-xs text-slate-500">
              최근 회차 · 제{data.round}회 · {formatDrawDate(data.drawnAt)} 추첨
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              {data.numbers.map((n) => (
                <Ball key={n} n={n} size="lg" />
              ))}
              <span className="mx-1 text-slate-400">+</span>
              <Ball n={data.bonus} size="md" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-400">
              다음 추첨까지 · 제{data.nextRound}회 · 매주 토요일 20:35
            </p>
            <p className="mt-1 text-sm font-medium tabular-nums text-slate-500">
              {remaining ?? "…"}
            </p>
          </div>
        </>
      ) : !error ? (
        <p className="text-sm text-slate-500">불러오는 중…</p>
      ) : null}
    </Card>
  );
}
```

- [ ] **Step 8: 모듈 배럴 작성**

`apps/web/src/modules/lotterietus/index.ts`:

```ts
export { LotterietusCard } from "./view/lotterietus-card";
export type { LotterietusModel } from "./model/lotterietus.model";
```

- [ ] **Step 9: web lint로 경계 규칙 위반 여부 확인**

Run: `pnpm --filter web lint`
Expected: 에러 없음 — `lotterietus` 모듈이 core의 `dto`만 타입 import하고 있으므로
`no-restricted-imports` 규칙을 위반하지 않아야 한다.

- [ ] **Step 10: 커밋**

```bash
git add apps/web/src/modules/lotterietus
git commit -m "feat(web): lotterietus 모듈 신설 — 최근회차+다음추첨 병합 카드"
```

---

### Task 4: 배선 — API 라우트 · 컴포지션 루트 · 페이지 조립, 옛 모듈/라우트 삭제

**Files:**
- Create: `apps/web/src/app/api/lotterietus/route.ts`
- Delete: `apps/web/src/app/api/draws/`, `apps/web/src/app/api/countdown/`
- Modify: `apps/web/src/server/container.ts`
- Modify: `apps/web/src/app/page.tsx`
- Delete: `apps/web/src/modules/draw/`, `apps/web/src/modules/countdown/`

**Interfaces:**
- Consumes (Task 1 산출물): `makeGetLotterietusStatus` from
  `@fortuna-lottery/core/lotterietus/application`, `createDummyDrawDataAdapter` from
  `@fortuna-lottery/core/lotterietus/infrastructure`.
- Consumes (Task 3 산출물): `LotterietusCard` from `@/modules/lotterietus`.
- Produces: `GET /api/lotterietus` → `LotterietusStatusResponse` JSON;
  `container.getLotterietusStatus: () => Promise<LotterietusStatusResponse>`.

- [ ] **Step 1: API 라우트 작성**

`apps/web/src/app/api/lotterietus/route.ts`:

```ts
import { NextResponse } from "next/server";
import { container } from "@/server/container";

export async function GET() {
  const status = await container.getLotterietusStatus();
  return NextResponse.json(status);
}
```

- [ ] **Step 2: 옛 API 라우트 삭제**

```bash
git rm -r apps/web/src/app/api/draws apps/web/src/app/api/countdown
```

- [ ] **Step 3: 컴포지션 루트 수정**

`apps/web/src/server/container.ts` 전체를 다음으로 교체:

```ts
// 컴포지션 루트 — 어댑터를 조립해 유스케이스에 포트를 주입하는 유일한 장소.
// app/api(인프라 계층)만 이 파일을 import할 수 있다 (경계 규칙).
import { makeGetLotterietusStatus } from "@fortuna-lottery/core/lotterietus/application";
import { createDummyDrawDataAdapter } from "@fortuna-lottery/core/lotterietus/infrastructure";
import { makeGetStatistics } from "@fortuna-lottery/core/statistics/application";
import { makeGenerateCombination } from "@fortuna-lottery/core/generator/application";
import { makeBacktestCombination } from "@fortuna-lottery/core/simulation/application";
import {
  makeDeletePick,
  makeListPicks,
  makeSavePick,
} from "@fortuna-lottery/core/picks/application";
import { createInMemoryPickRepository } from "@fortuna-lottery/core/picks/infrastructure";
import { makeCheckResults } from "@fortuna-lottery/core/results/application";
import { createGuestIdentityAdapter } from "@fortuna-lottery/core/identity/infrastructure";

function buildContainer() {
  // MVP 어댑터 — 후속: RealDrawDataAdapter / SupabasePickRepository / SupabaseIdentityAdapter로 교체
  const drawData = createDummyDrawDataAdapter();
  const pickRepository = createInMemoryPickRepository();
  const identity = createGuestIdentityAdapter();

  return {
    identity,
    getLotterietusStatus: makeGetLotterietusStatus(drawData),
    getStatistics: makeGetStatistics(drawData),
    generateCombination: makeGenerateCombination(Math.random),
    backtestCombination: makeBacktestCombination(drawData),
    savePick: makeSavePick({ repository: pickRepository }),
    listPicks: makeListPicks(pickRepository),
    deletePick: makeDeletePick(pickRepository),
    checkResults: makeCheckResults(pickRepository, drawData),
  };
}

type Container = ReturnType<typeof buildContainer>;

// dev HMR·라우트 간에 인메모리 저장소가 유지되도록 globalThis에 1회 조립
const globalRef = globalThis as typeof globalThis & { __fortunaLotteryContainer?: Container };
export const container: Container = (globalRef.__fortunaLotteryContainer ??= buildContainer());
```

- [ ] **Step 4: 페이지 조립 수정**

`apps/web/src/app/page.tsx` 전체를 다음으로 교체:

```tsx
"use client";
// 라우트 = 모듈 조립만 (경계 규칙). 모듈 간 데이터 흐름(현재 조합)을 여기서 중개한다.
import { useState } from "react";
import { GeneratorCard } from "@/modules/generator";
import { IdentityBadge } from "@/modules/identity";
import { LotterietusCard } from "@/modules/lotterietus";
import { PicksCard } from "@/modules/picks";
import { ResultsCard } from "@/modules/results";
import { SimulationCard } from "@/modules/simulation";
import { StatisticsPanel } from "@/modules/statistics";

export default function HomePage() {
  const [currentNumbers, setCurrentNumbers] = useState<number[] | null>(null);

  return (
    <main className="mx-auto max-w-screen-2xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
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

      <LotterietusCard />

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <GeneratorCard onGenerated={setCurrentNumbers} />
          <SimulationCard numbers={currentNumbers} />
          <PicksCard currentNumbers={currentNumbers} />
          <ResultsCard />
        </div>
        <StatisticsPanel myNumbers={currentNumbers} />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: 옛 FE 모듈 삭제**

```bash
git rm -r apps/web/src/modules/draw apps/web/src/modules/countdown
```

- [ ] **Step 6: 저장소 전체 테스트**

Run: `pnpm test`
Expected: 모든 테스트 PASS (core + web, 총 케이스 수는 기존과 거의 동일 — `get-recent-draws`/`get-countdown`
관련 옛 테스트는 없었으므로 순감소 없음)

- [ ] **Step 7: 저장소 전체 lint**

Run: `pnpm lint`
Expected: 에러 없음 (`apps/web` eslint 경계 규칙 + `packages/core` tsc --noEmit)

- [ ] **Step 8: 저장소 빌드**

Run: `pnpm build`
Expected: 빌드 성공 — `/api/lotterietus` 라우트가 정상 등록되고, 삭제된 `/api/draws`,
`/api/countdown`, `@/modules/draw`, `@/modules/countdown`에 대한 잔여 참조가 없어야 한다.

- [ ] **Step 9: 개발 서버로 스모크 테스트**

```bash
pnpm dev &
sleep 3
curl -s http://localhost:3000/api/lotterietus
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```

Expected: `/api/lotterietus`가 `{"round":...,"numbers":[...],"bonus":...,"drawnAt":"...","nextRound":...,"nextDrawAt":"..."}` 형태의 JSON을 반환하고, `/`는 `200`을 반환한다. 확인 후 개발 서버 프로세스를
종료한다.

- [ ] **Step 10: 커밋**

```bash
git add apps/web/src/app/api/lotterietus apps/web/src/server/container.ts apps/web/src/app/page.tsx apps/web/src/app/api/draws apps/web/src/app/api/countdown apps/web/src/modules/draw apps/web/src/modules/countdown
git commit -m "feat(web): draw+countdown API/페이지 배선을 lotterietus 단일 경로로 통합"
```
