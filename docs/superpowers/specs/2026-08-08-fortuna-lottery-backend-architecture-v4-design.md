# fortuna-lottery — 백엔드 아키텍처 v4 (NestJS · interface/business/context/domain 4계층)

작성일: 2026-08-08
선행 문서:
- `2026-07-03-fortuna-lottery-architecture-v2.md` — Next.js 위의 Lean Hexagonal + 2-tier 엄격도 + 용어표를
  확립한 문서. 본 문서는 그 **§아키텍처 전체(백엔드)·§모델 타입 용어·§2-tier 엄격도·§마이그레이션 경로를
  대체**한다. 제품 범위·정직성 원칙(v1 문서)은 변경 없음.
- `2026-06-04-fortuna-lottery-design.md` — v1 제품 범위. 변경 없음.

동반 문서: `2026-08-08-fortuna-lottery-client-architecture-v3-refinement-design.md`
  (같은 날 확정된 프론트 보정. 두 문서는 서로 독립적으로 실행 가능하다 — §10 참고)

적용 범위: `packages/core` 전체 · `apps/worker` · `apps/web/src/app/api/**` · `apps/web/src/server/`
  — `apps/web/src/modules/**`(프론트 모듈)는 대상 아님(동반 문서 소관)

상태: 확정 (본 문서 기준으로 백엔드 전환 → writing-plans)

---

## 0. 배경 — 왜 구조를 바꾸는가

v2는 "별도 백엔드 프로세스 없이 Next.js Route Handler가 유일한 인프라 계층"이라는 결정으로 섰다.
그 결정은 MVP를 빠르게 세우는 데 유효했지만, 지금 두 가지 요구가 생겼다.

1. **모듈이 독립 서비스로 분리 가능한 형태여야 한다.** v2도 마이그레이션 경로를 문서화했지만, 실제
   경계(모듈 간 호출 지점, 넘어가는 타입)가 코드에 표현돼 있지 않아 "나중에 잘라낼 수 있다"는 약속이
   검증된 적이 없다.
2. **유즈케이스가 커지면 `application/usecases/*.ts` 한 파일이 정책·조회·조합을 전부 떠안는다.**
   `check-results`가 이미 그 조짐을 보인다 — 픽 목록과 회차 데이터를 모으는 일과 등수를 판정하는
   정책이 같은 함수에 있다.

이번 개편은 레이어를 **interface / business / context / domain** 네 개로 재편하고, 그 네 폴더를 갖는
서비스 모듈을 프랙탈 단위로 삼는다. 실행 런타임은 NestJS(`apps/api`)로 옮긴다.

**v2에서 그대로 가져오는 것**: 의존 방향은 항상 안쪽을 향한다는 원칙, DTO가 클라이언트 무관 와이어
계약이라는 규정, 포트/어댑터로 인프라를 격리한다는 방침, 도메인 계산을 순수 함수로 유지하는 TDD 전제.

**v2에서 버리는 것**: Route Handler가 유스케이스를 인프로세스 호출한다는 배치(§7), `Entity`/`ReadModel`
용어(§8), 2-tier 엄격도(Tier-1/Tier-2 구분 — §4에서 context 생성 규칙으로 대체된다).

---

## 1. 네 계층의 책임

| 레이어 | 답하는 질문 | 담는 것 | 담지 않는 것 |
|---|---|---|---|
| **interface** | *누가 부르나* | HTTP 컨트롤러 · OpenAPI 정의 · 모듈 공개 Facade. 모듈을 대표한다 | 정책 판단, 조회, 계산 |
| **business** | *왜 / 무엇을* | 유즈케이스의 정책·규칙·판단. **도메인 언어로만** 쓰인다 | fetch, 조합, 병렬화, 트랜잭션 |
| **context** | *무엇을 갖춰주나* | 유즈케이스 전용 재료 조립. 다중 조회·병렬화·형태 변환·트랜잭션 경계 | 비즈니스 규칙 판단 |
| **domain** | *데이터가 어디서 오나* | Model · VO · 순수 계산 · 자기 데이터의 리포지토리 계약 | 다른 도메인 참조, 기술 구현체 |

### 1.1 business와 context를 가르는 시금석

두 레이어의 경계가 애매할 때 다음 한 줄로 판별한다.

