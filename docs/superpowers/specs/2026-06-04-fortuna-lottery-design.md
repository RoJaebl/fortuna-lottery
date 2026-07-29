# fortuna-lottery 설계 문서

- 작성일: 2026-06-04
- 상태: 설계 확정 (구현 계획 단계로 진행 예정)

## 1. 제품 개요

사용자가 **실제 로또(6/45)를 사기 전에**, 과거 회차 데이터를 근거로 통계적 사실을 확인하고 **스스로 번호를 골라 결정**하도록 돕는 의사결정 도우미 서비스. 몰입감 있는 UX(도파민 장치)로 경험을 즐겁게 만들되, 통계는 정직하게 제시해 신뢰를 쌓는다. 초기에는 충분한 사용 데이터를 수집해 신빙성을 확보하고, 이후 구독제로 고도화한다.

### 핵심 설계 원칙
- 로또 추첨은 매 회차 독립 사건이며, 과거 통계는 미래 당첨 확률을 높이지 못한다.
- "신빙성"의 핵심은 통계를 **정직하게** 보여주는 것이다. 도파민 장치는 그 위에서 경험만 즐겁게 만드는 역할이다.
- 핫/콜드·확률 지표에는 "미래 예측이 아님"을 명시한다. 정직함이 구독 전환에 필요한 신뢰를 만든다.

### 사용자 핵심 루프
1. **번호 만들기** — 자동 / 부분 선택 / 직접 입력으로 6개 번호 생성, 단순하게 표시
2. **통계 신뢰도 확인** — 이 조합/패턴이 과거 데이터에서 어땠는지 정직하게 시각화
3. **도파민 피드백 + 저장** — 몰입 연출로 "내 번호" 확정·저장 (실제 구매는 사용자가 오프라인/공식 경로로)
4. **결과 추적 & 데이터 수집** — 매주 당첨 번호 대조, 기록 누적 → 신빙성 데이터 축적 → 향후 구독 기능 토대

## 2. 기술 스택 / 운영 결정

| 항목 | 결정 |
|---|---|
| 프론트엔드 | Next.js (App Router), shadcn/ui, Playwright(E2E) |
| 백엔드 | NestJS, Prisma ORM, Supabase(Postgres + Auth) |
| 아키텍처 | FMA(Frontend Micro Architecture) — **모듈러 모놀리스**. 백엔드는 NestJS 도메인 모듈 + 헥사고날(포트&어댑터) |
| 모노레포 | 단일 프로젝트 폴더, pnpm 워크스페이스 + Turborepo |
| 개발 방식 | TDD (Red → Green → Refactor) |
| 데이터 소스 | 1단계는 더미/생성 데이터, 모범 아키텍처·개발 사이클 구축 후 실데이터 연동 (포트로 추상화) |
| 계정/인증 | Supabase Auth, **게스트 + 로그인 혼합** |
| 플랫폼 | **데스크톱 우선**, 반응형 축소 대응 |
| 언어 | 한국어 UI |

## 3. 기능 범위 (MVP)

### 도파민 / 몰입 장치
- **번호 단순 표시** — 화려한 추첨 리빌 연출 없이 번호를 단순하게 표시 (출석 스트릭 제외)
- **타임머신 시뮬레이션** — "이 번호를 과거 전 회차에 넣었다면?" 몇 등 몇 번 당첨됐을지 즉시 제시 (몰입 + 교육)
- **다음 추첨 카운트다운** — 이번 주 추첨까지 D-day / 타이머
- **패턴 희귀도 배지** — 조합 패턴(홀짝·구간 등)의 과거 출현 빈도 기준 희귀도를 사실 기반으로만 표기
- **근접 결과 하이라이트** — 결과 확인 시 근접 정도를 표시하되 과장 없이 사실대로 (다크패턴 회피)
- **소셜 증거** — "N명이 이 조합 저장" 등. 데이터가 쌓인 뒤 의미가 생기므로 구조만 마련(후속 단계)

