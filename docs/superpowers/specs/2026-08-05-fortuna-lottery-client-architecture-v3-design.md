# fortuna-lottery — 클라이언트 아키텍처 v3 (View·Presenter·Action 재편)

작성일: 2026-08-05
선행 문서:
- `2026-07-03-fortuna-lottery-architecture-v2.md` (Next.js 위의 Lean Hexagonal + 2-tier 엄격도 — 본 문서는
  이 문서의 프론트 FMA 구조(`view/viewmodel/model/transport/api`)만 개정한다. 백엔드 `packages/core`의
  헥사고날 레이어·2-tier 엄격도·DTO 계약은 변경 없음)
참조 문서: `Project/회사/SNIT/ignition/tag-hero/docs/superpowers/specs/2026-08-04-tag-hero-architecture-v2.md`
  (같은 방향의 프론트 재편을 먼저 수행한 자매 프로젝트 문서 — 본 문서는 그 구조를 차용하되, 아래에서
  FortunaLottery 사정에 맞게 의도적으로 갈라지는 지점을 명시한다)
적용 범위: `apps/web/src/modules/**` 전체(7개 모듈) + `apps/web/src/app/page.tsx` — `packages/core`는 대상 아님
상태: 확정 (본 문서 기준으로 클라이언트 리팩터 → writing-plans)

---

## 0. 배경 — 왜 다시 손보는가

2026-07-03 아키텍처 v2 문서로 `view/viewmodel/model/transport/api` 5분할 FMA 구조를 확립하고 7개 모듈
(picks·results·identity·statistics·simulation·generator·lotterietus)에 적용했다. 실제 코드를 확인한 결과,
자매 프로젝트 tag-hero가 겪은 것과 같은 문제가 이미 있었다:

1. `use*ViewModel` 훅 하나가 서버 상태(fetch·busy·error)와 인터랙티브 UI 상태(generator의
   mode/selected, App 셸의 currentNumbers/isGeneratorOpen/activeTab)를 함께 떠안고 있다 — 성격이 다른
   두 책임이 한 훅에 섞였다.
2. presenter 순수 함수의 위치가 모듈마다 제각각이다 — statistics만 별도 `viewmodel/presenters.ts`로
   분리돼 있고, picks·simulation·lotterietus는 훅 파일 안에 같이 있으며, `statistics-panel.tsx`는 탭
   상태(`activeStatView`)를 View 컴포넌트 안에 직접 들고 있어 세 번째 패턴까지 섞여 있다.
3. `ViewModel`이 실제 타입이 아니라 훅의 리턴값(추론된 익명 객체)일 뿐 — `Model`과 아무 타입 관계가
   없다.

이번 개편은 tag-hero와 같은 방향(로직을 Action/Presenter로 분리, ViewModel을 Model과 실제 타입 관계를
갖는 타입으로 승격)으로 이 문제들을 바로잡는다. 다만 두 가지는 이 프로젝트 사정에 맞춰 tag-hero와
의도적으로 다르게 간다:

- **class 대신 TS interface 상속.** 기존 DTO·VO·Entity·ReadModel·Model이 전부 interface인 이 프로젝트의
  스타일과 일관되고, 매퍼 시그니처의 업캐스트 필드-숨김 효과도 TS의 구조적 타이핑만으로 동일하게
  얻는다 — class 상속은 컴파일 타임 정적 검사 이상의 런타임 이점을 추가하지 않는다(§3 참고).
- **ViewModel은 필드가 Model과 같아도 항상 별도로 만든다.** 두 레이어가 존재하는 이유(도메인 원형 vs
  뷰 전용 인스턴스)를 코드 구조로 항상 명시하기 위함이며, 2-tier YAGNI 철학(Tier-2에 VO/Entity를 억지로
  추가하지 않는 것)과는 별개의 결정이다.
- **Mapper/Assembler 용어를 Mapper 하나로 통일한다.** 두 개념은 상호 동등한 관계(요청/응답 변환)이므로
  굳이 이름을 나눌 이유가 없다 — tag-hero는 폴더만 합치고 이름은 Mapper/Assembler로 유지했지만, 본
  문서는 이름까지 Mapper로 완전히 통일한다(§5.1).
- **파일명은 camelCase + 점(.) 구분 접미사를 유지한다.** tag-hero의 PascalCase 파일명 규칙은 가져오지
  않는다 — 이 프로젝트는 이미 kebab-case였고, 이번에 camelCase로 전환하되 `<name>.model.ts` 같은
  점 구분 접미사 컨벤션은 그대로 유지한다(§5, §6).