> **이 코드를 도메인 전문가(로또 서비스 기획자)에게 그대로 읽어줄 수 있는가?**
> 읽어줄 수 있으면 `business`, 없으면 `context`.

- "6개가 모두 일치하면 1등, 5개와 보너스가 일치하면 2등" → **business**
- "픽 목록과 해당 회차를 병렬로 조회해 회차별로 묶는다" → **context**
- "45개 번호의 출현 빈도를 센다" → **domain**(순수 계산)
- "조회 결과를 5분간 캐싱한다" → **infra**

### 1.2 `infra` — 다섯 번째 폴더는 레이어가 아니다

`infra/`는 레이어가 아니라 **"계약의 구현체가 사는 곳"** 이다. domain이 선언한 리포지토리 계약이든
context가 선언한 외부 모듈 계약이든, 구현체는 전부 여기 모인다.

이 규정이 주는 성질: **외부 세계와 닿는 코드를 찾으려면 `infra/`만 보면 된다.** DB(Prisma), 외부
HTTP(동행복권), 다른 서비스 모듈이 전부 같은 자리에 있다.

```
infra/
  persistence/   자기 domain의 리포지토리 계약 구현 (Prisma)
  gateway/       자기 context의 port 구현 (다른 모듈 Facade · 외부 API)
```

---

## 2. 모듈 폴더 구조

```
apps/api/src/modules/results/
  results.module.ts             컴포지션 루트 — 계약↔구현체 바인딩 (Nest DI)
  interface/
    index.ts
    results.controller.ts        HTTP 진입 · OpenAPI 데코레이터
    results.facade.ts            모듈 공개 API — 다른 모듈이 부르는 유일한 문
  business/
    index.ts
    checkResults.business.ts     등수 판정 정책
  context/
    index.ts
    checkResults.context.ts      유즈케이스 전용 재료 조립 (1:1)
    port/
      index.ts
      picksProvider.port.ts       외부에 대한 자기 계약 (abstract class)
      drawProvider.port.ts
      identityProvider.port.ts
  domain/
    index.ts
    model/
      result.model.ts
  infra/
    index.ts
    gateway/
      picksFacade.adapter.ts      picks 모듈을 아는 유일한 파일
      lotterietusFacade.adapter.ts
      identityFacade.adapter.ts
```

자기 테이블을 가진 모듈(`picks`·`lotterietus`)은 반대 모양이다 — `gateway/` 대신
`domain/repository/`(계약)와 `infra/persistence/`(구현)가 짝을 이룬다.

```
apps/api/src/modules/picks/
  picks.module.ts
  interface/  picks.controller.ts · picks.facade.ts
  business/   savePick.business.ts
  context/    listPicks.context.ts · savePick.context.ts · deletePick.context.ts
              port/identityProvider.port.ts
  domain/
    model/       pick.model.ts · combination.vo.ts
    repository/  pick.repository.ts        abstract class (계약)
  infra/
    persistence/ pick.prisma.repository.ts  implements
    gateway/     identityFacade.adapter.ts
```

폴더별 `index.ts` 배럴 규칙은 프론트(동반 문서 §5)와 동일하다 — 폴더 밖에서는 배럴 경로만 쓰고, 같은
폴더 안에서는 순환을 피하기 위해 형제 파일을 직접 import한다.

---

## 3. 의존 규칙

기본 흐름은 `interface → business → context → domain`이지만 **단계를 건너뛸 수 있다.** 다만 "건너뛰기
허용"을 그대로 두면 규칙이 없는 것과 같아지므로, **허용 집합을 명시**한다.

### 3.1 허용

| 출발 | 갈 수 있는 곳 |
|---|---|
| `interface` | `business` · `context` · `domain` (자기 모듈) |
| `business` | `context` · `domain` |
| `context` | `domain` · 자기 `context/port` |
| `domain` | 자기 `domain` 내부만 |
| `infra` | 자기 모듈의 계약(`domain/repository` · `context/port`) + **다른 모듈의 `interface`** |
| 모든 레이어 | `packages/contract` (DTO) · `apps/api/src/shared` (순수 커널) |

### 3.2 금지 — ESLint로 CI 실패 처리

