# fortuna-lottery — 클라이언트 아키텍처 v3 보정 (Action·Presenter·ViewModel 책임 확정)

작성일: 2026-08-08
선행 문서:
- `2026-08-05-fortuna-lottery-client-architecture-v3-design.md` — View·Presenter·Action 삼각형을 도입한
  문서. **아직 구현 전이다**(`apps/web/src/modules/**`가 여전히 `api/`·`viewmodel/`·`transport/assembler/`·
  kebab-case). 본 문서는 그 §0(interface 결정) · §3(Model/ViewModel) · §5.1(Transport 네이밍) ·
  §5.2(Action 네이밍) · §5.3(Presenter 임계값) · §6(폴더 구조)을 **개정**한다.
- `2026-07-03-fortuna-lottery-architecture-v2.md` — 프론트 FMA 원형. v3가 이미 개정했다.

참조 문서: `Project/회사/SNIT/ignition/tagHero/docs/superpowers/specs/2026-08-07-tag-hero-architecture-v2-refinement-design.md`
  (자매 프로젝트가 같은 문제를 먼저 겪고 보정한 문서. 본 문서는 그 7개 항목을 이 프로젝트 사정에 맞게
  가져오되, 갈라지는 지점을 §3.2·§7에 명시한다)

동반 문서: `2026-08-08-fortuna-lottery-backend-architecture-v4-design.md`
  (같은 날 확정된 백엔드 4계층 전환. 두 문서는 독립적으로 실행 가능하며, 본 문서의 리팩터가 먼저다 —
  백엔드 문서 §10)

적용 범위: `apps/web/src/modules/**` 전체(7개 모듈) + `apps/web/src/app/page.tsx`
상태: 확정 (본 문서 기준으로 클라이언트 리팩터 → writing-plans)

---

## 0. 배경 — v3가 남긴 일곱 가지 결손

v3는 로직을 Action(서버 상태)과 Presenter(인터랙티브 UI 상태)로 쪼개고 ViewModel을 실제 타입으로
승격시켰다. 방향은 맞지만, 자매 프로젝트가 같은 구조를 **실제로 구현해 운영해본 뒤** 드러난 문제
일곱 가지가 v3에는 아직 반영돼 있지 않다.

| # | 결손 | 결과 |
|---|---|---|
| ① | Action의 반환 타입이 Model이다 | Model↔ViewModel 경계의 소유자가 없어 변환이 여기저기서 일어난다 |
| ② | "임계값 4-5개 미만이면 View에 인라인" | 조립 로직이 View에 남아, v3가 없애려던 것이 그대로 남는다 |
| ③ | ViewModel이 전부 빈 `extends {}` 껍데기 | 파생값(`formatSavedAt`·`resultLabel`·`canGenerate`…)이 여전히 모듈마다 다른 곳에 흩어진다 |
| ④ | 전용 자식 컴포넌트의 자리가 없다 | statistics의 8개 서브뷰가 대표 View와 같은 층에 평평하게 놓인다 |
| ⑤ | 폴더별 배럴이 없다 | import 문만 봐서는 어느 계층에서 가져오는지 보이지 않는다 |
| ⑥ | 폴더명이 `transport/`인데 담기는 것은 mapper뿐 | 폴더명이 내용과 어긋난다 |
| ⑦ | Action 훅 이름과 mapper 함수 이름의 어간이 다르다 | `useGeneratorGenerateAction` ↔ `mapGenerateRequest` — 짝인지 이름으로 확인되지 않는다 |

①②③은 계층 책임 문제이고 ④⑤⑥⑦은 표기·배치 문제다. **③을 바로잡으면 v3 §0이 지적한 원래 문제
("presenter 순수 함수의 위치가 모듈마다 제각각")가 비로소 해소된다.**

v3는 아직 구현 전이므로, 이 보정을 v3 리팩터와 **한 번에** 수행한다(두 번 만지지 않는다).

---

## 1. Action — ViewModel 입력, ViewModel 출력

Action은 요청 시 ViewModel을 **변환 없이** mapper에 넘기고(업캐스트), 응답은 mapper가 만든 Model을
**ViewModel 클래스의 static 팩토리로 승격**해서 반환한다.

> **Action이 Model↔ViewModel 경계의 유일한 통과 지점이다.**

```ts
// modules/generator/action/generateCombination.action.ts
export function useGenerateCombinationAction() {
  const [state, setState] = useState<ActionState<GeneratorViewModel>>({ status: "idle" });

  /** 성공 시 갱신된 VM을 반환한다 — 호출부가 setState 반영을 기다리지 않도록. */
  const generate = async (vm: GeneratorViewModel): Promise<GeneratorViewModel | null> => {
    setState({ status: "loading" });
    try {
      const dto = await apiPost<GenerateResponse>(
        "/api/generator",
        generateCombinationRequest(vm),          // VM → (업캐스트) → Model 시그니처 → DTO
      );
      const model = generateCombinationResponse(dto);   // DTO → Model
      const next = vm.withResult(model);                // Model → ViewModel
      setState({ status: "success", data: next });
      return next;
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : "생성에 실패했습니다" });
      return null;
    }
  };
  return { ...state, generate };
}
```