백엔드(`packages/core`)의 헥사고날 레이어·2-tier 엄격도·DTO 계약은 이번 개편의 대상이 아니다 —
`apps/web/src/modules/**`와 App 셸(`apps/web/src/app/page.tsx`)에 한정된 순수 프론트 내부 구조 개정이다.

---

## 1. 핵심 개념 재정의

| 개념 | 이전 (v2, 2026-07-03) | 이후 (이번 개편) |
|---|---|---|
| **View** | 렌더링 전담, 자기 `use*ViewModel()`을 직접 호출 | 렌더링 전담 동일 + **Presenter·Action을 컴포넌트 내부에서 직접 호출·조립**하는 주체 |
| **ViewModel** | 훅의 리턴값 — 타입 없는 상태 뭉치 | **Model을 extends하는 실제 interface.** Action이 다루는 응답 데이터이자 View·Presenter가 쓰는 타입. 필드가 Model과 같아도 항상 만든다 |
| **Presenter** (신규 개념) | 없음 — 훅 안에 섞이거나(대부분), 별도 `viewmodel/presenters.ts`(statistics만), 또는 View 컴포넌트 안(`activeStatView`) | View 내부(또는 로직 4-5개 이상이면 `view/<domain>.presenter.ts`)의 함수/훅. **인터랙티브 UI 상태**(입력값·모드·탭 선택 등) + 렌더링 가공(순수 함수) 소유 |
| **Action** (신규 개념) | `viewmodel/use-x.viewmodel.ts`가 서버 상태까지 소유, `api/client.ts`는 상태 없는 fetch+변환 래퍼 | **서버 상태(로딩·에러·데이터)를 소유하는 훅**(`action/use<Domain><Verb>.action.ts`) — 기존 `api/client.ts`의 호출을 내부에 흡수 |
| **Mapper/Assembler** | `transport/mapper/*.mapper.ts`(요청) · `transport/assembler/*.assembler.ts`(응답) — 이미 폴더/역할 분리 | **Mapper로 완전 통일(Assembler 용어 폐기)**. `transport/mapper.ts` 단일 파일에 요청·응답 변환 함수를 모두 둔다 |
| **Model** | 도메인 `interface` | 변경 없음 |

**상태 소유 분리**: Action은 서버 상태(로딩·에러·데이터)를 소유하는 훅, Presenter는 인터랙티브 UI
상태(입력값·모드·정렬·탭 선택 등)를 소유하는 훅(또는 임계값 미만이면 View 안의 인라인 함수)이다. View는
이 둘을 컴포넌트 내부에서 직접 호출·조립한다. 모듈간 공유 상태(현재 생성된 조합·생성기 열림 여부·활성
탭)만 App 셸의 Presenter(`useHomePresenter`)가 갖고 props로 내려준다.

---

## 2. 프랙탈 구조 원칙 — App ⊃ 모듈 ⊃ 컴포넌트

View+Presenter+Action은 모듈 전용 패턴이 아니라 계층마다 같은 모양이 재귀되는 프랙탈 구조다(tag-hero
문서 부록 A와 동일한 원칙).

| 층위 | View | Presenter | Action |
|---|---|---|---|
| App(셸) | `app/page.tsx` | `app/home.presenter.ts`(`useHomePresenter`) — currentNumbers·isGeneratorOpen·activeTab | 없음 — App 자체는 서버 데이터를 패칭하지 않음 |
| 모듈 | `modules/<d>/view/*.tsx` | `modules/<d>/view/<d>.presenter.ts` | `modules/<d>/action/*.ts` |
| 컴포넌트(모듈이 커져 분리될 때) | 하위 컴포넌트(예: statistics의 8개 서브뷰는 이미 분리돼 있음) | 자기 로직이 4-5개 이상이면 자기 presenter | 독립적 데이터가 필요하면 자기 action |

임계값 규칙(렌더링·인터랙티브 로직이 4-5개 이상이면 별도 파일로 분리)은 모든 층위에 동일 적용된다.
statistics는 이미 이 임계값을 넘겨 8개 서브뷰로 분리돼 있으므로 그 구조는 유지하고, `viewmodel/
presenters.ts`(9개 순수 함수) + `activeStatView` 상태만 `view/statistics.presenter.ts`로 합류한다(§7.4).

---

## 3. Model/ViewModel — interface 상속 체계

