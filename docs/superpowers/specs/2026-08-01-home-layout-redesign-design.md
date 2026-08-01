# 홈 페이지 레이아웃 재설계 — "앱 홈 + 탭 드릴다운"

## 배경

`app/page.tsx`는 헤더 아래 `LotterietusCard`(최근 회차 + 다음 추첨) 하나, 그 아래
`xl:grid-cols-[420px_1fr]` 2단 그리드로 좌측에 생성기·시뮬레이션·내 번호·결과 확인 카드 4개,
우측에 통계 카드 8개(`ProbabilityReality`, `SumDistributionChart`, `FrequencyHeatmap`,
`PatternDistribution`, `HotColdBoard`, `TopPairsList`, `NumberFrequencyBars`, `RecentGrid`)가
전부 동시에 쌓여 있다. 카드가 총 13개가 한 화면에 나열되는 구조라 다음 문제가 있었다:

- 서비스만의 정체성 없이 카드가 그냥 나열됨
- 통계 패널만 카드 8개가 동시에 보여 정보 과부하
- 생성 → 참고 → 검증 → 저장 → 확인이라는 작업 흐름이 화면 순서에 드러나지 않음
- 2단 그리드가 데스크톱 전제라 모바일에서 불편함

사용자가 원하는 톤은 핀테크/투자 앱(토스·업비트류) — 데이터는 정직하게, UI는 깔끔하고 신뢰감
있게. 흐름은 하이브리드: "번호 생성"만 명확히 단계화하고, 나머지(통계·시뮬레이션·내 번호·결과
확인)는 언제든 접근 가능한 보조 패널로 둔다. 모바일과 데스크톱은 동등하게 중요하다.

## 1. 전체 구조 (IA)

```
헤더        로또랩 브랜드 + IdentityBadge (기존 그대로 — 실재하지 않는 "내 픽"/"알림" 메뉴는 추가하지 않음)
Hero        LotterietusCard 내용(최근 회차 + 다음 추첨 카운트다운)을 배너형으로 확장
            + "번호 생성하기" CTA
생성기 패널  CTA 클릭 시 Hero 바로 아래 펼쳐짐 (GeneratorCard 내용 그대로, 컨테이너만 변경)
탭바        [통계] [시뮬레이션] [내 번호] [결과 확인]  ← 각 카드의 기존 title을 탭 라벨로 그대로 사용
탭 콘텐츠   선택된 탭 하나만 렌더링
```

기존 5개 카드(생성기·시뮬레이션·내 번호·결과 확인·통계)의 **뷰 내부 마크업은 그대로 재사용**하고,
이를 감싸는 컨테이너 구조만 "동시에 쌓인 카드"에서 "Hero + 탭"으로 바꾼다. `shared/ui/card.tsx`의
`Card`도 그대로 유지 — 각 탭 콘텐츠 안에서 여전히 `Card`로 감싼다.

**신규 컴포넌트**: `shared/ui/tabs.tsx` (범용 탭 프리미티브, 항목 배열 + 활성 키 + `onChange`를 받는
형태) 하나만 추가한다. 최상단 탭바와 통계 탭 내부의 8개 서브탭 양쪽에서 재사용하되, 시각적 스타일은
§5에서 서로 다르게 준다.

`xl:grid-cols-[420px_1fr]` 2단 그리드는 완전히 사라진다 — 탭 전환으로 화면을 온전히 쓰며,
데스크톱에서도 좌측에 생성기가 상시 고정되어 있지 않는다.

## 2. Hero + 생성기 인터랙션

- **Hero (배너형)**: `LotterietusCard`를 `Card`가 아닌 강조된 배너 스타일로 재구성. **최근 회차
  볼 표시와 다음 추첨 카운트다운을 동일한 시각적 비중으로 배치**(데스크톱: 좌우 배치, 모바일: 세로
  스택하되 크기·강조는 동등)하고, 그 아래 `번호 생성하기` CTA 버튼을 둔다.