**비동기 반환 규칙**: 상태를 바꾸는 Action(`generate`·`save`·`delete`)은 `setState` 외에 **결과를
반환한다.** React 상태는 다음 렌더에서야 갱신되므로, 호출 직후 결과가 필요한 Presenter가
`action.data`를 읽으면 이전 값을 본다. 반환값을 쓰면 그 함정이 사라진다.

`ActionState<T>`는 `shared/lib`에 공통 타입으로 둔다:

```ts
export type ActionState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };
```

### 1.1 반환 타입 표

| Action | 반환 |
|---|---|
| `useGetPicksAction` | `ActionState<PickViewModel[]>` |
| `useSavePickAction` | `ActionState<PickViewModel>` |
| `useDeletePickAction` | `ActionState<void>` — 반환 데이터 없음 |
| `useCheckResultsAction` | `ActionState<ResultsViewModel>` |
| `useGetStatisticsAction` | `ActionState<StatisticsViewModel>` |
| `useBacktestAction` | `ActionState<BacktestViewModel>` |
| `useGenerateCombinationAction` | `ActionState<GeneratorViewModel>` |
| `useGetLotterietusStatusAction` | `ActionState<LotterietusViewModel>` |

### 1.2 예외 규칙

응답이 도메인 실체가 없는 **원시 스칼라·문자열 목록**이면 Model도 ViewModel도 만들지 않고 그대로
반환한다. 필드 하나짜리 값을 클래스로 감싸는 것은 계층 표현이 아니라 잡음이다. 반환 데이터가 없는
트리거(`useDeletePickAction`)도 마찬가지다.

### 1.3 Action 간 조정은 View가 아니라 Presenter가 한다

`picks`처럼 Action이 여러 개인 모듈에서 "저장 후 재조회" 같은 순서 조합이 필요하다. **Action 훅끼리
서로 호출하는 암묵적 의존은 금지**하고, 조합은 그 View의 Presenter 안에서만 한다(v3 §10의 리스크
완화책을 View → Presenter로 옮긴 것 — §2에 의해 View에는 로직이 남지 않기 때문이다).

---

## 2. Presenter — 1:1 정책과 자식별 props 번들

### 2.1 정책

1. **하나의 Presenter는 오직 하나의 View/컴포넌트만 담당한다.** 여러 View가 Presenter를 공유하는 것은
   금지다.
2. **모듈 대표 View는 예외 없이 자기 Presenter를 갖는다.** — **v3 §5.3의 "임계값 4-5개 미만이면 View에
   인라인" 규칙을 폐기한다.** View에서 로직을 0으로 만드는 것이 목적이므로 임계값을 적용하지 않는다.
3. **자식 컴포넌트는 자기 소유 상태나 서버 데이터가 생기는 시점에** 자기 Presenter를 갖는다. 소유물이
   없으면 Presenter 없이 부모가 준 props만 렌더한다.
4. **Presenter는 자식 컴포넌트별 props 번들을 반환한다.** 번들은 그 자식의 props 타입과 정확히 일치해
   `<Child {...bundle} />`로 spread된다. 어떤 상태를 어느 prop으로 연결할지가 전부 Presenter 안에서
   끝난다.
5. **자식이 자기 props 인터페이스를 export하고 Presenter가 그것을 import한다**(단방향). 반대 방향은
   순환을 만든다.
6. **Presenter 내부 순수 유틸은 export하지 않는 것을 기본으로 한다.** 단위 테스트가 필요한 것만
   `export`하되 `view/index.ts` 배럴에는 넣지 않아 다른 모듈·View가 쓰지 못하게 한다.

### 2.2 View별 Presenter와 번들

| View | Presenter | 반환 번들 |
|---|---|---|
| `PicksCard` | `picks/view/picks.presenter.ts` | `{ list, saveButton, emptyState }` |
| `ResultsCard` | `results/view/results.presenter.ts` | `{ form, summary, rows }` |
| `IdentityBadge` | `identity/view/identity.presenter.ts` | `{ badge }` |
| `StatisticsPanel` | `statistics/view/statistics.presenter.ts` | `{ tabs, active }` — 8개 서브뷰 각각의 props 포함 |
| `SimulationCard` | `simulation/view/simulation.presenter.ts` | `{ form, result }` |
| `GeneratorCard` | `generator/view/generator.presenter.ts` | `{ modeSelector, numberPad, generateButton, result }` |
| `LotterietusCard` | `lotterietus/view/lotterietus.presenter.ts` | `{ countdown, drawInfo }` |
| `Home`(`app/page.tsx`) | `app/home.presenter.ts` | `{ identity, lotterietus, generator, picks, results, simulation, statistics }` |