1. **역방향 전부** — `domain → context`, `context → business`, `business → interface` 등
2. **어떤 레이어든 `infra` import** — 구현체는 오직 DI로 주입된다. `*.module.ts`만 예외(컴포지션 루트)
3. **다른 모듈의 `interface` 외 폴더 접근** — 그리고 그 접근이 허용되는 파일은 `infra/gateway/**` 뿐
4. **같은 레이어 횡단** — `business → 다른 모듈 business` 등
5. **`domain`·`business`·`context`에서 `@prisma/client` import** — Prisma는 `infra/persistence/`에만

핵심 성질: **화살표는 항상 아래로만 흐르고, 위나 옆으로 가는 파일은 `infra/gateway/`뿐이다.**
그 파일 목록만 읽으면 이 모듈의 외부 의존이 전부 보인다.

---

## 4. context 규칙

### 4.1 생성 기준 — "외부에서 재료를 받아올 때 만든다"

> **context는 유즈케이스가 *외부에서* 재료를 받아올 때 만든다.**
> 자기 모듈 `domain` 하나로 끝나면 만들지 않는다.

여기서 "외부"는 **다른 서비스 모듈 + 외부 시스템**이다. 기계적 판별식은 한 줄이다 —
*"`context/port`(따라서 `infra/gateway/`)가 필요한가?"*

**유즈케이스 1개 : context 최대 1개.** 재료 조립이 없으면 0개이고, 그 경우 `business`나 `interface`가
`domain`을 직접 호출한다(§3.1이 허용하는 건너뛰기).

### 4.2 인증과 신원 재료는 다른 층이다

| | 무엇 | 어디 |
|---|---|---|
| **인증**(authentication) | 토큰·쿠키 검증, 401 반환, `UserKey` 추출 | `interface`의 Nest Guard — **횡단 관심사, 모듈마다 반복하지 않는다** |
| **신원 재료**(identity) | 그 사용자의 도메인 정보(게스트 여부·등급·구독 상태) | `context`가 `IdentityProvider` port로 주입받아 조립 |

Guard가 뽑은 `UserKey`는 값으로 아래로 내려가고, **그 사용자에 대해 더 알아야 할 때만** context가
identity 모듈을 부른다. 이렇게 나누지 않으면 모든 모듈의 context가 인증 코드로 도배된다.

MVP는 인증이 없지만 `IdentityProvider` port는 **지금 만든다.** 현재의
`GuestIdentityAdapter`가 그 자리에 그대로 들어가고, Supabase Auth 도입 시 어댑터만 교체되며 context는
무수정이다. 지금 생략하면 인증 도입이 곧 리팩터가 된다.

### 4.3 적용 결과 (7개 도메인)

| 모듈 / 유즈케이스 | 외부 재료 | context |
|---|---|---|
| `picks` list · save · delete | identity | **O** |
| `results` check | identity + picks + draws | **O** |
| `simulation` backtest | draws | **O** |
| `statistics` get | draws (lotterietus 소유) | **O** |
| `lotterietus` ingest-draws | 동행복권 API | **O** |
| `lotterietus` get-status | 자기 domain(draws)만 | X |
| `generator` generate | 없음 (순수 계산) | X |
| `identity` | 자기 domain만 | X |

---

## 5. 모듈 간 경계 (MSA 프랙탈)

### 5.1 경계를 넘는 타입은 DTO뿐

> **모듈 경계 = 미래의 네트워크 경계.** 그 경계를 넘는 타입은 직렬화 가능해야 한다.
> `Model` · `VO` · `*Context` 객체는 **절대 모듈 밖으로 나가지 않는다.**

Facade의 파라미터와 반환 타입은 반드시 `packages/contract`의 DTO다. 이 제약 덕분에 모듈을 서비스로
분리할 때 **직렬화 계층을 새로 만들 필요가 없다** — 어댑터 구현만 HTTP 클라이언트로 바뀐다.

```ts
// picks/interface/picks.facade.ts
export class PicksFacade {
  listByUser(userKey: string): Promise<PickResponse[]> { /* … */ }
}

// results/context/port/picksProvider.port.ts   ← results가 선언하는 자기 계약
export abstract class PicksProvider {
  abstract listByUser(userKey: string): Promise<PickResponse[]>;
}

// results/infra/gateway/picksFacade.adapter.ts  ← picks를 아는 유일한 파일
export class PicksFacadeAdapter extends PicksProvider {
  constructor(private readonly picks: PicksFacade) { super(); }
  listByUser(userKey: string) { return this.picks.listByUser(userKey); }
}

// results/results.module.ts
providers: [{ provide: PicksProvider, useClass: PicksFacadeAdapter }]
```

