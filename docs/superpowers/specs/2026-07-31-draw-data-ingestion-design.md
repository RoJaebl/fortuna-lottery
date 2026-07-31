# 실제 로또 추첨 데이터 수집 + PostgreSQL 영속화

## 배경

`DummyDrawDataAdapter`(시드 고정 결정적 생성, ~1,180회차)를 실제 동행복권 데이터로 교체한다. 동행복권은
공식 오픈 API를 제공하지 않는다 — 예전에 널리 쓰이던 `common.do?method=getLottoNumber` 엔드포인트는
현재(2026-07-31) 완전히 죽어 있고(302 → 홈으로 리다이렉트), 사이트 개편 후 실제 결과 페이지
(`/lt645/result`)의 JS를 분석해 현재 동작하는 비공식 엔드포인트를 확인했다:

```
GET https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd={회차}
Header: Referer: https://www.dhlottery.co.kr/lt645/result
Header: X-Requested-With: XMLHttpRequest
```

`srchLtEpsd`로 지정한 회차 근방 10개 회차를 배치로 반환한다 (`ltEpsd`, `tm1WnNo`~`tm6WnNo`, `bnsWnNo`,
`ltRflYmd` 필드 포함). **실측 확인(2026-07-31)**: `srchLtEpsd`가 아직 발생하지 않은 미래 회차(예: 현재
최신이 1234회인데 1235 요청)를 가리키면 **빈 배열을 반환**한다 — 존재하는 최신 회차로 자동 보정되지
않는다. 반대로 존재하는 회차를 가리키면 그 회차를 포함한 10개 창을 반환하되, 창이 아직 존재하지 않는
미래 회차 쪽으로 넘어갈 경우 창 전체가 뒤로 당겨져 항상 10개가 채워진다(예: 최신이 1234일 때
`srchLtEpsd`=1230~1234 모두 동일하게 [1225..1234]를 반환). 즉 "요청한 회차가 존재하는가"만 empty/non-empty로
판별 가능하고, "얼마나 더 존재하는가"는 창 내용을 직접 봐야 한다 — 이 특성이 §4 수집 루프의 스텝 조정
방식을 결정한다. 비공식 엔드포인트이므로 과도한 요청 시 차단 위험이 있어, 회차당 요청에 시간차를 둔
백필 + 주 1회 정기 수집 전략이 필요하다. 수집한 데이터는 서버 프로세스 재시작에도 남아야 하므로
PostgreSQL에 영속화하고, 앱 프로세스와 분리된 워커 프로세스가 수집을 전담한다.

## 1. 아키텍처

`apps/worker`를 신설한다 — Next.js와 무관한 독립 Node 프로세스로, `docker-compose`의 Postgres와 별개로
로컬 `pnpm`(또는 자체 프로세스 관리자)으로 상시 실행된다.

```
┌─────────────┐    read (Prisma)    ┌───────────────┐
│  apps/web    │ ───────────────▶  │  PostgreSQL    │
│ (기존 Next)  │                    │ (docker-compose,│
└─────────────┘                    │  postgres만)    │
                                    └──────┬────────┘
                                            │ write (Prisma)
┌──────────────┐   fetch (HTTP)    ┌───────┴───────┐
│ dhlottery.co  │◀──────────────────│  apps/worker   │
│ .kr (비공식)  │                    │ (신규, 상시실행)│
└──────────────┘                    └───────────────┘
```

`packages/core`에 수집 전용 포트/유스케이스/어댑터를 추가하고, `apps/worker`와 `apps/web`은 각자 필요한
어댑터만 조립한다 (헥사고날 원칙 그대로 — domain/application은 프레임워크 0, `infrastructure/adapters`
계층에만 외부 의존성이 생긴다. 이는 v2 아키텍처 문서 TDD 전략 표에 "후속 Prisma"로 이미 예견되어 있던
지점이다).

## 2. 포트 & 어댑터 설계 (`packages/core/src/lotterietus`)

기존 `DrawDataPort`(읽기 전용, 앱이 사용)는 시그니처를 바꾸지 않는다. 수집 전용으로 포트 2개를 신설한다.