`IdentityBadge`는 서버 호출도 상태도 없는 정적 스텁이라 Presenter가 거의 비어 있다. 그래도 정책 2에
따라 만든다 — 예외를 두는 순간 "이 모듈은 왜 다르지"를 매번 판단해야 한다.

### 2.3 워크드 예제 — `generator`

```ts
// modules/generator/view/generator.presenter.ts
export function useGeneratorPresenter(ctx: { onGenerated: (numbers: number[]) => void }) {
  const [vm, setVm] = useState(new GeneratorViewModel());   // Presenter가 VM의 단일 소유자
  const action = useGenerateCombinationAction();

  const changeMode = (mode: GeneratorMode) => setVm((v) => v.withMode(mode));
  const toggleNumber = (n: number) => setVm((v) => v.withToggled(n));
  const generate = async () => {
    const next = await action.generate(vm);      // 반환값을 쓴다 — action.data를 읽지 않는다
    if (!next) return;
    setVm(next);
    ctx.onGenerated(next.result!.numbers);
  };

  return {
    modeSelector:   { mode: vm.mode, onChange: changeMode },
    numberPad:      { selected: vm.selected, disabled: vm.mode === "auto", onToggle: toggleNumber },
    generateButton: { enabled: vm.canGenerate, hint: vm.hint,
                      busy: action.status === "loading", onClick: generate },
    result:         { numbers: vm.result?.numbers ?? null,
                      error: action.status === "error" ? action.error : null },
  };
}
```

```tsx
// modules/generator/view/generatorCard.tsx — 로직 0, 레이아웃만
export function GeneratorCard(props: GeneratorCardProps) {
  const p = useGeneratorPresenter(props);
  return (
    <Card>
      <ModeSelector {...p.modeSelector} />
      <NumberPad {...p.numberPad} />
      <GenerateButton {...p.generateButton} />
      <GeneratedResult {...p.result} />
    </Card>
  );
}
```

`canGenerate`와 `hint`가 Presenter의 계산이 아니라 **`vm`(ViewModel)의 getter**라는 점에 주목한다 —
§3의 결과다.

**VM 소유권 규칙**: 인터랙티브 상태를 가진 모듈(`generator`처럼 사용자가 요청을 편집하는 경우)에서는
**Presenter가 VM의 단일 소유자**이고, Action의 `data`는 상태 표시(`status`·`error`)용으로만 읽는다.
반대로 인터랙티브 상태가 없는 모듈(`statistics`·`lotterietus`처럼 조회만 하는 경우)에서는 **Action의
`data`가 유일한 VM**이고 Presenter는 그것을 받아 번들만 만든다. 한 VM에 소유자가 둘 생기지 않도록,
모듈마다 어느 쪽인지 구현 시 명시한다.

---

## 3. ViewModel — class 전환과 파생값 소유

### 3.1 v3 §0의 interface 결정을 뒤집는다

v3는 "class 상속은 컴파일 타임 정적 검사 이상의 이점이 없다"는 근거로 interface를 택했다. 그 판단
자체는 **타입 필터링만 놓고 보면 맞다**. 뒤집는 이유는 다른 데 있다 — **파생값에게 집을 주기 위해서**다.

TS interface에는 getter 구현을 담을 수 없다. 그래서 interface를 유지하면 파생값이 갈 곳은 Presenter나
View밖에 없고, 그건 v3 §0이 문제로 지목한 상태(파생값이 모듈마다 다른 곳에 있음)와 같아진다.

**`ViewModel`만 class로 만든다.** `Model` · `DTO` · 백엔드의 `VO`는 전부 interface 그대로다 —
클래스가 필요한 것은 "파생값과 변환을 소유하는 타입" 하나뿐이다.

### 3.2 파생값 배치 — 무엇이 ViewModel로 가고 무엇이 Presenter에 남는가

| ViewModel(getter) | Presenter |
|---|---|
| Model→VM 변환 (`static from` · `fromAll`) | React 상태 해석 |
| 데이터에서 **기계적으로** 나오는 표시값 | `now`·타이머 등 **외부 시간**에 의존하는 값 |
| 응답 주입 (`withResult`) · 상태 갱신 (`withMode`·`withToggled`) | JSX·Tailwind 클래스 맵, 차트 축·색 계산 |
| 요청 유효성 (`canGenerate`) | 자식별 props 번들 조립, Action 간 순서 조합 |

이 프로젝트의 실제 파생값을 위 기준으로 배분하면:

