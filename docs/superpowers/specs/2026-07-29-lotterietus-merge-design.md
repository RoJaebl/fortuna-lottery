# 최근회차(draw) + 다음추첨(countdown) 모듈 병합 → `lotterietus`

## 배경

`draw`(최근 회차 조회)와 `countdown`(다음 추첨 카운트다운)는 각각 core(domain/application/dto/infrastructure)와
FE 모듈(view/viewmodel/model/transport/api)을 독립적으로 갖춘 완전한 Tier-2 도메인이었다. 두 도메인은
UI(`page.tsx`)에서 나란히 배치된 두 개의 카드였고, `countdown`의 유스케이스는 이미 `draw`의 `DrawDataPort`를
직접 참조해 같은 원본 데이터(전체 회차 목록)에 의존하고 있었다. 이 중복을 제거하고 하나의 도메인/모듈로
합친다.

## 1. 아키텍처

`draw`와 `countdown`을 폐기하고 새 도메인 `lotterietus`로 완전히 병합한다 (core + FE 전체).

```
packages/core/src/lotterietus/
├─ domain/          draw.ts(엔티티), schedule.ts(nextDrawAt) — 내용 그대로 이동
├─ application/
│  ├─ ports/draw-data.port.ts   — DrawDataPort 인터페이스, 이름 그대로 이동
│  └─ usecases/get-lotterietus-status.ts  — 단일 usecase (기존 getRecentDraws + getCountdown 대체)
├─ dto/lotterietus.dto.ts       — 단일 응답 DTO
└─ infrastructure/adapters/dummy-draw-data.adapter.ts  — 그대로 이동

apps/web/src/modules/lotterietus/
├─ view/lotterietus-card.tsx
├─ viewmodel/use-lotterietus.viewmodel.ts
├─ model/lotterietus.model.ts
├─ transport/assembler/lotterietus.assembler.ts
├─ api/client.ts
└─ index.ts
```

`DrawDataPort`(회차 원본 데이터 포트)와 `Draw` 엔티티는 이름을 바꾸지 않고 폴더 위치만 이동한다 — 의미상
"회차 데이터"라는 개념은 그대로이기 때문이다. 단, 이 포트는 `statistics`, `results`, `simulation`
유스케이스도 직접 import하고 있으므로, 해당 3개 도메인의 import 경로도 함께 수정해야 한다 (§4 참고).

API/컴포지션도 하나로 줄어든다: `/api/draws` + `/api/countdown` → `/api/lotterietus` 단일 엔드포인트,
`container.ts`의 `getRecentDraws` + `getCountdown` → `getLotterietusStatus` 단일 함수. 기존에 각
유스케이스가 따로 `drawData.getAllDraws()`를 호출하던 중복도 제거된다.

## 2. DTO / 데이터 흐름

플랫 구조로 병합한다:

```ts
export interface LotterietusStatusResponse {
  round: number;
  numbers: number[];
  bonus: number;
  drawnAt: string;
  nextRound: number;
  nextDrawAt: string;
}
```

`round`/`nextRound`, `drawnAt`/`nextDrawAt`처럼 접두어로 이미 구분되어 있어 필드 충돌이 없고, 기존 두
DTO의 필드를 그대로 나열한 것이라 assembler/뷰모델 변경 범위가 작다. 유스케이스는
`drawData.getAllDraws()`를 한 번만 호출해서 최신 회차(`draws[draws.length - 1]`)와
`nextDrawAt(clock())`/`nextRound`를 함께 계산한다.

## 3. UI 설계

`shared/ui/card.tsx`의 `Card`는 title/subtitle 슬롯이 하나뿐이므로, 두 섹션을 `children` 안에서 서로
다른 타이포그래피 위계로 배치한다 — 최근 회차는 "제목"처럼 부각하고, 다음 추첨 카운트다운은 "설명"처럼
축소한다. 두 섹션 사이 구분선(`border-t`)은 넣지 않는다.