| 포트 | 위치 | 메서드 | 구현체 | 사용처 |
|---|---|---|---|---|
| `DrawDataPort` (기존) | `application/ports/draw-data.port.ts` | `getAllDraws()` | **`PrismaDrawDataAdapter`** (신규) | `apps/web` container |
| `DrawSourcePort` (신규) | `application/ports/draw-source.port.ts` | `fetchBatch(centerRound: number): Promise<readonly Draw[]>` | **`DhlotteryDrawSourceAdapter`** (신규) | `apps/worker`만 |
| `DrawWriterPort` (신규) | `application/ports/draw-writer.port.ts` | `getMaxRound(): Promise<number>`, `upsertDraws(draws): Promise<void>` | **`PrismaDrawWriterAdapter`** (신규) | `apps/worker`만 |

- `DummyDrawDataAdapter`는 코드는 남기되(테스트/시드 데이터 용도), `container.ts`의 기본값에서는 제외한다.
- Prisma 스키마·생성 클라이언트는 `packages/core/prisma/`에 두고, `packages/core`가 `@prisma/client`
  (런타임)와 `prisma`(devDep, CLI/마이그레이션)에 의존한다.
- 신규 유스케이스 `IngestDraws` (`application/usecases/ingest-draws.ts`)가 `DrawSourcePort` +
  `DrawWriterPort`를 조합해 §4의 백필/스케줄링 루프 한 사이클을 실행한다. `apps/worker`는 이 유스케이스를
  반복 호출하는 얇은 엔트리포인트만 갖는다.

## 3. DB 스키마

v2 아키텍처 문서 §5에 이미 합의된 스키마를 그대로 구현한다 (새로 정의하지 않음):

```prisma
// packages/core/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

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

- `picks` / `results` / `users` 테이블은 이번 스코프에 없다 (계속 InMemory).
- `docker-compose.yml`(레포 루트)은 Postgres 서비스 하나만 정의한다 — 로컬 개발 전용 자격증명, 볼륨
  마운트로 데이터 보존.

## 4. 백필 / 스케줄링 로직

"백필"(backfill) = 과거분 일괄 채우기 — 1회차(2002-12-07)부터 현재 최신 회차까지 DB가 비어 있는 구간을
최초 1회 몰아서 채우는 작업. 이후의 "주 1회 정기 수집"과 개념적으로 구분되지만, 재시작 시 상태가
꼬이지 않도록 **하나의 catch-up 루프로 통일**한다 — 백필과 정기 수집이 별도 모드가 아니라 매번 같은
경로를 탄다.

배경에서 확인했듯 이 엔드포인트는 "요청한 회차가 존재하는가"만 empty/non-empty로 알려주고 "그 창에
새 회차가 몇 개 있는가"는 응답을 직접 봐야 한다. 그래서 점프 폭(`step`)을 두고, 너무 앞서가서 빈
응답을 받으면 점프 폭을 줄여 재시도하는 방식으로 정확한 경계를 찾는다.

```
루프 (부팅 시 1회, 이후 반복):
  1. maxRound = writer.getMaxRound() (없으면 0)
  2. step = 10   // 한 번에 앞서가 볼 폭 — 성공하면 다시 10으로 리셋, 실패하면 절반으로 축소
  3. while true:
       - batch = source.fetchBatch(maxRound + step)
       - batch가 비어있지 않으면:
           - batch 중 maxRound보다 큰 회차를 모두 writer.upsertDraws()로 저장, maxRound = 그중 최댓값
           - step = 10 으로 리셋 (다시 크게 점프)
       - batch가 비어있으면 (maxRound + step 회차가 아직 존재하지 않음):
           - step === 1 이면 → maxRound가 실제 최신 회차로 확정, while 종료 ("다 따라잡음")
           - 아니면 step = max(1, floor(step / 2)) 로 줄여서 같은 maxRound로 재시도
       - 다음 요청 전 1초 대기 (requestDelayMs, 차단 방지)
  4. 다음 실행 시각 = nextDrawAt(now) + 여유 버퍼(10분)
     (packages/core/src/lotterietus/domain/schedule.ts의 nextDrawAt()을 그대로 재사용 — 새 계산 로직을
     만들지 않는다)
  5. 그 시각까지 대기 후 1번으로 복귀