| 현재 위치 | 파생값 | 새 집 |
|---|---|---|
| `viewmodel/use-picks.viewmodel.ts` | `formatSavedAt` | **`PickViewModel.savedAtLabel`** (getter) |
| `viewmodel/use-results.viewmodel.ts` | `resultLabel` | **`ResultItemViewModel.rankLabel`** (getter) |
| `viewmodel/use-simulation.viewmodel.ts` | `summarizeRanks` · `summaryLine` | **`BacktestViewModel.rankSummary` · `.summaryLine`** (getter) |
| `viewmodel/use-generator.viewmodel.ts` | `canGenerate` · `modeHint` | **`GeneratorViewModel.canGenerate` · `.hint`** (getter) |
| `viewmodel/presenters.ts` (9개) | 번호별 등급·색·정렬 등 행/셀 단위 | **`StatisticsViewModel` getter** (대부분) |
| `viewmodel/presenters.ts` (9개) | 차트 축·눈금·클래스 맵 | `statistics.presenter.ts` (일부) |
| `viewmodel/use-lotterietus.viewmodel.ts` | `formatDrawDate` | **`LotterietusViewModel.drawDateLabel`** (getter) |
| `viewmodel/use-lotterietus.viewmodel.ts` | `now`(1초 틱) · `formatRemaining` | `lotterietus.presenter.ts` — **`now` 의존이라 VM이 아니다** |
| `statistics-panel.tsx` | `activeStatView` | `statistics.presenter.ts` (React 상태) |

`formatRemaining`이 Presenter에 남는 이유가 이 기준을 가장 잘 보여준다 — 남은 시간은 **데이터가 아니라
"지금이 언제인가"에 의존**하므로 ViewModel의 파생값이 아니다.

### 3.3 클래스 작성 규칙 5조

자매 프로젝트는 이 5조를 **메모리 절약**을 근거로 세웠다(수천 행 테이블). 이 프로젝트는 번호 45개·픽
수십 개라 그 근거가 성립하지 않으므로, **근거를 바꿔서 채택한다**:

> **파생값을 저장하지 않으면 원본과 파생이 어긋날 수 없다.** (불변식)

1. **파생값은 저장 필드가 아니라 prototype getter로 만든다.**
2. **상수 lookup 테이블은 `static readonly`.**
3. **메서드는 반드시 prototype 메서드 `method() {}` 로 쓴다.** 인스턴스 화살표 프로퍼티
   `method = () => {}` 는 인스턴스마다 클로저를 만들고 상속·오버라이드가 깨지므로 **금지**한다.
4. **인스턴스 상태를 쓰지 않는 함수는 `static`.** 팩토리(`from`·`fromAll`)가 여기 해당한다.
5. **저장 필드는 서버에서 온 원본 데이터와 UI 상태에만 허용한다.** 원본에서 계산할 수 있는 값을 필드에
   저장하는 순간 1번 위반이다.

### 3.4 클래스 설계

```ts
// modules/generator/model/generator.model.ts  (interface — 변경 없음)
export type GeneratorMode = "auto" | "semi" | "manual";
export interface GeneratorRequestModel { mode: GeneratorMode; selected: number[] }
export interface GeneratedCombinationModel { numbers: number[] }

// modules/generator/model/generator.viewmodel.ts  (class)
export class GeneratorViewModel implements GeneratorRequestModel {
  mode: GeneratorMode = "auto";
  selected: number[] = [];                       // UI 상태 — 저장 필드 허용(규칙 5)
  result: GeneratedCombinationModel | null = null; // 서버 원본 — 저장 필드 허용

  private static readonly REQUIRED: Record<GeneratorMode, number> =
    { auto: 0, semi: 1, manual: 6 };

  static from(m: GeneratorRequestModel): GeneratorViewModel {
    return Object.assign(new GeneratorViewModel(), m);
  }

  get canGenerate(): boolean {
    return this.selected.length >= GeneratorViewModel.REQUIRED[this.mode];
  }
  get hint(): string { /* 구 modeHint */ }

  withMode(mode: GeneratorMode): GeneratorViewModel { /* 불변 갱신 */ }
  withToggled(n: number): GeneratorViewModel { /* 불변 갱신 */ }
  withResult(r: GeneratedCombinationModel): GeneratorViewModel { /* 불변 갱신 */ }
}
```

```ts
// modules/picks/model/pick.viewmodel.ts
export class PickViewModel implements PickModel {
  id!: string; numbers!: number[]; savedAt!: string;   // 서버 원본
  static from(m: PickModel): PickViewModel { return Object.assign(new PickViewModel(), m); }
  static fromAll(ms: PickModel[]): PickViewModel[] { return ms.map(PickViewModel.from); }
  get savedAtLabel(): string { /* 구 formatSavedAt */ }
}
```