port를 TS `interface`가 아니라 `abstract class`로 두는 이유: Nest DI 토큰은 런타임 값이어야 하는데
interface는 컴파일 후 사라진다. `abstract class`면 토큰과 타입을 한 선언으로 겸한다.

### 5.2 서비스 분리 시 바뀌는 것

```
분리 전:  PicksFacadeAdapter  →  PicksFacade (인프로세스)
분리 후:  PicksHttpAdapter    →  HTTP  →  picks 서비스의 PicksController
```

`results`의 `context` · `business` · `domain`은 한 줄도 바뀌지 않는다. 바뀌는 파일은
`infra/gateway/*.adapter.ts` 하나와 `results.module.ts`의 바인딩 한 줄이다.

### 5.3 모듈 의존 그래프는 DAG

순환 의존은 금지하며 CI에서 검사한다. 현재 그림:

```
results ──► picks ──────► identity
   ├──────► lotterietus ◄── statistics
   ├──────► identity        ◄── simulation
generator (의존 없음)
```

---

## 6. 패키지 재편

```
packages/contract/          신규 — DTO만. FE·BE의 유일한 공유 지점
  src/<domain>/*.dto.ts
  package.json   exports: { "./<domain>": "./src/<domain>/index.ts" }

apps/api/                   신규 — NestJS
  prisma/schema.prisma       ← packages/core/prisma 에서 이사
  src/
    main.ts
    app.module.ts
    shared/                  순수 커널 — combination · scoring · rng · result
    modules/<7개 도메인>/

apps/web/                   유지 — modules/** 는 contract DTO만 type import
apps/worker/                삭제 → lotterietus 모듈의 @nestjs/schedule 로 흡수
packages/core/              삭제
```

### 6.1 `packages/core`를 축소하지 않고 삭제하는 이유

"core"라는 이름이 지금은 *"7개 도메인 전부"* 를 뜻하는데 축소하면 *"DTO와 유틸"* 을 뜻하게 된다. 같은
이름이 정반대 크기를 가리키면 문서와 대화가 계속 어긋난다. 이름을 새로 주는 편이 싸다.

### 6.2 순수 커널을 별도 패키지로 만들지 않는 이유

`core/shared`(combination · scoring · rng · result)는 실제로 백엔드 도메인 5개 파일에서만 쓰이고
`apps/web`은 한 번도 import하지 않는다(2026-08-08 확인). 공유 대상이 아니므로 패키지가 아니라
`apps/api/src/shared/`면 충분하다.

### 6.3 `countdown` 정리

`packages/core/src/countdown/`은 lotterietus 병합 이후 빈 폴더만 남아 있다. 이전 대상이 아니라 삭제
대상이다.

---

## 7. `apps/web` ↔ `apps/api` — 투명 catch-all 프록시

브라우저는 계속 같은 오리진의 `/api/*`만 호출하고, Next가 Nest로 중계한다.

```ts
// apps/web/src/app/api/[...path]/route.ts   ← 이 파일 하나가 기존 7개를 대체
const API = process.env.API_ORIGIN!;   // 서버 전용 env — 브라우저에 노출되지 않는다

async function proxy(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const { search } = new URL(req.url);
  return fetch(`${API}/${path.join("/")}${search}`, {
    method: req.method,
    headers: forwardHeaders(req),     // cookie · authorization · content-type 만
    body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
    duplex: "half",
  });
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
```

### 7.1 규칙 — 프록시는 DTO를 읽지도 만들지도 않는다

이 규칙이 지켜지는 한 프록시는 계층이 아니다. 도메인이 20개로 늘어도 이 파일은 바뀌지 않고, 도메인
이름이 한 번도 등장하지 않는다. 바디를 **파싱하지 않고 스트림 그대로 흘리므로** DTO를 만질 방법 자체가
없다 — 규칙을 문서가 아니라 구조가 지킨다.

유지 조건 두 가지:
- `apps/web/src/app/api/` 아래 파일은 `[...path]/route.ts` **하나뿐**이어야 한다(§11 회귀 테스트).
- 어기려면 파일 구조를 바꿔야 하므로 반드시 리뷰에 걸린다.

