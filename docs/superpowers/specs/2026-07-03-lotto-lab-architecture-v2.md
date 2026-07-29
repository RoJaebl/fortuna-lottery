# lotto-lab 아키텍처 설계 문서 v2 — 데이터 흐름 중심 재설계

- 작성일: 2026-07-03
- 상태: 확정 (본 문서 기준으로 MVP 구현 진행)
- 선행 문서: [2026-06-04-lotto-lab-design.md](./2026-06-04-lotto-lab-design.md) (제품 개요·기능 범위·정직성 원칙은 v1을 그대로 계승한다. 본 문서는 **애플리케이션 아키텍처와 데이터 흐름**을 재설계한 것이다.)

## 0. v1 대비 변경 요약

| 항목 | v1 | v2 (본 문서) |
|---|---|---|
| 백엔드 | NestJS 별도 앱 | **Next.js 단일 앱** — Route Handler가 HTTP 입구, 비즈니스는 `packages/core`(순수 TS) |
| 타입 공유 | `packages/contracts` | **`packages/core`의 DTO가 단일 타입 소스** (contracts 패키지 제거) |
| 아키텍처 관점 | 계층 경계(헥사고날) 중심 | **데이터 흐름(모델 타입 × 변환 이음새) 중심** + 헥사고날 원칙 유지 |
| 엄격도 | 전 모듈 균일 3계층 | **2-tier** — 쓰기 도메인은 풀 파이프라인, 읽기 도메인은 얇게 |
| 유지되는 것 | — | 순수 도메인·TDD·`DrawDataPort`·FMA 모듈 경계·정직성 장치·9개 도메인 구분 |

재설계 근거: 로또 6/45 데이터는 전 회차 ~1,200개·주 1회 append-only인 **작고 읽기 중심**의 데이터다. 서비스의 무게는 데이터 처리가 아니라 UX/시각화와 정직한 통계 표현에 있다. 따라서 백엔드 프레임워크의 무게를 걷어내되, **도메인 순수성과 변환 이음새(seam)는 엄격하게 유지**하여 후속 분리(v1의 A안: 도메인별 서비스 분리)로 무손실 마이그레이션이 가능하게 한다.

## 1. 설계 철학: 데이터 흐름이 아키텍처를 결정한다

일반적인 서비스는 클라이언트–프론트–백엔드–데이터의 골조를 가지며, 대부분의 아키텍처는 골조 간 경계 분리에 집중한다. 본 설계는 그와 동등하게 **각 도메인이 다루는 전용 데이터 모델(raw data)** 을 도메인 영역의 1급 시민으로 다룬다. 도메인별 데이터를 유기적으로 연결·운영하려면 **매퍼/어셈블러 같은 데이터 변환 레이어가 필수**이며, 이 변환 이음새가 곧:

1. **네트워크 절단선** — 단일 앱(B안)에서 도메인별 서비스 분리(A안)로 전환할 때 자르는 위치
2. **클라이언트 확장점** — 새로운 클라이언트(모바일 등)는 자기 쪽 변환 레이어만 추가
3. **테스트 경계** — 이음새마다 순수 함수라 단위 테스트가 자연스럽다

클라이언트 계층은 Flutter의 MVVM에서 **개념을 차용**한다(실제 Flutter 사용 아님). 단, 추후 다양한 시스템 확장을 위해 이음새는 엄격하게 유지한다.

## 2. 모델 타입 체계 (확정)

| 골조 계층 | 모델 타입 | 이름 규칙 | 역할 | 순수/영속 |
|---|---|---|---|---|
| Client (표현) | **ViewModel** | `use*ViewModel` / `*ViewModel` | Model 원형을 *인터페이스로만* 참조. 사용자에게 보여줄 파생값을 **순수 함수 presenter**로 구현 (정렬·공 색·홀짝 라벨·희귀도 배지·"예측 아님" 라벨 등) | 순수 |
| Frontend (원형) | **Model** | `*Model` (interface) | ViewModel이 의존하는 계약. 직접 인스턴스 로직 없음 | — |
| FE→BE (요청) | **Mapper** | `*RequestMapper` | FE Model → 요청 DTO 변환 | 순수 변환 |
| BE→FE (응답) | **Assembler** | `*ResponseAssembler` | 응답 DTO → FE Model 변환. ※ 헥사고날의 포트 구현체와 이름 충돌을 피하기 위해 "Adapter"라 부르지 않는다 | 순수 변환 |
| Backend (전송) | **DTO** | `*Request` / `*Response` | 와이어 계약. 클라이언트 무관 | 순수 |
| Backend (조합) | **VO** | `*VO` | 흩어진 도메인을 조합해 비즈니스/인터페이스 모델 구성·검증 (예: `CombinationVO` = 6개·1~45·중복 없음) | 순수 |
| Data (영속) | **Domain Entity** | `*Entity` | DB 테이블과 1:1. **단일 책임** (아래 §5) | 영속 |
| 파생 계산 | **Read-Model** | `*ReadModel` | Draw 데이터로부터 순수 계산되는 **비영속** 결과 (8종 통계·백테스트 등). DB 없음. 백엔드가 계산해 DTO로 제공 | 순수 |
| 인프라 (포트 구현) | **Adapter** | `*Adapter` | 헥사고날 포트의 구현체 (데이터 소스 교체용). "Adapter"라는 이름은 이 용도로만 사용 | — |