`extends`가 아니라 `implements`를 쓰는 이유: Model이 interface이므로 `extends`할 실체가 없다. Mapper
시그니처를 Model로 고정하는 **업캐스트 필드-숨김 효과는 `implements`로도 동일하게 얻는다**(구조적
타이핑) — v3 §3이 설명한 메커니즘이 그대로 유효하다.

### 3.5 ViewModel은 필드가 Model과 같아도 항상 만든다

v3 §0의 결정을 유지한다. 두 레이어가 존재하는 이유(도메인 원형 vs 뷰 전용 인스턴스)를 코드 구조로
항상 명시한다. 파생값이 아직 없는 ViewModel은 `static from`·`fromAll`만 갖는다.

---

## 4. `view/component/` — 전용 자식 컴포넌트의 프랙탈 확장

`shared/ui`에 두는 공유 컴포넌트가 아닌 **그 View 전용 자식 컴포넌트**는 `view/component/`에 모은다.

**승격 규칙**: 컴포넌트는 단일 파일로 시작하고, 자기 하위 컴포넌트가 필요할 만큼 복잡해지면
**같은 이름의 폴더 + `index.tsx`** 로 승격한다. 폴더 자체가 컴포넌트의 import 단위가 되고, 그 안에서
View·Presenter·Action 삼각형과 `component/`가 다시 재귀한다.

```
view/component/frequencyHeatmap.tsx           ← 단일 파일 (지금)

view/component/frequencyHeatmap/              ← 승격 후
  index.tsx                                     본체 (조립)
  frequencyHeatmap.presenter.ts                 자기 상태·로직이 생겼을 때
  heatmapCell.tsx                               전용 하위 컴포넌트
  action/                                       자기만의 독립 서버 데이터가 필요해졌을 때
```

이번 리팩터의 적용 대상은 **statistics의 8개 서브뷰**다 — 지금 `statistics-panel.tsx`와 같은 층에
평평하게 놓여 있어 "모듈의 대표 View"와 "그 View의 부품"이 구분되지 않는다.

```
statistics/view/
  statisticsPanel.tsx          모듈 대표 View
  statistics.presenter.ts
  component/
    index.ts
    frequencyHeatmap.tsx · numberFrequencyBars.tsx · sumDistributionChart.tsx
    hotColdBoard.tsx · patternDistribution.tsx · probabilityReality.tsx
    recentGrid.tsx · topPairsList.tsx
```

§2.2에 따라 이 8개는 자기 Presenter를 갖지 않는다 — 자기 상태도 서버 데이터도 없고, 계산된 props를
`statistics.presenter.ts`의 번들로 받기 때문이다.

---

## 5. 배럴 `index.ts`

`action` · `model` · `mapper` · `view` · `view/component` 각 폴더는 `index.ts` 배럴을 갖는다.

```ts
// 폴더 밖에서 — 배럴 경로로만. import 문에서 계층이 보인다
import { useGetPicksAction } from "../action";
import { PickViewModel } from "../model";
import { getPicksResponse } from "../mapper";
import { PickRow } from "./component";
```

**규칙**

1. 폴더 밖에서 그 폴더의 구성원을 쓸 때는 배럴 경로만 쓴다(deep import 금지).
2. **같은 폴더 안에서는 배럴을 쓰지 않고 형제 파일을 직접 import한다** — 배럴 경유는 순환 import를
   만든다. 예: `pick.viewmodel.ts`는 `./pick.model`을 직접 import한다.
3. 배럴은 재export만 담는다. 구현을 배럴에 직접 쓰지 않는다(단일 파일 폴더인 `mapper/`도 예외가
   아니다 — 그래서 `mapper/picks.mapper.ts`가 따로 존재한다).
4. 모듈 공개 배럴(`modules/<d>/index.ts`)은 하위 배럴을 재export한다. 모듈 간 소통은 이 파일로만 한다.

배럴 규칙은 lint로 강제하지 않는다 — 같은 모듈 내부의 deep import를 글롭으로 구분하기 어렵고, 코드
리뷰 컨벤션으로 충분하다.

---

## 6. `transport/` → `mapper/`

폴더명이 그 안에 담기는 파일의 종류와 같아야 한다(`action`/`model`/`view`와 같은 결). `transport`는
개념 이름이고 실제 담긴 것은 mapper이므로 폴더를 `mapper/`로 개칭한다.

`mapper`는 **모듈당 단일 파일**을 유지한다(Action처럼 유즈케이스별로 쪼개지 않는다) — 한 모듈의
요청·응답 변환을 한자리에서 보는 것이 mapper의 가치이고, 파일이 비대해질 때 쪼개는 것은 그때의
판단이다.

```
mapper/
  index.ts                배럴 (재export만)
  picks.mapper.ts         이 모듈의 모든 요청·응답 mapper
  picks.mapper.test.ts
```