### 7.2 이 배치를 고르는 이유

| | 도메인별 route.ts 8개 | **catch-all 1개** | 프록시 없음(브라우저→Nest) |
|---|---|---|---|
| 도메인 추가 시 web 변경 | 파일 +1 | **0** | 0 |
| DTO를 만질 수 있나 | 만지게 됨(구조가 유도) | **불가능** | 해당 없음 |
| CORS | 불필요 | **불필요** | 필요 |
| 세션 쿠키(Supabase Auth 예정) | 동일 오리진 | **동일 오리진** | 도메인·SameSite 씨름 |
| Nest 공개 노출 | 불필요 | **불필요** | 필수 |
| 프론트 action/mapper | 무수정 | **무수정** | baseURL·에러 형태 변경 |
| 네트워크 홉 | +1 | +1 | 0 |

정직한 대가는 **네트워크 홉 1회**다. 같은 리전이면 수 ms, 리전이 갈리면 수십 ms이므로 **web과 api를
같은 리전에 배포하는 것을 운영 조건으로 명시**한다.

### 7.3 서버 컴포넌트(RSC)로 데이터를 가져오지 않는 이유

프론트의 Action은 `idle/loading/success/error`를 소유하는 클라이언트 훅이다. RSC로 가져온 데이터는 그
상태 기계 밖에 있어서, 화면마다 "props로 온 데이터"와 "Action이 가진 데이터"가 섞이고 재조회·낙관적
갱신 경로가 두 벌이 된다. 게다가 이 앱은 생성기·백테스트·픽 저장/삭제·카운트다운 틱이 전부 인터랙션
기반이라 초기 HTML에 실을 것이 적다.

**데이터 진입 경로는 Action 훅 하나로 통일한다.** 통계 패널의 초기 데이터를 서버에서 실어주는 것은
값어치가 있을 수 있으나, 필요해지는 시점에 그 한 곳만 추가한다(YAGNI).

---

## 8. 용어 정합 — v2 §모델 타입 용어표 개정

`Entity`와 `ReadModel`을 **폐기하고 `Model`로 통합**한다.

- **Entity 폐기** — Prisma schema가 이미 테이블의 SSOT다. `PickEntity`를 따로 두면 `PrismaClient`가
  생성하는 `Pick` 타입과 이름이 겹쳐 "어느 쪽이 진짜냐"를 매번 판단해야 한다. 영속되는지 여부는
  `domain/repository/`에 계약이 있느냐로 이미 드러난다.
- **ReadModel 폐기** — 통계처럼 파생된 것도 결국 도메인 데이터다. 순수 계산의 산출물이라는 사실은
  `domain/`에 있으면서 repository가 없다는 것으로 충분히 드러난다.
- **2-tier 엄격도 폐기** — Tier-1/Tier-2 구분은 "VO·Entity를 억지로 만들지 마라"는 지침이었는데,
  §4.1의 context 생성 기준과 위 통합으로 그 목적이 달성된다. 도메인마다 다른 규칙을 기억할 필요가
  없어진다.

| 계층 | 타입 | 파일 | 역할 |
|---|---|---|---|
| **공유** | **DTO** | `contract/<d>/*.dto.ts` | 와이어 계약. FE·BE·모듈 경계를 넘는 유일한 타입 |
| interface | Controller · Facade | `*.controller.ts` · `*.facade.ts` | HTTP 진입 · 모듈 공개 API |
| business | Business | `*.business.ts` | 유즈케이스 정책 — 도메인 언어로만 |
| context | **Context** | `*.context.ts` | 유즈케이스 전용 재료 (1:1) |
| context | **Port** | `port/*.port.ts` | 외부에 대한 계약 (`abstract class`) |
| domain | **Model** | `model/*.model.ts` | 도메인 데이터 (구 Entity · ReadModel 통합) |
| domain | **VO** | `model/*.vo.ts` | 값 객체 — `CombinationVO`(6개 · 1~45 · 중복 없음) |
| domain | **Repository** | `repository/*.repository.ts` | 자기 데이터 계약 (`abstract class`) |
| infra | **Adapter** | `persistence/*.adapter.ts` · `gateway/*.adapter.ts` | 모든 계약의 구현체 |