```

이 알고리즘은 원격의 정확한 윈도우 계산 방식(창이 어느 쪽으로 당겨지는지 등)에 의존하지 않는다 —
"batch 안에서 maxRound보다 큰 회차만 취한다"는 규칙만으로 항상 정확하게 수렴하므로, 원격 동작이
바뀌어도(예: 창 크기·클램핑 방식 변경) 안전하다.

이 설계로 두 요구사항이 재시작 여부와 무관하게 하나의 로직으로 충족된다:

- **최초 백필**: 빈 DB에서는 3단계 루프가 1회차 근방부터 큰 점프(10)로 최신 회차까지 훑는다 (약
  1,234회차 ÷ 10 ≈ 124회 요청 ≈ 약 2분, 경계 근처의 축소 재시도로 몇 회 추가).
- **중단 후 재개**: 워커가 재시작되면 항상 `getMaxRound()`부터 이어서 시작하므로 미완료 백필이 자동
  재개된다.
- **정기 수집(주 1회)**: 완전히 따라잡은 뒤에는 다음 추첨 예정 시각까지 대기만 하므로, 결과적으로 실제
  원격 요청은 주 1회(+따라잡기 확인용 1~수회 호출)만 발생한다.

## 5. 스코프 경계 (이번에 하지 않는 것)

- `picks` / `results` / `users` 영속화는 그대로 InMemory 유지 — 이번 스펙은 draws 데이터 소스 교체 +
  수집 파이프라인에 한정한다.
- 별도 로깅/모니터링 인프라(Sentry 등) 구축 안 함 — MVP는 `console.log` 수준.
- `apps/web`이 Postgres 장애 시의 폴백(캐시/재시도)은 이번 스코프 밖 — 에러는 그대로 전파한다.
- `docker-compose.yml`은 Postgres 컨테이너만 포함 — `apps/web`/`apps/worker`는 기존처럼 로컬 `pnpm`
  실행.
- 인증/권한 없이 워커가 단독으로 Postgres에 직접 쓴다 (내부 전용 프로세스이므로 API 계층을 거치지 않음).

## 6. 마이그레이션 범위

**packages/core**
- 신규: `prisma/schema.prisma`, `@prisma/client` + `prisma` 의존성 추가
- 신규: `lotterietus/application/ports/draw-source.port.ts`, `draw-writer.port.ts`
- 신규: `lotterietus/application/usecases/ingest-draws.ts` (+ `.test.ts`, Fake 포트로 TDD)
- 신규: `lotterietus/infrastructure/adapters/prisma-draw-data.adapter.ts`,
  `dhlottery-draw-source.adapter.ts`, `prisma-draw-writer.adapter.ts`
- 유지: `dummy-draw-data.adapter.ts` (코드는 남김, container.ts 기본값에서만 제외)

**apps/worker (신규 앱)**
- `package.json`, `tsconfig.json`, `src/main.ts` (실 어댑터 조립 + §4 루프 실행)
- `@fortuna-lottery/core`의 `application`/`infrastructure` subpath를 직접 import (인프라 엔트리포인트이므로
  기존 `apps/web`의 ESLint 경계 규칙과 동일한 원칙 적용 — 단, 이 앱엔 FE 모듈이 없으므로 별도 경계 설정
  불필요)

**apps/web**
- `server/container.ts`: `createDummyDrawDataAdapter()` → `createPrismaDrawDataAdapter()`로 교체

**레포 루트**
- 신규: `docker-compose.yml` (Postgres 단일 서비스)
- 신규: `.env.example` (`DATABASE_URL` 문서화), `apps/web/.env.local` / `apps/worker/.env`에 실제 값 설정

## 7. 테스트 계획

- `ingest-draws.ts` 유스케이스: `DrawSourcePort`/`DrawWriterPort`를 Fake로 주입해 TDD로 먼저 작성 —
  "`step`이 10→5→...→1로 축소되다 `step===1`에서 빈 배치를 받으면 종료", "배치 성공 시 `step`이 다시
  10으로 리셋되는지", "재개 시 `getMaxRound()`부터 시작", "요청 사이 `sleep` 호출 횟수/인자" 등을 검증.
- `nextDrawAt`은 기존 테스트가 이미 있으므로 재사용만 하고 추가 테스트 없음.
- `DhlotteryDrawSourceAdapter` / `PrismaDrawDataAdapter` / `PrismaDrawWriterAdapter`는 실 네트워크/DB에
  의존하므로 단위 테스트 대상에서 제외하고, 로컬 Postgres가 떠 있을 때만 수동/통합 확인으로 검증한다.