- **CTA 클릭 시**: Hero 바로 아래에 `GeneratorCard` 내용(모드 토글·번호 그리드·생성 버튼)이 펼쳐진다.
  이미 펼쳐진 상태에서 다시 누르면 접힌다 — 단순 토글 상태 `isGeneratorOpen` 하나만 추가.
- **생성 완료 후**: 패널은 접히지 않고 그대로 열려 있다 — 결과 볼이 그 안에 표시되고, 사용자가 바로
  아래 탭바에서 시뮬레이션/내 번호로 이어갈 수 있다.
- 최초 진입 시 기본 상태는 **접힘** — Hero는 "현재 상황 확인"에 집중하고, 생성은 사용자의 명시적
  액션으로 남긴다.

## 3. 탭 콘텐츠 매핑

| 탭 라벨 | 내용물 (기존 카드 재사용) | 데이터 의존성 |
|---|---|---|
| 통계 | `StatisticsPanel` — 단, 내부를 8개 동시 그리드에서 서브탭 구조로 변경 (§4) | `myNumbers` (`currentNumbers`) |
| 시뮬레이션 | `SimulationCard`("타임머신 시뮬레이션") 그대로 | `numbers` (`currentNumbers`) |
| 내 번호 | `PicksCard`("내 번호") 그대로 | `currentNumbers` (저장용) |
| 결과 확인 | `ResultsCard`("결과 확인") 그대로 | 없음 (자체 대조 버튼) |

**최상단 탭 기본 선택**: **통계** — "사기 전에, 데이터로 확인하세요"라는 제품 원칙과 일치시킨다.

## 4. 통계 탭 서브 구조

8개 서브탭을 모두 동등하게 나열한다 (요약/우선순위 압축 없이): 확률 현실 · 합계 분포 · 히트맵 ·
패턴 분포 · 핫/콜드 · 상위 페어 · 빈도 바 · 최근 그리드. 서브탭도 하나만 렌더링 — 기존처럼 8개를
한 화면 그리드로 동시에 표시하지 않는다. **기본 선택 서브탭은 확률 현실**(정직성 원칙을 가장 먼저
보여주는 화면)로 지정한다.

서브탭 선택 상태(`activeStatView`)는 `StatisticsPanel` 내부 로컬 상태로 캡슐화한다 — `page.tsx`가
알 필요 없는, 통계 모듈 내부 관심사다.

## 5. 반응형 규칙

| 요소 | 데스크톱 | 모바일 |
|---|---|---|
| Hero | 좌우 배치 (카운트다운 \| 최근 회차 볼), 큰 타이포 | 세로 스택, 동일 비중 유지 |
| 생성기 패널 | Hero 아래 고정폭 | 전체 폭 |
| 최상단 탭바(4개) | 가로 나열, 라벨 전체 노출 | 가로 나열 유지 (4개는 화면폭에 들어가 스크롤 불필요) |
| 통계 서브탭(8개) | 가로 나열, 필요시 줄바꿈 | 가로 스크롤 칩 (한 줄 고정, `overflow-x`) |
| 탭 콘텐츠 | 최대폭 제한(`max-w-screen-2xl` 유지) | 전체 폭, 좌우 패딩만 |

## 6. 데이터 흐름 & 상태 관리

모든 신규 상태는 `page.tsx`에 위치한다 — 라우트는 모듈 조립만 한다는 경계 규칙을 그대로 지킨다.

- `currentNumbers: number[] | null` — 기존과 동일, 생성기가 채우고 시뮬레이션/내 번호/통계에 prop으로
  흐른다.
- `isGeneratorOpen: boolean` — 신규, Hero CTA 토글.
- `activeTab: "statistics" | "simulation" | "picks" | "results"` — 신규, 기본값 `"statistics"`.
- `activeStatView`(통계 서브탭)는 `StatisticsPanel` 내부 로컬 상태 — page 상태에 포함하지 않는다.

## 7. 색상 톤 구분

디자인 시스템 문서(`.claude/context/design-system.md`)의 기존 토큰 안에서만 조정한다 — 새 색상은
추가하지 않는다.