ViewModel은 자기 모듈의 "요청/주 Model"을 `extends`하는 것이 기본이다. 자연스러운 요청 개념이 없는
모듈(예: results, lotterietus처럼 파라미터 없는 단건 조회)은 억지로 확장 대상을 만들지 않고
`extends <ResponseModel> {}`(빈 확장)로 둔다 — 필드가 지금 같더라도 두 레이어가 존재하는 이유를 코드
구조로 명시하기 위해 항상 만든다(§0).

```ts
// modules/generator/transport/mapper.ts
// 시그니처를 GeneratorRequestModel로 고정 — GeneratorViewModel(하위 타입)을 넘겨도
// 함수 안에서는 result 같은 ViewModel 전용 필드가 애초에 보이지 않는다
export function mapGenerateRequest(model: GeneratorRequestModel): GenerateRequest {
  return { mode: model.mode, selected: model.selected };
}
```

이 필드-숨김 효과는 TS의 **구조적 타이핑**만으로 일어난다 — `GeneratorViewModel`이 class든 interface든,
런타임에는 어느 쪽이든 `result` 필드가 객체에 그대로 남아 있다(JS는 상속 관계로 필드를 "잘라내지"
않는다). 숨김은 순전히 컴파일 타임 정적 검사이고 class와 interface 둘 다 동일하므로, 인스턴스화 비용이
없는 interface가 더 낫다.

필드가 Model과 완전히 같아 ViewModel이 빈 채로 남는 모듈(예: results·lotterietus·simulation·picks·
identity·statistics)은 `interface XViewModel extends XModel {}` 형태로 만든다.

---

## 4. 워크드 예제 — `generator` 모듈 전체 흐름

`generator`는 인터랙티브 상태(모드·선택 번호)가 요청 파라미터 모양과 정확히 같아서, extends 관계가
가장 분명하게 드러나는 모듈이다.

```ts
// modules/generator/model/generator.model.ts (기존 파일 확장)
export type GeneratorMode = "auto" | "semi" | "manual";

/** 요청 파라미터 도메인 타입 (신규 — 기존엔 개념 없이 훅 state로만 존재) */
export interface GeneratorRequestModel {
  mode: GeneratorMode;
  selected: number[];
}

export interface GeneratedCombinationModel {
  numbers: number[];
}

// modules/generator/model/generator.viewmodel.ts (신규)
export interface GeneratorViewModel extends GeneratorRequestModel {
  result: GeneratedCombinationModel | null;
}
```

```ts
// modules/generator/view/generator.presenter.ts — 인터랙티브 상태 소유 (구 훅의 mode/selected 부분)
export function canGenerate(mode: GeneratorMode, selectedCount: number): boolean { /* 기존 로직 그대로 */ }
export function modeHint(mode: GeneratorMode, selectedCount: number): string { /* 기존 로직 그대로 */ }

export function useGeneratorPresenter() {
  const [request, setRequest] = useState<GeneratorRequestModel>({ mode: "auto", selected: [] });
  const changeMode = (next: GeneratorMode) => setRequest({ mode: next, selected: [] });
  const toggleNumber = (n: number) => setRequest((prev) => ({ ...prev, selected: /* 기존 토글 로직 */ [] }));
  return {
    request, changeMode, toggleNumber,
    canGenerate: canGenerate(request.mode, request.selected.length),
    hint: modeHint(request.mode, request.selected.length),
  };
}

// modules/generator/action/useGeneratorGenerate.action.ts — 서버 상태 소유 (구 훅의 result/busy/error + api/client.ts 흡수)
export function useGeneratorGenerateAction() {
  const [state, setState] = useState<
    { status: "idle" | "loading" | "success" | "error"; result?: GeneratedCombinationModel; error?: string }
  >({ status: "idle" });

  const generate = async (request: GeneratorRequestModel) => {
    setState({ status: "loading" });
    try {
      const dto = await apiPost<GenerateResponse>("/api/generator", mapGenerateRequest(request)); // mapper: Model → DTO
      setState({ status: "success", result: mapGenerateResponse(dto) });                           // mapper: DTO → Model (구 assembleGeneratedCombination)
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : "생성에 실패했습니다" });
    }
  };
  return { ...state, generate };
}

// modules/generator/view/generatorCard.tsx — 조립 (리네임: generator-card.tsx →)
export function GeneratorCard({ onGenerated }: GeneratorCardProps) {
  const presenter = useGeneratorPresenter();
  const action = useGeneratorGenerateAction();
  const onGenerate = async () => {
    await action.generate(presenter.request);
    if (action.result) onGenerated(action.result.numbers);
  };
  // ...버튼은 presenter.canGenerate/hint, action.status/result 조합해 렌더
}
```