mapper 함수의 파라미터·리턴 타입은 항상 **Model**이다. 실제로 흘러드는 값이 ViewModel 인스턴스여도
함수 안에서는 VM 전용 멤버가 보이지 않는다(§3.4). Model↔ViewModel 변환은 mapper가 아니라 **Action이
ViewModel 클래스의 static 팩토리를 호출해** 수행한다(§1).

---

## 7. 네이밍 — Action↔mapper 어간 공유

### 7.1 규칙

v3 §5.1의 `map` 접두와 §5.2의 도메인 우선 어순(`use<Domain><Verb>Action`)을 **모두 폐기**하고, 동사
우선 어순 + 어간 공유로 통일한다.

> **mapper 함수의 어간 = 짝이 되는 Action 훅 이름에서 `use`와 `Action`을 뗀 것.**
> 이 규칙 하나로 어떤 mapper가 어떤 Action의 짝인지 기계적으로 확정된다.

```
useGetPicksAction  →  어간 getPicks  →  getPicksRequest / getPicksResponse
파일: action/getPicks.action.ts
```

### 7.2 전체 대응표

| 모듈 | Action 파일 | 훅 | mapper 함수 |
|---|---|---|---|
| picks | `getPicks.action.ts` | `useGetPicksAction` | `getPicksResponse` |
| picks | `savePick.action.ts` | `useSavePickAction` | `savePickRequest` · `savePickResponse` |
| picks | `deletePick.action.ts` | `useDeletePickAction` | `deletePickRequest` |
| results | `checkResults.action.ts` | `useCheckResultsAction` | `checkResultsRequest` · `checkResultsResponse` |
| statistics | `getStatistics.action.ts` | `useGetStatisticsAction` | `getStatisticsResponse` |
| simulation | `backtest.action.ts` | `useBacktestAction` | `backtestRequest` · `backtestResponse` |
| generator | `generateCombination.action.ts` | `useGenerateCombinationAction` | `generateCombinationRequest` · `generateCombinationResponse` |
| lotterietus | `getLotterietusStatus.action.ts` | `useGetLotterietusStatusAction` | `getLotterietusStatusResponse` |

**Request mapper를 두지 않는 경우**: Model→DTO 변환이 실질적으로 없는 경우(파라미터 없는 GET, 본문 없는
트리거)는 Response mapper만 둔다. `deletePick`은 반대로 Request만 둔다(반환 데이터가 없다).

### 7.3 파일명 컨벤션은 v3를 유지한다

v3 §5.5의 **camelCase + 점(.) 구분 접미사**를 그대로 쓴다. 자매 프로젝트의 PascalCase 파일명 규칙은
가져오지 않는다 — `pick.viewmodel.ts`가 `class PickViewModel`을 export한다.

예외(리네임 대상 아님): `page.tsx`(Next.js App Router 규약) · `index.ts`(배럴 규약).

---

## 8. 전체 폴더 구조

```
apps/web/src/
  app/
    page.tsx                        (프레임워크 규약 파일명 유지)
    home.presenter.ts               useHomePresenter — currentNumbers · isGeneratorOpen · activeTab
  modules/
    picks/
      action/  index.ts · getPicks.action.ts · savePick.action.ts · deletePick.action.ts
      model/   index.ts · pick.model.ts · pick.viewmodel.ts
      mapper/  index.ts · picks.mapper.ts · picks.mapper.test.ts
      view/    index.ts · picksCard.tsx · picks.presenter.ts
               component/  index.ts · pickRow.tsx
      index.ts
    results/
      action/  index.ts · checkResults.action.ts
      model/   index.ts · results.model.ts · results.viewmodel.ts
      mapper/  index.ts · results.mapper.ts
      view/    index.ts · resultsCard.tsx · results.presenter.ts
      index.ts
    identity/
      model/   index.ts · identity.model.ts · identity.viewmodel.ts
      view/    index.ts · identityBadge.tsx · identity.presenter.ts
      index.ts                       action·mapper 없음 — 서버 호출 없는 스텁
    statistics/
      action/  index.ts · getStatistics.action.ts
      model/   index.ts · statistics.model.ts · statistics.viewmodel.ts
      mapper/  index.ts · statistics.mapper.ts
      view/
        index.ts · statisticsPanel.tsx · statistics.presenter.ts · statistics.presenter.test.ts
        component/  index.ts + 8개 서브뷰 (§4)
      index.ts
    simulation/
      action/  index.ts · backtest.action.ts
      model/   index.ts · simulation.model.ts · simulation.viewmodel.ts
      mapper/  index.ts · simulation.mapper.ts
      view/    index.ts · simulationCard.tsx · simulation.presenter.ts
      index.ts
    generator/
      action/  index.ts · generateCombination.action.ts
      model/   index.ts · generator.model.ts · generator.viewmodel.ts
      mapper/  index.ts · generator.mapper.ts
      view/    index.ts · generatorCard.tsx · generator.presenter.ts
               component/  index.ts · modeSelector.tsx · numberPad.tsx · generatedResult.tsx
      index.ts
    lotterietus/
      action/  index.ts · getLotterietusStatus.action.ts
      model/   index.ts · lotterietus.model.ts · lotterietus.viewmodel.ts
      mapper/  index.ts · lotterietus.mapper.ts
      view/    index.ts · lotterietusCard.tsx · lotterietus.presenter.ts · lotterietus.presenter.test.ts
      index.ts
  shared/
    ui/   (변경 없음)
    lib/  fetcher.ts · lotto-colors.ts · actionState.ts (신규 — §1의 ActionState<T>)
```