```tsx
<Card title="로또 현황">
  <div>
    <p className="text-xs text-slate-500">최근 회차 · 제{data.round}회 · {formatDrawDate(data.drawnAt)} 추첨</p>
    <div className="mt-1.5 flex items-center gap-2">
      {data.numbers.map((n) => <Ball key={n} n={n} size="lg" />)}
      <span className="mx-1 text-slate-400">+</span>
      <Ball n={data.bonus} size="md" />
    </div>
  </div>
  <div className="mt-4">
    <p className="text-xs text-slate-400">다음 추첨까지 · 제{data.nextRound}회 · 매주 토요일 20:35</p>
    <p className="mt-1 text-sm font-medium tabular-nums text-slate-500">{remaining ?? "…"}</p>
  </div>
</Card>
```

- **최근 회차**: 공 크기를 `lg`로 키우고(보너스는 `md`), 시각적 무게중심을 여기로 이동
- **다음 추첨까지**: 라벨은 `text-slate-400`, 카운트다운 숫자는 `text-sm font-medium text-slate-500`
  (기존 `text-3xl font-bold text-emerald-600`에서 강조색 제거) — 보조 정보로 인식되게 함
- `page.tsx`의 2칸 그리드(`grid-cols-1 lg:grid-cols-2`)는 사라지고 `<LotterietusCard />` 하나로 대체된다

## 4. 마이그레이션 범위

**core (`packages/core/src/`)**
- `draw/` → `lotterietus/`로 전체 이동 (domain, application/ports, infrastructure 그대로,
  application/usecases는 `get-recent-draws.ts` 삭제 후 `get-lotterietus-status.ts` 신설)
- `countdown/` 폴더 삭제, `domain/schedule.ts`(`nextDrawAt`)만 `lotterietus/domain/`으로 이동
- `dto/draw.dto.ts` + `dto/countdown.dto.ts` → `dto/lotterietus.dto.ts` 단일 파일
- **import 경로 수정 필요 (3개 도메인 + 그 테스트)**:
  `statistics/application/usecases/get-statistics.ts`,
  `results/application/usecases/check-results.ts` (+ `check-results.test.ts`),
  `simulation/application/usecases/backtest-combination.ts` —
  `../../../draw/application/ports/draw-data.port` → `../../../lotterietus/application/ports/draw-data.port`
  (및 `../../../draw/domain/draw` → `../../../lotterietus/domain/draw`)
- 테스트 이동: `dummy-draw-data.adapter.test.ts` → 그대로 이동, `countdown/domain/schedule.test.ts` →
  `lotterietus/domain/schedule.test.ts`

**apps/web**
- `modules/draw/` + `modules/countdown/` → `modules/lotterietus/` 신설, 기존 두 폴더 삭제
- `format-remaining.test.ts` → `lotterietus/viewmodel/`로 이동 (내용 그대로, `formatRemaining`은 병합
  뷰모델에 남김)
- `app/api/draws/route.ts` + `app/api/countdown/route.ts` → `app/api/lotterietus/route.ts` 단일 파일
- `server/container.ts`: `getRecentDraws` + `getCountdown` import/필드 → `getLotterietusStatus` 하나로
- `app/page.tsx`: `LatestDrawCard` + `CountdownCard` import 및 2칸 그리드 → `LotterietusCard` 하나로

## 5. 테스트 계획

기존 테스트(`dummy-draw-data.adapter.test.ts`, `schedule.test.ts`, `format-remaining.test.ts`)는 내용
변경 없이 새 경로로 이동 — 로직 자체는 바뀌지 않으므로 그대로 통과해야 한다. 신규로 필요한 테스트:

- `get-lotterietus-status.ts` usecase 테스트 (TDD로 먼저 작성): `drawData.getAllDraws()`가 한 번만
  호출되는지, 응답 필드가 §2의 플랫 DTO 형태와 일치하는지
- statistics/results/simulation의 기존 테스트는 로직 변경이 없다 — import 경로만 바뀌므로 회귀 확인용으로
  그대로 재실행해 통과를 확인한다