기존 `api/client.ts`(`apiPost`+`assembleGeneratedCombination` 호출만 하던 얇은 래퍼)는 폐기하고 그
내용을 action 훅 안으로 흡수한다 — 모든 모듈에 동일 적용(§7).

---

## 5. 네이밍 규칙

### 5.1 Transport (Mapper only — Assembler 용어 폐기)

폴더는 모듈당 `transport/mapper.ts` 파일 하나로 통합한다(요청·응답 변환 함수 모두 여기에 — 함수가
많아져 파일이 비대해지면 그때 쪼갠다). 모듈 폴더가 이미 도메인을 구분하므로 파일명에 도메인 접두는
붙이지 않는다.

함수 이름은 항상 `map` 접두, 마지막 단어만 Request/Response로 구분한다:

| 데이터 흐름 | 이름 | 비고 |
|---|---|---|
| 요청 변환 | `map<Domain>Request` | |
| 응답 변환 | `map<Domain>Response` | |
| CRUD로 분류 안 되는 트리거 | `map<Domain><Verb>Request`/`Response` | 동사만 |
| 요청 변환 없음(GET, 본문 없음) | Response만 | Request mapper 생략 |
| 여러 액션이 같은 응답 DTO를 공유 | `map<Entity>Response`(엔티티명 단독) | picks만 해당 — get·save 둘 다 `PickResponse → PickModel` 변환을 재사용하므로 액션별 중복 함수를 만들지 않는다 |

### 5.2 Action (유즈케이스별 훅)

Action은 mapper와 달리 **모듈당 유즈케이스마다 별도 파일**을 만든다(합치지 않는다). 파일명은
`use<Domain><Verb>.action.ts`(camelCase + 점 구분), 훅 이름은 `use<Domain><Verb>Action`이다.

| 유즈케이스 | 이름 |
|---|---|
| 조회(단건/다건) | `use<Domain>Get.action.ts` → `use<Domain>GetAction` |
| 저장 | `use<Domain>Save.action.ts` → `use<Domain>SaveAction` |
| 삭제 | `use<Domain>Delete.action.ts` → `use<Domain>DeleteAction` |
| CRUD로 분류 안 되는 트리거 | `use<Domain><Verb>.action.ts` → `use<Domain><Verb>Action` | 동사만 — 예: `useSimulationBacktest.action.ts`, `useResultsCheck.action.ts` |

### 5.3 Presenter (소속 View가 드러나는 파일명)

파일명 `<domain>.presenter.ts`(`view/` 아래), 훅 이름 `use<Domain>Presenter`. 임계값(렌더링·인터랙티브
로직 4-5개) 미만이면 별도 파일 없이 View 컴포넌트 안에 인라인 유지 — 제네릭한 `presenter.ts`라는
파일명은 쓰지 않는다.

### 5.4 Model/ViewModel

`<domain>.model.ts`(기존 유지) / `<domain>.viewmodel.ts`(신규, 항상 생성). ViewModel은 자기 모듈의
요청/응답 Model을 `extends`하며, 자연스러운 확장 대상이 없으면 `extends <ResponseModel> {}`(빈
확장이라도 생성, §3).

### 5.5 View 컴포넌트

파일명은 camelCase, 점 구분 없이 접미사까지 이어붙인다. 예: `generator-card.tsx` → `generatorCard.tsx`,
`frequency-heatmap.tsx` → `frequencyHeatmap.tsx`. **export되는 컴포넌트 심볼 이름은 그대로 PascalCase
유지**(`GeneratorCard` 함수/컴포넌트명은 바뀌지 않는다 — 파일명만 camelCase로).

**예외(리네임 대상 아님)**: `page.tsx`(Next.js App Router 규약 파일명, 프레임워크 강제)와
`index.ts`(모듈 공개 진입점 규약, 이미 소문자 단일 단어)는 도메인명 기반이 아니라 구조적 역할이 고정된
이름이므로 이번 camelCase 전환 대상에서 제외한다.

---

## 6. 전체 폴더 구조