프론트의 `Model`/`ViewModel`은 다른 패키지에 살고 서로 import가 금지돼 있으므로 이름이 겹쳐도 충돌하지
않는다(v2에서도 그랬다).

---

## 9. 도메인별 이전 매핑

### 9.1 identity

| 기존 | 이후 |
|---|---|
| `application/ports/identity.port.ts` | `domain/repository/identity.repository.ts` (abstract class) |
| `domain/user.ts` | `domain/model/user.model.ts` |
| `infrastructure/adapters/guest-identity.adapter.ts` | `infra/persistence/guestIdentity.adapter.ts` |
| (DTO 없음) | `contract/identity/identity.dto.ts` **신규** — Facade 반환 타입이 필요하다 |
| (없음) | `interface/identity.facade.ts` **신규** — picks·results가 부르는 문 |

context 없음(§4.3). controller 없음 — 현재 HTTP 엔드포인트가 없고 다른 모듈만 부른다.

### 9.2 lotterietus

| 기존 | 이후 |
|---|---|
| `application/ports/draw-data.port.ts` | `domain/repository/draw.repository.ts` |
| `application/ports/draw-source.port.ts` | `context/port/drawSource.port.ts` (외부 API = 외부 재료) |
| `application/ports/draw-writer.port.ts` | `domain/repository/drawWriter.repository.ts` |
| `application/usecases/get-lotterietus-status.ts` | `business/getLotterietusStatus.business.ts` (context 없음) |
| `application/usecases/ingest-draws.ts` | `business/ingestDraws.business.ts` + `context/ingestDraws.context.ts` |
| `domain/{draw,drawn-at,schedule}.ts` | `domain/model/draw.model.ts` · `domain/drawnAt.ts` · `domain/schedule.ts` |
| `infrastructure/adapters/dhlottery-draw-source.adapter.ts` | `infra/gateway/dhlotteryDrawSource.adapter.ts` |
| `infrastructure/adapters/prisma-draw-*.adapter.ts` | `infra/persistence/prismaDraw*.adapter.ts` |
| `infrastructure/adapters/dummy-draw-data.adapter.ts` | `infra/persistence/dummyDrawData.adapter.ts` (테스트·시드용 유지) |
| `infrastructure/prisma-client.ts` | `apps/api/src/shared/prisma.service.ts` (Nest provider) |
| `apps/worker/src/main.ts` | `interface/lotterietus.scheduler.ts` (`@nestjs/schedule`) |

### 9.3 generator

| 기존 | 이후 |
|---|---|
| `domain/generate.ts`(+test) | `domain/generate.ts` — 순수 계산, 무변경 |
| `application/usecases/generate-combination.ts` | `business/generateCombination.business.ts` |
| `dto/generator.dto.ts` | `contract/generator/generator.dto.ts` |

context 없음, infra 없음(외부 의존 0). **가장 단순하므로 Nest 배관을 여기서 먼저 뚫는다.**

### 9.4 picks

| 기존 | 이후 |
|---|---|
| `application/ports/pick-repository.port.ts` | `domain/repository/pick.repository.ts` |
| `application/vo/pick.vo.ts` | `domain/model/combination.vo.ts` |
| `domain/pick.entity.ts` | `domain/model/pick.model.ts` (**Entity 용어 폐기** — §8) |
| `application/usecases/{list,save,delete}-pick.ts` | `business/*.business.ts` + `context/*.context.ts` (identity 재료) |
| `infrastructure/adapters/in-memory-pick.repository.ts` | `infra/persistence/inMemoryPick.repository.ts` |
| (없음) | `context/port/identityProvider.port.ts` · `infra/gateway/identityFacade.adapter.ts` **신규** |
| (없음) | `interface/picks.facade.ts` **신규** — results가 부르는 문 |

### 9.5 statistics

| 기존 | 이후 |
|---|---|
| `domain/calculations.ts` | `domain/calculations.ts` — 순수 계산, 무변경 |
| `application/readmodel/statistics.readmodel.ts` | `domain/model/statistics.model.ts` (**ReadModel 용어 폐기**) |
| `application/usecases/get-statistics.ts` | `business/getStatistics.business.ts` + `context/getStatistics.context.ts` |
| (없음) | `context/port/drawProvider.port.ts` · `infra/gateway/lotterietusFacade.adapter.ts` **신규** |

### 9.6 simulation