### 명명 충돌 규칙
- **Adapter** = 헥사고날 포트 구현체 전용 (`DummyDrawDataAdapter`, `RealDrawDataAdapter`, …)
- **Assembler** = BE→FE 응답 변환 전용 (`PickResponseAssembler`, …)

## 3. 2-tier 엄격도

모든 도메인에 7종 모델을 균일하게 강제하면 DB 테이블이 없는 읽기 도메인에 껍데기(VO·Entity)만 생긴다. 따라서:

| 티어 | 도메인 | 사용하는 모델 |
|---|---|---|
| **Tier-1** (풀 파이프라인) — 사용자 소유·쓰기 | `picks` `results` `identity` | ViewModel · Model · Mapper · Assembler · DTO · VO · Entity |
| **Tier-2** (얇게) — 읽기 전용·파생 | `draw` `statistics` `simulation` `generator` `countdown` | ViewModel · Model · Assembler · DTO · Read-Model (Mapper는 요청 본문이 있을 때만, VO/Entity 없음) |

`social-proof`는 v1과 동일하게 후속 단계로 자리만 확보한다.

운영하며 티어 배정이 맞지 않는 도메인이 발견되면 조정한다 (예: simulation에 저장 기능이 붙으면 Tier-1로 승격).

## 4. 전체 구조 (Lean Hexagonal on Next.js)

```
lotto-lab/
├─ apps/web/                              Next.js 단일 앱 (App Router)
│  ├─ app/
│  │  ├─ (routes)/…                       페이지 = 모듈 조립만 (로직 없음)
│  │  └─ api/<domain>/route.ts            HTTP 입구 = core 유스케이스 호출 (인프라 계층)
│  ├─ modules/                            ── FMA 프론트 모듈 ──
│  │  ├─ picks/                           [Tier-1]
│  │  │  ├─ view/                         *View 컴포넌트
│  │  │  ├─ viewmodel/                    PickViewModel (순수 presenter + hooks)
│  │  │  ├─ model/                        Pick (interface 원형)
│  │  │  ├─ transport/
│  │  │  │  ├─ mapper/                    PickRequestMapper   (FE→요청 DTO)
│  │  │  │  └─ assembler/                 PickResponseAssembler (응답 DTO→FE Model)
│  │  │  ├─ api/                          api-client (shared fetcher 사용)
│  │  │  └─ index.ts                      공개 API만 export
│  │  ├─ statistics/                      [Tier-2] view/ viewmodel/ model/ transport/assembler/ api/ index.ts
│  │  ├─ draw/ simulation/ generator/ countdown/ results/ identity/
│  └─ shared/                             ui(디자인 시스템) · lib(fetcher·utils) · config
│
├─ packages/core/                         ★ 프레임워크 0, 순수 TS — 단일 타입 소스
│  └─ src/
│     ├─ picks/                           [Tier-1]
│     │  ├─ domain/                       PickEntity, 규칙
│     │  ├─ application/
│     │  │  ├─ usecases/                  SavePick, ListPicks, DeletePick
│     │  │  ├─ ports/                     PickRepositoryPort
│     │  │  └─ vo/                        PickVO
│     │  ├─ dto/                          SavePickRequest, PickResponse   ← 와이어 계약
│     │  └─ infrastructure/adapters/      InMemoryPickRepository (MVP) → (후속) SupabasePickRepository
│     ├─ statistics/                      [Tier-2]
│     │  ├─ domain/                       순수 계산 함수 (frequency·sum·oddEven·zones·hotCold·pairs·grid·probability)
│     │  ├─ application/
│     │  │  ├─ usecases/                  GetStatistics …
│     │  │  ├─ ports/                     (draw의 DrawDataPort 사용)
│     │  │  └─ readmodel/                 FrequencyReadModel … (비영속)
│     │  └─ dto/                          StatisticsResponse …
│     ├─ draw/                            DrawDataPort + DummyDrawDataAdapter (→ 후속 RealDrawDataAdapter)
│     ├─ simulation/ generator/ results/ identity/ countdown/
│     └─ shared/                          Result 래퍼 · 에러 · 공통 VO(CombinationVO)
│
├─ pnpm-workspace.yaml · turbo.json
└─ (후속) prisma/schema.prisma            users / picks / results 만 — §5 규칙
```