```
apps/web/src/
  app/
    page.tsx                          (예외 — 프레임워크 규약 파일명 유지)
    home.presenter.ts                  useHomePresenter — currentNumbers·isGeneratorOpen·activeTab
  modules/
    picks/                      [Tier-1]
      action/
        usePicksGet.action.ts          usePicksGetAction
        usePicksSave.action.ts         usePicksSaveAction
        usePicksDelete.action.ts       usePicksDeleteAction
      model/
        pick.model.ts                  PickModel (기존)
        pick.viewmodel.ts              PickViewModel extends PickModel {} (신규)
      transport/
        mapper.ts                      mapSavePickRequest · mapPickResponse (합침)
        mapper.test.ts                 (리네임: transport/pick-transport.test.ts →)
      view/
        picksCard.tsx                  (리네임: picks-card.tsx →) 조립, presenter 파일 없음(임계값 미만)
      index.ts
    results/                    [Tier-1]
      action/
        useResultsCheck.action.ts      useResultsCheckAction
      model/
        results.model.ts                ResultItemModel · ResultsModel (기존)
        results.viewmodel.ts            ResultsViewModel extends ResultsModel {} (신규)
      transport/
        mapper.ts                       mapResultsResponse (요청 변환 없음)
      view/
        resultsCard.tsx                 (리네임: results-card.tsx →) presenter 파일 없음(임계값 미만)
      index.ts
    identity/                   [Tier-1, MVP 스텁]
      model/
        identity.model.ts               IdentityModel (신규 — 기존엔 model 폴더 없었음)
        identity.viewmodel.ts           IdentityViewModel extends IdentityModel {} (신규)
      view/
        identityBadge.tsx                (리네임: identity-badge.tsx →) action/presenter 없음(서버 호출 없는 스텁)
      index.ts
    statistics/                 [Tier-2]
      action/
        useStatisticsGet.action.ts     useStatisticsGetAction
      model/
        statistics.model.ts             StatisticsModel (기존)
        statistics.viewmodel.ts         StatisticsViewModel extends StatisticsModel {} (신규)
      transport/
        mapper.ts                       mapStatisticsResponse (요청 변환 없음)
      view/
        statisticsPanel.tsx              (리네임: statistics-panel.tsx →) Tabs 배치만
        statistics.presenter.ts          useStatisticsPresenter — activeStatView + 9개 순수 함수(구 viewmodel/presenters.ts)
        statistics.presenter.test.ts     (리네임: viewmodel/presenters.test.ts →)
        frequencyHeatmap.tsx             (리네임: frequency-heatmap.tsx →)
        numberFrequencyBars.tsx          (리네임: number-frequency-bars.tsx →)
        sumDistributionChart.tsx         (리네임: sum-distribution-chart.tsx →)
        hotColdBoard.tsx                 (리네임: hot-cold-board.tsx →)
        patternDistribution.tsx          (리네임: pattern-distribution.tsx →)
        probabilityReality.tsx           (리네임: probability-reality.tsx →)
        recentGrid.tsx                   (리네임: recent-grid.tsx →)
        topPairsList.tsx                 (리네임: top-pairs-list.tsx →)
      index.ts
    simulation/                 [Tier-2]
      action/
        useSimulationBacktest.action.ts  useSimulationBacktestAction
      model/
        simulation.model.ts              BacktestModel (기존)
        simulation.viewmodel.ts          BacktestViewModel extends BacktestModel {} (신규)
      transport/
        mapper.ts                        mapSimulationRequest · mapSimulationResponse (합침)
      view/
        simulationCard.tsx                (리네임: simulation-card.tsx →) presenter 파일 없음(임계값 미만)
      index.ts
    generator/                  [Tier-2]
      action/
        useGeneratorGenerate.action.ts   useGeneratorGenerateAction
      model/
        generator.model.ts               GeneratorMode · GeneratedCombinationModel · GeneratorRequestModel(신규)
        generator.viewmodel.ts           GeneratorViewModel extends GeneratorRequestModel { result } (신규)
      transport/
        mapper.ts                        mapGenerateRequest · mapGenerateResponse (합침)
      view/
        generatorCard.tsx                 (리네임: generator-card.tsx →)
        generator.presenter.ts            useGeneratorPresenter — mode·selected + canGenerate·modeHint
      index.ts
    lotterietus/                [Tier-2]
      action/
        useLotterietusGet.action.ts      useLotterietusGetAction
      model/
        lotterietus.model.ts              LotterietusModel (기존)
        lotterietus.viewmodel.ts          LotterietusViewModel extends LotterietusModel {} (신규)
      transport/
        mapper.ts                         mapLotterietusStatusResponse (요청 변환 없음)
      view/
        lotterietusCard.tsx                (리네임: lotterietus-card.tsx →)
        lotterietus.presenter.ts           useLotterietusPresenter — now(1초 틱 타이머) + formatDrawDate·formatRemaining
        lotterietus.presenter.test.ts      (리네임: viewmodel/format-remaining.test.ts →)
      index.ts
  shared/   (ui/lib/config — 변경 없음, 도메인 모듈이 아니므로 이번 리네임 대상 아님)
```