`api/` 폴더는 전 모듈에서 사라진다(내용은 action 훅으로 흡수). `viewmodel/` 폴더도 사라진다(내용은
`model/*.viewmodel.ts` + `view/*.presenter.ts` + `action/*`로 3분해).

---

## 9. ESLint 경계 규칙

v3 §8의 두 규칙을 유지하고 폴더 개칭과 신설 계층을 반영한다.

1. `modules/**`는 DTO만 **타입 import** 가능하다. 백엔드의 `domain`/`application`/`infrastructure`
   import는 금지 — 기존 규칙 유지.
   (백엔드 전환 후 DTO 경로는 `@fortuna-lottery/core/*/dto` → `@fortuna-lottery/contract/*` 로 바뀐다 —
   동반 문서 §6)
2. `view/**`(및 `view/component/**`)는 자기 모듈의 `action/**` · `model/**`(+같은 폴더의
   `*.presenter.ts`) + `shared/ui` · `shared/lib`만 import한다. **`mapper/**` 직접 import 금지**
   (구 `transport/**`).
3. **오직 `action/**`만 `mapper/**`를 import한다.**
4. **오직 `mapper/**`만 DTO를 import한다** — 3의 역방향 명시. (Action은 fetcher 제네릭에 넘길 DTO
   타입을 import해야 하므로 **타입 import는 허용**한다.)
5. 모듈 간 소통은 공개 `index.ts`로만(deep import 금지). `app/`은 모듈 조립만, 로직 금지.

위반 시 CI 실패(빌드 실패)로 강제하는 기존 방침을 유지한다.

---

## 10. 테스트 전략

| 현재 | 변경 후 |
|---|---|
| `picks/transport/pick-transport.test.ts` | `picks/mapper/picks.mapper.test.ts` |
| `statistics/viewmodel/presenters.test.ts` | 분할 — 행/셀 파생값은 `model/statistics.viewmodel.test.ts`, 차트 가공은 `view/statistics.presenter.test.ts` |
| `lotterietus/viewmodel/format-remaining.test.ts` | `view/lotterietus.presenter.test.ts` (`now` 의존이므로 Presenter — §3.2) |
| 없음 | **신규** — ViewModel getter 테스트: `pick.viewmodel.test.ts` · `results.viewmodel.test.ts` · `simulation.viewmodel.test.ts` · `generator.viewmodel.test.ts` |
| 없음 | **신규** — Action 훅 테스트: 상태 전이(idle→loading→success/error) + **반환값이 `instanceof` ViewModel인지** |
| 없음 | **신규** — Presenter 번들 테스트: `renderHook`으로 번들 형태와 자식 props 타입 일치 확인 |

**인프라 신규 도입**(v3 §9 그대로):
- devDependency: `@testing-library/react` · `@testing-library/dom` · `jsdom`
- `apps/web/vitest.config.ts`에 `test.environment: "jsdom"`

§3.3 클래스 규칙 준수(인스턴스 화살표 프로퍼티가 없는지)는 테스트가 아니라 코드 리뷰로 확인한다 —
정적 읽기로 충분히 검증된다.

---

## 11. 마이그레이션 순서

**identity → results → simulation → lotterietus → generator → picks → statistics → App 셸**
(v3 §12 순서를 유지한다)

한 모듈씩 완전히 전환하고 `pnpm --filter web test` + `lint` + `build`를 통과시킨 뒤 다음 모듈로 넘어간다.

근거: `identity`는 서버 호출이 없어 가장 단순하고, `results`·`simulation`은 Action이 하나뿐이며,
`lotterietus`·`generator`는 실제 Presenter 상태(틱 타이머 / 모드 선택)가 있어 한 단계 위이고,
`picks`는 3개 Action의 조정(§1.3)이 필요해 더 복잡하며, `statistics`는 로직은 단순하지만 8개 서브뷰
이동(§4)까지 포함해 변경 범위가 가장 넓다. App 셸은 7개 모듈의 공개 표면이 확정된 뒤에야 조립
가능하므로 마지막이다.