### 의존성 방향 (헥사고날 원칙 유지)
`app/api`(인프라) → `core/application`(유스케이스) → `core/domain`(순수). 항상 안쪽을 향한다.

### import 경계 규칙 (ESLint로 강제 — 구현 1일차 필수)
1. FE `modules/**`는 `core/*/dto`만 **타입 import** 가능. `core`의 domain/application/infrastructure 접근 금지 → FE가 Entity를 절대 만질 수 없다.
2. `app/api/**`만 `core/*/application`·`infrastructure`를 런타임 import (유스케이스 조립·호출).
3. FE 모듈은 `shared`와 자기 내부만 import. 모듈 간 소통은 공개 `index.ts`로만 (deep import 금지).
4. 라우트(`app/(routes)`)는 모듈 조립만 하고 로직을 두지 않는다.

이 경계 규칙이 이음새를 지키는 유일한 물리적 방어선이다. 특히 B안(단일 프로세스)에서는 이음새가 "명예제"가 되기 쉬우므로 lint 위반 = CI 실패로 다룬다.

## 5. 데이터(영속) 설계 — 도메인 단일 책임 규칙

**하나의 테이블(Entity)은 하나의 데이터만 책임진다.** 사용자 테이블에는 사용자 고유 정보만 둔다. 다른 서비스 도메인이 사용자와 연결될 때는 사용자 테이블에 컬럼을 늘리지 않고, **(user_key + service_key) 조합의 전용 테이블**을 만든다.

```
users    : id PK, email, created_at            ← identity 도메인 전용 (인증/프로필만)
picks    : id PK, user_id FK, numbers[6], created_at        ← 사용자 소유, users에 pick 정보 없음
results  : (pick_id, draw_round) PK, matched_count, bonus_matched, rank, checked_at
draws    : round PK, n1..n6, bonus, drawn_at   ← 사용자 완전 무관, DrawDataPort로만 공급
```

이 규칙 덕분에 후속 A안 분리 시 **도메인이 테이블째로 잘려 나간다** (picks 서비스 분리 = picks 테이블 + core/picks 이동, users는 건드리지 않음).

MVP 단계 영속화: `PickRepositoryPort` 뒤에 **InMemoryPickRepository**(서버 프로세스 메모리)로 시작한다. Supabase(Postgres+Auth) 어댑터는 포트 구현체 교체로만 도입한다 — 유스케이스·DTO·FE 무수정.

## 6. 표준 데이터 흐름

### Tier-1 · 픽 저장 (쓰기, 전 파이프라인 관통)
```
[View]      PickCardView
   ↕ bind
[ViewModel] usePickViewModel — 순수 presenter (정렬·홀짝 라벨·희귀도 배지)
   ↓ depends on (interface)
[Model]     Pick (FE 원형)
   ↓ PickRequestMapper       (Pick → SavePickRequest)
  ════ HTTP POST /api/picks ════
[DTO]       SavePickRequest
   ↓ CombinationVO 검증 → PickVO 조합
[Usecase]   SavePick ── PickRepositoryPort ──▶ PickEntity → picks 테이블
   ↑
[DTO]       PickResponse 조립
  ════ HTTP ════
   ↑ PickResponseAssembler   (PickResponse → Pick)
[ViewModel] 상태 갱신 → 재렌더
```