`api/` 폴더는 전 모듈에서 사라진다(내용은 action 훅으로 흡수). `viewmodel/` 폴더도 전 모듈에서
사라진다(내용은 `model/*.viewmodel.ts` + `view/*.presenter.ts` + `action/*`로 3분해).

---

## 7. 모듈별 마이그레이션 매핑

### 7.1 picks

| 기존 | 이후 |
|---|---|
| `api/client.ts`(fetchPicks·savePick·removePick) | `action/usePicksGet.action.ts` · `action/usePicksSave.action.ts` · `action/usePicksDelete.action.ts` |
| `model/pick.model.ts`(PickModel) | 그대로 + `model/pick.viewmodel.ts`(PickViewModel extends PickModel {}, 신규) |
| `transport/mapper/save-pick-request.mapper.ts` + `transport/assembler/pick-response.assembler.ts` | `transport/mapper.ts`(mapSavePickRequest · mapPickResponse) |
| `transport/pick-transport.test.ts` | `transport/mapper.test.ts` |
| `viewmodel/use-picks.viewmodel.ts`(busy·error·picks·save·remove·formatSavedAt) | 분해: 서버상태 → 3개 action 훅 / `formatSavedAt`는 임계값 미만이라 `view/picksCard.tsx`에 인라인 |
| `view/picks-card.tsx` | `view/picksCard.tsx`(리네임, save 성공 후 get의 refetch를 View가 직접 호출) |

### 7.2 results

| 기존 | 이후 |
|---|---|
| `api/client.ts`(fetchResults) | `action/useResultsCheck.action.ts` |
| `model/results.model.ts` | 그대로 + `model/results.viewmodel.ts`(신규) |
| `transport/assembler/results-response.assembler.ts` | `transport/mapper.ts`(mapResultsResponse) |
| `viewmodel/use-results.viewmodel.ts`(busy·error·results·check·resultLabel) | 분해: 서버상태 → action 훅 / `resultLabel`은 임계값 미만이라 `view/resultsCard.tsx`에 인라인 |
| `view/results-card.tsx` | `view/resultsCard.tsx`(리네임) |

### 7.3 identity

| 기존 | 이후 |
|---|---|
| (model 폴더 없음) | `model/identity.model.ts` · `model/identity.viewmodel.ts`(신규) |
| `viewmodel/use-identity.viewmodel.ts`(정적 스텁) | 폐기 — action/presenter 불필요(서버 호출·상태 자체가 없음), `view/identityBadge.tsx`가 `IdentityModel`을 직접 참조하는 상수/함수로 대체 |
| `view/identity-badge.tsx` | `view/identityBadge.tsx`(리네임) |

### 7.4 statistics

| 기존 | 이후 |
|---|---|
| `api/client.ts`(fetchStatistics) | `action/useStatisticsGet.action.ts` |
| `model/statistics.model.ts` | 그대로 + `model/statistics.viewmodel.ts`(신규) |
| `transport/assembler/statistics-response.assembler.ts` | `transport/mapper.ts`(mapStatisticsResponse) |
| `viewmodel/use-statistics.viewmodel.ts`(stats·error) | `action/useStatisticsGet.action.ts`로 이동 |
| `viewmodel/presenters.ts`(9개 순수 함수) + `statistics-panel.tsx`의 `activeStatView` | `view/statistics.presenter.ts`(useStatisticsPresenter)로 통합 |
| `viewmodel/presenters.test.ts` | `view/statistics.presenter.test.ts` |
| `view/statistics-panel.tsx` + 8개 서브뷰 | `view/statisticsPanel.tsx` + 8개 서브뷰 전부 camelCase 리네임(§6 목록) |

### 7.5 simulation

| 기존 | 이후 |
|---|---|
| `api/client.ts`(postBacktest) | `action/useSimulationBacktest.action.ts` |
| `model/simulation.model.ts`(BacktestModel) | 그대로 + `model/simulation.viewmodel.ts`(BacktestViewModel extends BacktestModel {}, 신규) |
| `transport/mapper/simulation-request.mapper.ts` + `transport/assembler/simulation-response.assembler.ts` | `transport/mapper.ts`(mapSimulationRequest · mapSimulationResponse) |
| `viewmodel/use-simulation.viewmodel.ts`(busy·error·result·run·summarizeRanks·summaryLine) | 분해: 서버상태 → action 훅 / `summarizeRanks`·`summaryLine`은 임계값 미만이라 `view/simulationCard.tsx`에 인라인 |
| `view/simulation-card.tsx` | `view/simulationCard.tsx`(리네임) |