| 기존 | 이후 |
|---|---|
| `domain/backtest.ts` | `domain/backtest.ts` — 순수 계산, 무변경 |
| `application/usecases/backtest-combination.ts` | `business/backtestCombination.business.ts` + `context/backtestCombination.context.ts` |
| (없음) | `context/port/drawProvider.port.ts` · `infra/gateway/lotterietusFacade.adapter.ts` **신규** |

### 9.7 results

| 기존 | 이후 |
|---|---|
| `application/usecases/check-results.ts` | `business/checkResults.business.ts`(등수 판정 정책) + `context/checkResults.context.ts`(재료 조립) |
| (domain 폴더 없음) | `domain/model/result.model.ts` **신규** |
| (없음) | `context/port/{picks,draw,identity}Provider.port.ts` · `infra/gateway/*.adapter.ts` ×3 **신규** |

**가장 복잡하다** — 모듈 간 port가 3개다. 이전 순서의 마지막이다.

---

## 10. 마이그레이션 순서

전체를 한 번에 넘기지 않는다. **catch-all 프록시를 먼저 깔아두고, 도메인 `route.ts`를 하나씩 삭제하면
그 도메인만 Nest로 넘어간다** — Next는 구체 경로가 catch-all보다 우선하기 때문이다. 문제가 생기면
`route.ts` 하나를 되살리면 롤백된다.

| 단계 | 내용 | 검증 |
|---|---|---|
| **1** | `packages/contract` 분리 — DTO를 core에서 떼고 web·core가 여기를 보게 | `pnpm build` |
| **2** | **프론트 v3+보정 리팩터** (동반 문서 소관 — 백엔드와 독립) | 모듈마다 test·lint·build |
| **3** | `apps/api` 골격(main·app.module·shared·prisma 이사) + catch-all 프록시 배치 | 스모크 — 프록시는 아직 잠들어 있다 |
| **4** | **도메인 7개 이전 ×7** — 각 도메인: Nest 모듈 완성 → 해당 `route.ts` 삭제 → 프록시로 전환 → 동작 확인 | 도메인마다 test·lint·build + 수동 확인 |
| **5** | worker 흡수 · `container.ts` · `packages/core` · 빈 `countdown/` 삭제 | 전체 |

**2단계를 백엔드보다 먼저 두는 이유**: 프론트 리팩터는 `/api/*` 호출 형태를 바꾸지 않으므로 백엔드
이전과 완전히 독립이다. 먼저 끝내두면 4단계 컷오버 중 프론트를 한 줄도 건드리지 않는다.

**4단계 내부 순서** — 의존 그래프의 잎부터:

```
identity → lotterietus → generator → picks → statistics → simulation → results
                                    (identity) (lotterietus) (lotterietus)  (3개 gateway)
```

`identity`가 가장 먼저인 이유는 외부 의존이 0이라 Nest 배관(모듈·DI·토큰·테스트 하네스)을 여기서
검증할 수 있기 때문이고, `results`가 마지막인 이유는 모듈 간 port가 3개로 가장 복잡하기 때문이다.

---

## 11. 테스트 전략

| 대상 | 방식 |
|---|---|
| `domain` 순수 함수 | 기존 테스트를 **이사만** 한다 — 로직 무변경. `generate` · `backtest` · `calculations` · `drawnAt` · `schedule` · `combination` · `scoring` |
| `context` | fake port(`abstract class` 구현체)를 주입한 단위 테스트. DB·HTTP 없음 |
| `business` | 순수 정책 함수 테스트 |
| `interface` | 도메인당 controller 스모크 1개 (Nest e2e) |
| **프록시** | 통합 테스트 1개 — **요청·응답 바디가 바이트 단위로 동일한지** 검증 |
| 모듈 의존 그래프 | 순환 없음(DAG) 검사 |

프록시 테스트가 §7.1 규칙의 회귀 방어선이다 — 누군가 바디를 파싱해 손대면 이 테스트가 깨진다.

`apps/web/src/app/api/` 파일 수 검사(=1)도 CI에 넣어 §7.1의 유지 조건을 기계적으로 지킨다.

---

## 12. 리스크와 완화