### Tier-2 · 출현 빈도 통계 (읽기, 얇게)
```
[View]      FrequencyHeatmapView
   ↕ bind
[ViewModel] useStatisticsViewModel — 공 색(1–10 노랑·11–20 파랑·21–30 빨강·31–40 회색·41–45 초록)은
            바꾸지 않고 빈도를 글로우/링 강도로 매핑, "미래 예측 아님" 라벨
   ↑ StatisticsResponseAssembler ← StatisticsResponse(DTO)
  ════ HTTP GET /api/statistics ════
[Usecase]   GetStatistics → FrequencyReadModel 등 8종을 draws 1-pass로 계산 (비영속)
   ↓ DrawDataPort
[Adapter]   DummyDrawDataAdapter (시드 고정·결정적 생성 데이터) → (후속) RealDrawDataAdapter
```

성능: 통계 8종은 유스케이스가 `DrawDataPort`를 **한 번 읽어 한 패스로 계산**한다. 주 1회 갱신 데이터이므로 라우트에 캐시(ISR/`revalidate`)를 적용할 수 있다.

## 7. B→A 마이그레이션 메커니즘

`app/api/picks/route.ts`는 현재 `SavePick` 유스케이스를 인프로세스로 호출한다. picks를 별도 서비스(NestJS 등)로 분리할 때:

1. `core/picks`를 새 서비스로 이동해 컨트롤러로 감싼다 (DTO는 이미 와이어 계약).
2. `app/api/picks/route.ts`의 인프로세스 호출을 HTTP 클라이언트 호출로 교체한다.
3. **ViewModel·Model·DTO·Domain은 한 줄도 바뀌지 않는다.** DB는 §5 규칙 덕에 테이블째 분리된다.

새 클라이언트(모바일 등) 연결도 동일: DTO가 클라이언트 무관이므로 새 클라이언트는 자기 쪽 Mapper/Assembler/ViewModel만 구현한다.

## 8. TDD 전략 (v1 계승·구조 최적화)

| 대상 | 테스트 | 비고 |
|---|---|---|
| `core` domain (통계 계산·CombinationVO 검증·백테스트 채점) | 단위 (다수·빠름) | 순수 함수 — TDD 주력 |
| `core` usecases | 단위 (포트에 Fake 주입) | `DrawDataPort`/`PickRepositoryPort` Fake |
| adapters (Dummy·InMemory·후속 Prisma) | 단위/통합 | 결정성(시드)·계약 검증 |
| ViewModel presenter | 단위 | 순수 함수 (공 색·글로우·라벨) |
| Mapper / Assembler | 단위 | 순수 변환 — 왕복(round-trip) 검증 |
| route handlers | 통합 | 요청→응답 계약 |
| 핵심 플로우 (생성→통계→저장) | E2E (Playwright, 후속) | 데스크톱 |

## 9. MVP 범위 (본 문서 기준 구현 대상)

v1 §3 기능 범위를 계승하되, 1단계는 다음으로 확정:

- 번호 생성 (자동/부분/직접), CombinationVO 검증, 단순 표시
- 8종 통계 시각화 (빈도 히트맵·합계 분포+내 위치·확률 현실 시각화·홀짝/고저/구간·핫콜드·페어·잔디밭·번호별 막대)
- 타임머신 시뮬레이션 (전 회차 백테스트: 등수별 횟수)
- 다음 추첨 카운트다운 (토요일 20:35 KST)
- 픽 저장/목록/삭제 (MVP: 게스트 단일 사용자 + InMemory 저장소; 포트로 Supabase 후속 교체)
- 결과 대조 (저장 픽 vs 최신 회차, 근접 하이라이트 — 과장 없이)
- 정직성 장치: 핫/콜드·확률에 "미래 예측 아님" 명시, 1/8,145,060 고정
- 데이터: `DummyDrawDataAdapter` — 시드 고정 결정적 생성 (~1,180회차)

후속(2단계~): 실데이터 어댑터(동행복권), Supabase Auth(게스트+로그인 게이팅), social-proof, 구독제.

## 10. 리스크와 완화

| 리스크 | 완화 |
|---|---|
| ESLint 경계 없이는 이음새가 부식 | 스캐폴딩 1일차에 경계 규칙 도입, 위반 = 빌드 실패 |
| 인프로세스 이음새는 우회 가능(명예제) | 경계 규칙 + 코드 리뷰 |
| 통계 8종 × 모델 타입 반복 피로 | Tier-2 얇은 파이프라인 + 1-pass 계산 + 단일 `StatisticsResponse` |
| InMemory 픽 저장의 휘발성 | MVP 한정. 포트 뒤라 Supabase 교체 비용 최소 |
| 티어 배정 오판 | 운영하며 재조정 (문서 개정으로 추적) |