### 7.6 generator

| 기존 | 이후 |
|---|---|
| `api/client.ts`(postGenerate) | `action/useGeneratorGenerate.action.ts` |
| `model/generator.model.ts` | `GeneratorRequestModel`(신규 필드) 추가 + `model/generator.viewmodel.ts`(GeneratorViewModel extends GeneratorRequestModel { result }, 신규) |
| `transport/mapper/generate-request.mapper.ts` + `transport/assembler/generate-response.assembler.ts` | `transport/mapper.ts`(mapGenerateRequest · mapGenerateResponse) |
| `viewmodel/use-generator.viewmodel.ts`(mode·selected·result·busy·error·canGenerate·modeHint) | 분해: mode·selected·canGenerate·modeHint → `view/generator.presenter.ts`(useGeneratorPresenter) / result·busy·error → action 훅 |
| `view/generator-card.tsx` | `view/generatorCard.tsx`(리네임, presenter+action 조립) |

### 7.7 lotterietus

| 기존 | 이후 |
|---|---|
| `api/client.ts`(fetchLotterietusStatus) | `action/useLotterietusGet.action.ts` |
| `model/lotterietus.model.ts` | 그대로 + `model/lotterietus.viewmodel.ts`(신규) |
| `transport/assembler/lotterietus.assembler.ts` | `transport/mapper.ts`(mapLotterietusStatusResponse) |
| `viewmodel/use-lotterietus.viewmodel.ts`(data·error·now·remaining·formatDrawDate·formatRemaining) | 분해: data·error → action 훅 / now(틱 타이머)·formatDrawDate·formatRemaining → `view/lotterietus.presenter.ts`(useLotterietusPresenter) |
| `viewmodel/format-remaining.test.ts` | `view/lotterietus.presenter.test.ts` |
| `view/lotterietus-card.tsx` | `view/lotterietusCard.tsx`(리네임) |

### 7.8 App 셸

| 기존 | 이후 |
|---|---|
| `app/page.tsx`(useState 3개를 직접 소유) | `app/page.tsx`(조립만) + `app/home.presenter.ts`(useHomePresenter — currentNumbers·isGeneratorOpen·activeTab) |

---

## 8. ESLint 경계 규칙 (v2 §4 갱신)

기존 규칙(FE는 core dto만 타입 import·`@/server/*` 접근 금지·모듈간 deep import 금지·`app/`은 조립만)은
그대로 유지한다. 이번 구조 변경으로 **2개를 신설**한다:

1. **`view/**`는 자기 모듈의 `action/**`+`model/**`(+동일 폴더의 `*.presenter.ts`) + `shared/ui`+
   `shared/lib`만 import.** `transport/**` 직접 import 금지 — 지금은 위반 사례가 없지만(현재 view는
   viewmodel을 통해서만 데이터를 받음), action이 신설되면서 앞으로 view가 실수로 transport를 직접
   건드릴 여지가 생기므로 미리 막는다.
2. **오직 `action/**`만 `transport/**`를 import**한다(view·model은 transport를 직접 보지 않는다).

기존 규칙(FE는 core dto만)은 action이 fetcher 제네릭(`apiGet<T>`)에 넘길 DTO 타입을 직접 import해야
하므로 그대로 유지된다 — action과 transport 둘 다 dto 타입 import는 허용되고, domain/application/
infrastructure만 금지된다는 기존 구분은 바뀌지 않는다.

위반 시 CI 실패(빌드 실패)로 강제하는 기존 방침도 유지한다.

---

## 9. 테스트 전략

기존 `.test.ts`는 대상 파일 이동을 따라간다(§7에 이미 명시):

- `pick-transport.test.ts` → `transport/mapper.test.ts`
- `presenters.test.ts` → `view/statistics.presenter.test.ts`
- `format-remaining.test.ts` → `view/lotterietus.presenter.test.ts`

**새로 필요한 것**: `use<Domain><Verb>Action` 훅은 상태(idle/loading/success/error)를 가지므로 React
Testing Library 기반 훅 테스트가 필요하다 — 기존엔 순수 함수 테스트뿐이었다(mapper·presenter). 이
프로젝트엔 아직 컴포넌트/훅 렌더링 테스트 인프라가 없으므로(`vitest.config.ts`가 기본 `node` 환경),
이번에 다음을 추가한다:

- devDependency: `@testing-library/react`, `@testing-library/dom`, jsdom(또는 happy-dom)
- `apps/web/vitest.config.ts`에 `test.environment: "jsdom"` 추가