| 리스크 | 완화 |
|---|---|
| 한 번에 바뀌는 양이 매우 큼 (백엔드 전면 + 프론트 전면) | 5단계로 쪼개고 **각 단계가 독립적으로 동작 가능한 상태**로 끝나게 한다. 4단계는 도메인 단위 롤백 가능 |
| NestJS 학습곡선 (DI 토큰 · 모듈 · 데코레이터) | 외부 의존 0인 `generator`/`identity`에서 배관을 먼저 뚫고 나머지에 확산 |
| `business`↔`context` 경계가 시간이 지나며 흐려짐 | §1.1 시금석을 스펙에 명시 + §3.2 ESLint 의존 규칙 |
| 프록시가 결국 변환 계층이 됨 | §7.1 규칙 + 바이트 동일성 테스트 + `app/api/` 파일 수 검사 |
| worker 흡수 후 다중 인스턴스에서 수집 중복 실행 | 지금은 단일 인스턴스라 무해. **스케일아웃 시 DB 어드바이저리 락이 필요**하다 — 그 시점의 선결 조건으로 기록 |
| 네트워크 홉 1회 추가로 인한 지연 | web·api를 **같은 리전에 배포**하는 것을 운영 조건으로 명시 |
| ESLint 경계 규칙이 Nest 데코레이터/DI와 충돌 | port를 `abstract class`로 통일 → 값 import가 계약 폴더에서만 발생하므로 규칙이 단순해진다 |
| `packages/core` 삭제 후 되돌리기 어려움 | 5단계(삭제)를 마지막에 두고, 그 전까지 core는 참조되지 않은 채 남아 있다 |
| `identity`에 DTO가 없어 Facade 계약을 새로 정의해야 함 | 9.1에서 `contract/identity`를 신규 항목으로 명시 |
| OneDrive + git worktree 손상 (CLAUDE.md의 known quirk) | 브랜치 작업은 raw `git worktree add` 금지, Orca 네이티브 생성 사용 |

---

## 13. 완료 기준

- `apps/api`(NestJS)가 7개 도메인 모듈을 갖고, 각 모듈이
  `interface/business/context/domain(+infra)` 폴더 구조를 따른다.
- §3.2의 금지 규칙 5개가 ESLint로 강제되고 위반 시 CI가 실패한다.
- context가 §4.1 기준대로 존재한다 — `picks`(3) · `results` · `simulation` · `statistics` ·
  `lotterietus/ingest-draws`에 있고, `lotterietus/get-status` · `generator` · `identity`에는 없다.
- 모든 Facade의 입출력 타입이 `packages/contract`의 DTO다. `Model`·`VO`·`*Context`가 모듈 밖으로
  나가는 곳이 0이다.
- 다른 모듈을 import하는 파일이 `infra/gateway/**`로 한정된다.
- 모듈 의존 그래프에 순환이 없다.
- `apps/web/src/app/api/` 아래 파일이 `[...path]/route.ts` 하나뿐이고, 그 파일에 도메인 이름이 한 번도
  등장하지 않으며, 바이트 동일성 테스트가 통과한다.
- `packages/core` · `apps/worker` · `apps/web/src/server/container.ts` · 빈 `countdown/`이 삭제됐다.
- `Entity` · `ReadModel` 용어가 코드베이스에서 사라졌다.
- **`CLAUDE.md`가 갱신됐다** — "아키텍처: Next.js 위의 Lean Hexagonal" · "모델 타입 용어" · "2-tier
  엄격도" · "import 경계 규칙" · "MVP 현황" · "명령어" 절이 본 문서 기준으로 다시 쓰였다. 이 갱신 없이는
  다음 세션이 폐기된 구조를 근거로 작업하게 된다.
- 기존 도메인 순수 함수 테스트가 로직 변경 없이 전부 통과한다.
- MVP의 모든 기능(생성 · 통계 8종 · 시뮬레이션 · 픽 저장/삭제 · 결과 대조 · 카운트다운 · 추첨 수집)이
  전환 후 동일하게 동작한다.
- `pnpm test` · `pnpm lint` · `pnpm build`가 전부 통과한다.

---

## 14. 다음 단계

본 문서는 "무엇을 · 어떤 구조로"까지다. 실제 전환은 이후 **writing-plans → 구현 단계**에서 다룬다.
§10의 5단계를 그대로 계획의 뼈대로 쓰고, 4단계는 도메인 7개를 각각 독립 태스크로 쪼갠다.