- **CTA / 액션 버튼** (번호 생성하기, 생성기 모드 토글 선택 상태 등): 기존 그대로 `emerald-600` 채움
  — "실행"을 의미.
- **최상단 탭바 (4개, 내비게이션)**: 채움 필 대신 **밑줄(underline) 방식**. 활성 탭은
  `text-slate-900` + `border-b-2 border-slate-900`, 비활성은 `text-slate-500`. CTA와 시각적으로
  구분되어 "지금 실행 중"과 "지금 보고 있는 화면"이 헷갈리지 않는다.
- **통계 서브탭 (8개)**: 작은 칩 형태. 활성 `bg-slate-900 text-white`, 비활성
  `bg-slate-100 text-slate-500` — emerald를 쓰지 않아 CTA와 구분하고, 최상단 탭(밑줄)과도 시각적
  위계 차이를 둬서 "탭 안의 탭"임을 인지시킨다.

기존 컴포넌트(`Ball`, 로또 공 색상, `accent-warning` 각주 등)는 손대지 않는다.

## 8. 테스트 계획

이 변경은 **레이아웃/프레젠테이션 전용**이다 — `packages/core`나 각 모듈의 `viewmodel`(비즈니스
로직)은 건드리지 않는다. 기존 뷰가 쓰던 훅(`useGeneratorViewModel`, `useSimulationViewModel` 등)과
데이터 흐름은 그대로이므로, 기존 테스트(`format-remaining.test.ts`, `presenters.test.ts`,
`pick-transport.test.ts`)는 수정 없이 그대로 통과해야 한다.

새로 추가되는 로직 중 테스트 대상:

- `shared/ui/tabs.tsx`: 순수 프레젠테이션 컴포넌트(활성 키를 받아 렌더링)라 이 저장소의 기존
  관례상 별도 단위 테스트를 두지 않는다 (`Card`, `Ball`도 테스트 없음).
- Hero의 `isGeneratorOpen` 토글, `page.tsx`의 `activeTab`/`StatisticsPanel`의 `activeStatView`
  상태: 단순 `useState` UI 상태이며, 기존 프로젝트에서도 `page.tsx`류 조립 코드에는 테스트를 두지
  않는 관례를 따른다.
- 통계 서브탭 기본값 결정처럼 **분기 로직이 생기면** (예: "이 회차엔 상위 페어 데이터가 없으면
  다른 탭으로 폴백" 같은 규칙이 추가될 경우) 그 부분만 `presenters.ts`에 순수 함수로 분리해 TDD로
  작성한다.

이번 작업은 새 테스트 파일 추가보다 **기존 테스트가 깨지지 않는 것**이 검증 기준이다. `pnpm lint`
(import 경계 규칙)와 `pnpm test`(회귀 확인)로 충분하다.

## 9. 마이그레이션 범위 (구현 계획 참고용 요약)

**apps/web**
- `shared/ui/tabs.tsx` 신설
- `modules/lotterietus/view/lotterietus-card.tsx`: `Card` 기반 → 배너형 Hero 마크업으로 교체,
  카운트다운/최근 회차 동등 비중 배치
- `modules/generator/view/generator-card.tsx`: 마크업 내용 자체는 유지, `page.tsx`에서
  `isGeneratorOpen`으로 렌더 여부만 제어 (컴포넌트 자체는 변경 없을 수도 있음 — page 조립 로직만
  바뀜)
- `modules/statistics/view/statistics-panel.tsx`: 8개 동시 그리드 렌더 → `Tabs` 기반 서브탭
  렌더로 교체, 로컬 상태 `activeStatView` 추가
- `app/page.tsx`: 헤더 + Hero + 생성기 토글 패널 + 최상단 `Tabs`(4개) + 선택된 탭 콘텐츠로 전면
  재작성. `currentNumbers` prop 흐름은 유지.

**변경 없음**: `packages/core/**` 전체, 각 모듈의 `viewmodel/`·`model/`·`transport/`·`api/`,
디자인 시스템 색상 토큰.