### 통계 시각화 (모두 과거 회차 데이터 기반 사실)
1. **출현 빈도 히트맵** — 공 색은 실제 로또 공 색깔(1–10 노랑·11–20 파랑·21–30 빨강·31–40 회색·41–45 초록) 유지, 빈도는 공 색을 바꾸지 않고 **공 주변 강조(글로우/링 강도)** 로 표현
2. **번호 합계 분포 + 내 위치** — 전 회차 6개 합계의 분포(종형 곡선) 위에 내 조합 합계 위치 표시
3. **당첨 확률 현실 시각화** — 1/8,145,060을 직관적으로 체감시키는 연출 (정직성 핵심)
4. **홀짝 · 고저(1-22/23-45) · 구간(1-10·11-20…) 분포** — 내 조합이 과거 패턴과 얼마나 닮았나
5. **미출현 기간(핫/콜드)** — 각 번호가 몇 회째 안 나왔는지 (미래 예측력 없음 명시)
6. **동시 출현 페어** — 함께 자주 나온 번호쌍을 네트워크/매트릭스로
7. **회차별 잔디밭(컨트리뷰션 그래프)** — 가로축 회차 / 세로축 1–45, 해당 회차에 나온 번호 칸을 색 사각형으로 칠하는 표
8. **번호별 출현 확률 막대 그래프** — 1–45 각 번호의 출현 빈도/확률을 막대로

## 4. 도메인 모듈 (FMA ↔ MSA 1:1 대응)

| 모듈 | 프론트(FMA) | 백엔드(NestJS 도메인) |
|---|---|---|
| **draw** | 최근 회차 표시 | `DrawDataPort` + **DummyDrawDataAdapter** (후속 실데이터 어댑터) |
| **generator** | 자동/부분/직접 입력, 단순 표시 | 조합 생성·검증 유스케이스 |
| **statistics** | 8종 시각화 | 순수 통계 계산 서비스 (TDD 핵심) |
| **simulation** | 타임머신 결과 | 전 회차 백테스트 유스케이스 |
| **picks** | 저장/목록 (로그인) | Prisma 저장소(Supabase) |
| **results** | 당첨 대조·근접 하이라이트 | 채점 유스케이스 |
| **countdown** | 다음 추첨 D-day 타이머 | 추첨 스케줄 제공 |
| **identity** | Supabase Auth UI, 게스트 게이팅 | 인증 가드 / 사용자 |
| **social-proof** | (후속) 자리만 확보 | (후속) |

## 5. 백엔드 아키텍처 (NestJS · 헥사고날)

의존성은 항상 안쪽(Domain)을 향한다. 외부 연동은 Adapter로 격리해, 더미 데이터를 실데이터로 교체해도 Domain/Application은 수정하지 않는다.

### 모듈 3계층 (예: statistics)
- **① Domain** (순수, 프레임워크 무관): 엔티티 `Draw`, `NumberCombination`(6개·1~45·중복없음 검증), 도메인 서비스(빈도·합계·홀짝·구간 계산 = 순수함수)
- **② Application** (유스케이스 + 포트): `GetFrequencyStats`, `BacktestCombination` …, `DrawDataPort` 인터페이스 정의 (데이터 출처를 모름)
- **③ Infrastructure** (어댑터): Nest Controller(HTTP)·DTO, Prisma 저장소, `DummyDrawDataAdapter` ⇄ (후속) `RealDrawDataAdapter`

### 폴더 구조 (apps/api)
```
apps/api/src/
├─ modules/
│  ├─ draw/
│  │  ├─ domain/                 엔티티·VO
│  │  ├─ application/            유스케이스·ports
│  │  │   └─ ports/draw-data.port.ts
│  │  └─ infrastructure/
│  │      ├─ http/               controller·dto
│  │      └─ adapters/
│  │          ├─ dummy-draw-data.adapter.ts
│  │          └─ prisma-*.repository.ts
│  ├─ statistics/   (동일 3계층)
│  ├─ simulation/
│  ├─ generator/
│  ├─ picks/
│  ├─ results/
│  ├─ countdown/
│  └─ identity/
├─ shared/                       공통 타입·에러·결과 래퍼
└─ prisma/                       schema.prisma
```

핵심: `DrawDataPort` 하나로 더미↔실데이터를 교체한다. 통계 계산은 순수 도메인 서비스라 TDD가 쉽고, Controller·Prisma는 어댑터로 격리한다.

## 6. 프론트엔드 아키텍처 (Next.js · FMA 모듈러 모놀리스)

단일 앱이지만 기능 모듈을 엄격히 격리한다. 각 모듈은 공개 API(`index.ts`)로만 외부와 소통한다.