Model/ViewModel interface는 필드 위주 데이터 타입이라 별도 단위 테스트가 필요 없다(타입체크로 충분).

---

## 10. 리스크와 완화

| 리스크 | 완화 |
|---|---|
| interface 상속 기반 Model/ViewModel이 이 프로젝트에서 처음 시도하는 패턴 | 가장 단순한 identity·results에서 먼저 검증한 뒤 확산 |
| Action이 유즈케이스별 파일로 늘어나 파일 수 증가(picks 3개) | `index.ts`로 공개 표면을 정리하고, 파일당 책임이 더 명확해지는 트레이드오프로 수용 |
| 7개 모듈 전체 파일을 한 번에 camelCase 리네임 — 변경 범위가 넓다(8개 statistics 서브뷰 포함) | 모듈 단위로 순차 전환(§12 순서)하고 매 모듈마다 `pnpm test`+`pnpm lint`+`pnpm build` 통과를 확인한 후 다음 모듈로 진행 |
| React 훅 테스트 인프라(RTL+jsdom) 신규 도입 | 기존 순수 함수 테스트와 분리해 도입 — 실패해도 mapper/presenter 테스트에는 영향 없음 |
| picks의 get/save/delete 3개 action 훅 간 조정(저장·삭제 후 재조회) 로직이 흩어질 위험 | View가 명시적으로 orchestrate — action 훅끼리 서로 호출하는 암묵적 의존 금지, 순서 조합은 View 조립 코드에서만 |
| ESLint 신설 규칙(view→transport 금지, action-only transport 접근)이 기존 코드에 없던 위반을 새로 드러낼 가능성 | 마이그레이션 중 발견 즉시 고치고 §8 규칙으로 재발 방지 |

---

## 11. 완료 기준

- 7개 모듈이 `action/model/transport/view/index.ts` 구조로 전환되고 `viewmodel/`·`api/` 폴더가 전
  모듈에서 사라진다.
- 모든 Model에 대응하는 ViewModel이 존재하며(필드가 같아도), `<domain>.model.ts`/`<domain>.viewmodel.ts`
  네이밍을 따른다.
- 모든 Action 훅이 유즈케이스별 파일로 분리되고 `use<Domain><Verb>Action`/`use<Domain><Verb>.action.ts`
  네이밍을 따른다.
- 임계값(4-5개) 이상의 인터랙티브/렌더링 로직을 가진 모듈(statistics·generator·lotterietus·App셸)은
  `<domain>.presenter.ts`/`home.presenter.ts` 등으로 분리되고, 그 미만인 모듈(picks·results·simulation·
  identity)은 인라인으로 유지된다.
- Transport의 Assembler 용어가 코드베이스에서 완전히 사라지고 Mapper로 통일된다(`transport/mapper.ts`
  단일 파일, `map<Domain>Request`/`map<Domain>Response` 네이밍).
- 7개 모듈 전체 파일(신규+기존)이 camelCase 네이밍을 따른다(`page.tsx`/`index.ts` 예외 제외).
- `view`에 transport import가 0이고, `transport`는 `action`에서만 import된다(§8 ESLint로 강제).
- Phase 1(현재 MVP)의 모든 기능(생성·통계 8종·시뮬레이션·픽 저장/삭제·결과 대조·카운트다운)이 리팩터
  후 동일하게 동작한다.
- `pnpm test`·`pnpm lint`·`pnpm build`가 전부 통과한다.

---

## 12. 다음 단계

본 문서는 "무엇을·어떤 구조로"까지다. 실제 리팩터는 이후 **writing-plans → 구현 단계**에서 다룬다.
마이그레이션 순서는 **identity → results → simulation → lotterietus → generator → picks → statistics →
App 셸**(가장 단순 → 가장 복잡)로, 한 모듈씩 완전히 전환하고 `pnpm test`+`pnpm lint`+`pnpm build`를
통과시킨 뒤 다음 모듈로 넘어간다.

근거: identity·results·simulation은 인터랙티브 presenter 상태가 없어(presenter 파일 자체가 불필요)
가장 단순하고, lotterietus·generator는 실제 presenter 상태(틱 타이머/모드 선택)가 있어 한 단계 위,
picks는 3개 action의 조정이 필요해 더 복잡하고, statistics는 로직 자체는 단순하지만 8개 서브뷰
리네임까지 포함해 파일 변경 범위가 가장 넓다. App 셸은 7개 모듈의 `index.ts` 공개 표면이 모두 확정된
뒤에야 조립 가능하므로 마지막이다.