**class 패턴 검증**: `identity`는 파생값이 거의 없으므로, class ViewModel의 getter·`static from`
패턴은 **`results`에서 처음 실질적으로 검증**된다. 여기서 어긋나면 나머지 5개로 확산하기 전에 잡는다.

---

## 12. 리스크와 완화

| 리스크 | 완화 |
|---|---|
| v3 §0의 interface 결정을 정면으로 뒤집는다 | 선행 문서 항목과 §3.1에 "무엇을 왜 뒤집는지"를 명시했다. 두 문서를 함께 읽는 사람이 어느 쪽이 최신인지 판단할 수 있어야 한다 |
| class ViewModel이 이 코드베이스에서 처음 시도하는 패턴 | `results`에서 먼저 검증한 뒤 확산(§11) |
| Presenter 번들이 `shared/ui` 컴포넌트의 props 타입에 결합된다 | shared/ui 시그니처가 바뀌면 Presenter만 고치면 되고 View로 번지지 않는다 — 결합 지점이 하나로 모이는 것이므로 수용 |
| mapper가 Model을 만들고 Action이 다시 VM으로 승격해 2회 순회 | 픽 수십 개·번호 45개 규모라 무시 가능. 측정 없이 최적화하지 않는다 |
| getter가 렌더마다 재계산된다 | 같은 이유로 무시 가능. 캐시 도입은 실제 프로파일링 후에만 |
| 정책 2(대표 View는 예외 없이 Presenter)로 `identity`처럼 빈 Presenter가 생긴다 | 예외를 두면 "이 모듈은 왜 다른가"를 매번 판단해야 한다 — 균일성의 값어치로 수용 |
| Action 훅 테스트 인프라(RTL+jsdom) 신규 도입 | 기존 순수 함수 테스트와 분리해 도입 — 실패해도 mapper 테스트에는 영향 없음 |
| 7개 모듈 전체 파일 리네임(camelCase) — 변경 범위가 넓다 | 모듈 단위로 순차 전환하고 매 모듈마다 test·lint·build 통과 확인 |
| 백엔드 전환과 맞물려 DTO import 경로가 또 바뀐다 | 동반 문서 §10의 1단계(`packages/contract` 분리)를 본 리팩터보다 **먼저** 수행해 경로를 한 번만 만진다 |
| OneDrive + git worktree 손상 (CLAUDE.md의 known quirk) | 브랜치 작업은 raw `git worktree add` 금지, Orca 네이티브 생성 사용 |

---

## 13. 완료 기준

- 7개 모듈이 `action/model/mapper/view/index.ts` 구조로 전환되고 `viewmodel/` · `api/` · `transport/`
  폴더가 전 모듈에서 사라진다.
- 모든 Action의 반환 타입이 `ActionState<ViewModel>`이다 — §1.2의 예외(원시값·반환 없는 트리거)만 제외.
- 모듈 대표 View 7개 + App 셸이 각각 자기 Presenter를 갖고, Presenter가 자식별 props 번들을 반환하며,
  **View 파일에는 레이아웃과 번들 spread 외에 아무 로직이 없다.**
- 모든 ViewModel이 class이고, §3.2 표의 파생값이 전부 새 집으로 이동했으며, 어떤 VM에도 인스턴스 화살표
  프로퍼티가 없다.
- `statistics`의 8개 서브뷰가 `view/component/`로 이동했다.
- `action` · `model` · `mapper` · `view`(+`view/component`가 존재하는 모듈) 각 폴더에 배럴이 있다.
- 모든 mapper 함수의 어간이 짝 Action 훅에서 `use`·`Action`을 뗀 것과 정확히 일치한다. `map` 접두가
  코드베이스에서 사라졌다.
- `view`에 mapper·DTO import가 0이고, `mapper`는 `action`에서만 import된다(§9 ESLint로 강제).
- 7개 모듈 전체 파일이 camelCase + 점 구분 접미사 네이밍을 따른다(`page.tsx`/`index.ts` 예외).
- MVP의 모든 기능(생성 · 통계 8종 · 시뮬레이션 · 픽 저장/삭제 · 결과 대조 · 카운트다운)이 리팩터 후
  동일하게 동작한다.
- `pnpm test` · `pnpm lint` · `pnpm build`가 전부 통과한다.
- **`CLAUDE.md`가 갱신됐다** — "모델 타입 용어" 표에 Presenter·Action·ActionState가 반영되고,
  "import 경계 규칙"이 §9로 대체되며, 폴더 구조 예시가 §8로 교체됐다.

---

## 14. 다음 단계

본 문서는 "무엇을 · 어떤 규칙으로"까지다. 실제 리팩터는 이후 **writing-plans → 구현 단계**에서 다룬다.
§11의 순서를 그대로 계획의 뼈대로 쓰고, 모듈 8개(7 + App 셸)를 각각 독립 태스크로 쪼갠다.