### 모노레포 루트
```
fortuna-lottery/
├─ apps/
│  ├─ web/                Next.js (App Router)
│  └─ api/                NestJS
├─ packages/
│  └─ contracts/          공유 타입·DTO (FE·BE 단일 소스)
├─ pnpm-workspace.yaml
└─ turbo.json
```
FE의 api-client와 BE의 DTO가 `contracts`를 함께 참조해 타입 어긋남을 방지한다.

### apps/web 내부
```
apps/web/src/
├─ app/                   라우트(얇게, 모듈 조립만)
├─ modules/
│  ├─ statistics/
│  │  ├─ ui/              시각화 컴포넌트
│  │  ├─ model/           hooks·상태
│  │  ├─ api/             api-client
│  │  ├─ types.ts
│  │  └─ index.ts         공개 API만
│  ├─ generator/  simulation/
│  ├─ picks/  results/  countdown/
│  └─ identity/
└─ shared/
   ├─ ui/                 shadcn 프리미티브
   ├─ lib/                fetcher·utils
   └─ config/
```

### 경계 규칙
- 모듈은 `shared`와 자기 내부만 import한다.
- 모듈끼리는 공개 `index.ts`로만 소통한다 (deep import 금지).
- 라우트(`app/`)는 모듈을 조립만 하고 로직을 두지 않는다.
- ESLint 경계 규칙으로 위반을 차단한다.

### UI / 데이터
- shadcn/ui를 `shared` 디자인 시스템으로 사용.
- 차트 라이브러리로 8종 통계를 렌더.
- 데스크톱 우선, 반응형 축소 대응.
- 서버 통신은 `shared` fetcher 단일 경로.

## 7. 데이터 흐름 (예: 출현 빈도 통계 보기)

```
[web] statistics/ui → statistics/api-client → shared/fetcher
        │                                         │ HTTP (packages/contracts 타입)
        ▼                                         ▼
[api] infrastructure/http Controller → application GetFrequencyStats(유스케이스)
                                            │ DrawDataPort (인터페이스)
                                            ▼
                       infrastructure DummyDrawDataAdapter (→ 후속 RealAdapter)
                                            │ 과거 회차 데이터
                                            ▼
                       domain StatisticsService(순수 계산) → DTO → web 시각화 렌더
```

## 8. TDD 전략 (Red → Green → Refactor)

| 대상 | 테스트 종류 | 비고 |
|---|---|---|
| **domain** 통계계산·조합검증·백테스트 채점 | 단위 (다수·빠름) | 순수함수 → TDD 주력 |
| **application** 유스케이스 | 단위 (Port를 Fake로 주입) | `DrawDataPort` 가짜 주입 |
| **adapters** Prisma·Dummy | 통합 | 테스트 DB / 생성 데이터 검증 |
| **controllers** | E2E (supertest) | 게스트/로그인 게이팅 포함 |
| **web** 컴포넌트·hooks | 단위 (testing-library) | 시각화 렌더·상태 |
| **핵심 플로우** 생성→통계→저장 | Playwright | 데스크톱 E2E |

## 9. 에러 처리 / 검증

- **조합 검증**: 6개·중복 없음·1~45 범위 (도메인 계층에서 수행).
- **표준 에러 래퍼** + HTTP 상태 매핑.
- **게이팅**: 보호 기능(저장·기록·결과추적)은 비로그인 시 401 → 로그인 유도. 둘러보기·번호 생성·통계는 게스트도 가능.

## 10. 정직성 장치 (신뢰 확보)

- 핫/콜드·확률 지표에 "미래 예측이 아님" 명시.
- 당첨 확률 1/8,145,060 고정 계산·시각화.
- 모든 통계는 실제 데이터셋(1단계는 생성 데이터) 위에서만 산출.

## 11. 단계 구분

- **1단계 (현재 설계 대상)**: 모범 아키텍처 + TDD 사이클 + 더미/생성 데이터로 전 기능 구현.
- **2단계 (후속)**: `DrawDataPort`에 실데이터 어댑터 연결(동행복권 등 공개 회차 데이터), 자동 주간 업데이트.
- **3단계 (후속)**: 누적 데이터 기반 신빙성 강화, `social-proof` 활성화, 구독제 전환.
