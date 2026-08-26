# CLAUDE.md

이 문서는 이 저장소에서 작업하는 Claude Code(claude.ai/code)를 위한 가이드다.

## 이 저장소는 무엇인가

**로또랩 (fortuna-lottery)** — 한국 로또 6/45 사용자를 위한 의사결정 도우미 서비스. 실제 로또를 사기 전에
과거 회차 데이터 기반의 정직한 통계를 보여주고, 번호는 사용자가 직접 고르게 한다. 예측력을 주장하지
않는다는 원칙을 명시적으로 지킨다: 로또 추첨은 매 회차 독립 사건이며 과거 통계는 미래 당첨 확률을
높이지 못한다 — 핫/콜드·확률 관련 화면은 모두 이 사실을 명시해야 한다. 몰입감 있는 UX(다음 추첨
카운트다운, 희귀도 배지, "타임머신" 백테스트)는 이 정직한 통계 위에 얹히는 것이며, 이 정직함이
곧 후속 구독 전환의 신뢰 기반이다.

설계 문서 (v2가 아키텍처를 대체하지만 v1의 제품 범위는 그대로 계승):
- `docs/superpowers/specs/2026-06-04-fortuna-lottery-design.md` — v1: 제품 개요·기능 범위·정직성 원칙 (이 부분은 지금도 유효)
- `docs/superpowers/specs/2026-07-03-fortuna-lottery-architecture-v2.md` — v2: 현재 아키텍처 (Next.js 위의 Lean Hexagonal — v1의 별도 NestJS 백엔드 설계를 대체)

참고: 이 저장소는 사용자의 Obsidian vault(별도로 관리되는 OneDrive 동기화 폴더) 안에 위치하지만,
`RoJaebl/fortuna-lottery`라는 자체 GitHub 원격 저장소를 가진 독립된 git 저장소다 — vault의
PARA/MOC 규칙과는 무관하다.

## 작업 전 필수 참고 — `.claude/context/` (SSOT)

`.claude/context/`는 이 저장소에서 작업을 시작하기 전에 알아야 하거나 참고하면 도움이 되는 문서를
모아두는 SSOT(Single Source of Truth) 폴더다. 코드/디자인/설정 변경 등 어떤 작업이든 시작하기 전에
이 폴더의 문서 목록을 먼저 확인하고, 관련 내용이 있으면 그것을 우선 근거로 삼는다.

- 문서는 조사/의사결정의 최종 결론과 현재 상태만 담는다 — 탐색 과정, 중간 시행착오, 폐기된 대안은
  기록하지 않는다.
- 실제 코드/설정 상태와 문서 내용이 어긋난 것을 발견하면, 작업을 계속하기 전에 문서를 최신 상태로
  갱신한다.

현재 문서: `design-system.md` (컬러 토큰).

## superpowers 스킬 워크플로 — 계획/스펙 문서 선(先) 커밋

`superpowers:subagent-driven-development` 또는 `superpowers:executing-plans` 스킬로 구현 작업을
실행할 때, 그 작업이 참조하는 `docs/superpowers/plans/`의 계획 문서나 `docs/superpowers/specs/`의
스펙 문서가 아직 커밋되지 않은 상태라면, 구현에 들어가기 전에 먼저 그 문서들을 커밋한다.

모든 구현이 끝난 뒤에 계획/스펙 문서가 뒤늦게 (혹은 구현 커밋과 뒤섞여) 커밋되는 것은 작업 흐름상
순서가 맞지 않는다 — 계획 문서는 구현의 근거이므로, 구현보다 먼저 저장소 히스토리에 존재해야 한다.

## 명령어

```bash
pnpm install
pnpm dev      # turbo dev — apps/web 실행 (next dev)
pnpm test     # turbo test — packages/core (vitest, 44개) + apps/web (vitest, 10개)
pnpm lint     # turbo lint — apps/web: eslint(경계 규칙) ; packages/core: tsc --noEmit
pnpm build    # turbo build
```

개발 중 특정 패키지만 빠르게 돌릴 때는 turbo를 거치지 않고 직접 실행:
```bash
pnpm --filter @fortuna-lottery/core test
pnpm --filter web test
pnpm --filter web lint
```
Vitest로 파일 하나만 돌릴 때는 `pnpm --filter @fortuna-lottery/core exec vitest run <path>` (web도 동일).

## 아키텍처: Next.js 위의 Lean Hexagonal

별도 백엔드 프로세스 없이 단일 Next.js 앱으로 구성된다. 비즈니스 로직은 프레임워크에 의존하지 않는
순수 TS 패키지인 `packages/core`에 있고, `apps/web/src/app/api/**` 아래의 Next.js Route Handler만이
이 core를 호출할 수 있는 유일한 인프라 계층이다.

```
apps/web/src/
├─ app/
│  ├─ (pages)              라우트 — 모듈 조립만, 로직 없음
│  └─ api/<domain>/route.ts   HTTP 입구 — core의 application/infrastructure를 import할 수 있는 유일한 곳
├─ modules/<domain>/        FMA 프론트 모듈 — 아래 모델 타입 표 참고
│  ├─ view/                 *View 컴포넌트
│  ├─ viewmodel/            use*ViewModel — 순수 presenter 로직 + hooks
│  ├─ model/                *Model — interface만, 로직 없음
│  ├─ transport/
│  │  ├─ mapper/            *RequestMapper: FE Model → 요청 DTO
│  │  └─ assembler/         *ResponseAssembler: 응답 DTO → FE Model
│  ├─ api/                  api-client, shared/lib/fetcher 사용
│  └─ index.ts              모듈의 유일한 공개 진입점
├─ server/                  컴포지션 루트 — 포트에 어댑터를 주입 (예: container.ts)
└─ shared/                  ui(디자인 시스템), lib(fetcher·utils)

packages/core/src/<domain>/     프레임워크 0, 순수 TS — 단일 타입 소스
├─ domain/                  엔티티, 순수 계산/검증 함수
├─ application/
│  ├─ usecases/
│  ├─ ports/                도메인이 의존하는 인터페이스 (예: DrawDataPort, PickRepositoryPort)
│  ├─ vo/                   도메인 데이터를 조합하는 값 객체 (예: PickVO, CombinationVO)
│  └─ readmodel/            비영속 파생 결과 (Tier-2 전용, 예: statistics)
├─ dto/                     와이어 계약 (*Request / *Response) — 클라이언트 무관
└─ infrastructure/adapters/ 포트 구현체 (DummyDrawDataAdapter, InMemoryPickRepository, …)
```

의존성 방향은 항상 안쪽을 향한다: `app/api`(인프라) → `core/application`(유스케이스) →
`core/domain`(순수). `core/*`는 `packages/core/package.json`의 subpath export로 슬라이스별 개별
export된다 (`@fortuna-lottery/core/<domain>/dto`, `.../domain`, `.../application`, `.../infrastructure`) —
단일 barrel export는 없다.

### 모델 타입 용어 (이름 자체가 규칙이므로 임의로 다른 이름을 쓰지 않는다)

| 계층 | 타입 | 이름 규칙 | 역할 |
|---|---|---|---|
| Client | **ViewModel** | `use*ViewModel` | 순수 presenter: 정렬, 공 색, 홀짝 라벨, 희귀도 배지, "예측 아님" 라벨 |
| Frontend | **Model** | `*Model` (interface) | ViewModel이 의존하는 계약; 로직 없음 |
| FE→BE | **Mapper** | `*RequestMapper` | FE Model → 요청 DTO |
| BE→FE | **Assembler** | `*ResponseAssembler` | 응답 DTO → FE Model (이걸 "Adapter"라고 부르지 않는다 — 그 이름은 따로 예약됨) |
| Backend 전송 | **DTO** | `*Request` / `*Response` | 클라이언트 무관 와이어 계약 |
| Backend 조합 | **VO** | `*VO` | 도메인 데이터를 조합·검증 (예: `CombinationVO` = 6개·1~45·중복 없음) |
| 영속 | **Entity** | `*Entity` | DB 테이블과 1:1, 단일 책임 (아래 참고) |
| 파생 | **ReadModel** | `*ReadModel` | 순수 계산, 비영속 (통계·백테스트) |
| 인프라 | **Adapter** | `*Adapter` | 헥사고날 포트 구현체 전용 — 이 이름은 이 용도로만 예약됨 |

### 2-tier 엄격도 — Tier-2 도메인에 일관성을 위해 VO/Entity를 억지로 추가하지 않는다

- **Tier-1** (쓰기 소유: `picks`, `results`, `identity`) — 풀 파이프라인: ViewModel · Model · Mapper · Assembler · DTO · VO · Entity.
- **Tier-2** (읽기 전용/파생: `draw`, `statistics`, `simulation`, `generator`, `countdown`) — 얇게: ViewModel · Model · Assembler · DTO · ReadModel (Mapper는 요청 본문이 있을 때만; VO/Entity 없음).
- `social-proof`는 후속 단계용으로 자리만 확보되어 있고 아직 구현되지 않았다.
- Tier-2 도메인에 쓰기 기능이 추가되면(예: simulation에 저장 버튼) Tier-1로 승격하고 v2 문서를 갱신한다.

### import 경계 규칙 — `apps/web/eslint.config.mjs`로 강제, lint 위반 = 빌드 실패

1. `modules/**`는 `@fortuna-lottery/core/*/dto`만 **타입 import** 가능. 모듈에서 core의 `domain`,
   `application`, `infrastructure`, `shared`를 import하면 lint 에러다 — FE 코드는 Entity를 절대
   건드릴 수 없다.
2. `app/api/**`만 런타임에 core의 `application`/`infrastructure`를 import할 수 있다(유스케이스 조립·호출).
3. 모듈은 `shared`와 자기 내부만 import한다; 모듈 간 소통은 상대 모듈의 `index.ts`로만 (deep import 금지).
4. `app/` 아래 라우트는 모듈을 조립만 하고 비즈니스 로직을 두지 않는다 (`api/`가 아닌 나머지
   `app/` 파일에도 이 규칙이 적용된다).

### 영속화 규칙 (실제 테이블이 생기면 적용 — MVP는 인메모리만 사용)

테이블 하나 = 도메인 하나의 데이터, 예외 없음. 도메인 간 관계는 다른 도메인 테이블에 컬럼을
추가하는 대신 `(user_key + service_key)` 조합의 전용 테이블을 만든다 — 이렇게 해야 나중에 도메인을
별도 서비스로 분리할 때 테이블째로(+`core/<domain>`) 잘라낼 수 있다. 구체적인 `users` / `picks` /
`results` / `draws` 구조는 v2 문서 §5 참고.

### 마이그레이션 경로 (단일 앱 → 서비스 분리)

`app/api/<domain>/route.ts`의 Route Handler는 현재 유스케이스를 인프로세스로 호출한다. 나중에
특정 도메인을 별도 서비스로 분리하려면: `core/<domain>`을 새 서비스로 옮기고 컨트롤러로 감싼 뒤
(DTO는 이미 와이어 계약이다), Route Handler의 인프로세스 호출을 HTTP 클라이언트 호출로 바꾸면 된다.
ViewModel/Model/DTO/Domain 코드는 한 줄도 바뀌지 않는다 — 단일 프로세스 안에서도 전송 이음새
(Mapper/Assembler)를 엄격하게 유지하는 이유가 바로 이것이다.

## MVP 현황

데이터 소스는 `PrismaDrawDataAdapter`(PostgreSQL, `docker-compose.yml`로 로컬 기동) — 실제 동행복권
당첨 데이터가 회차 1부터 빈틈없이 들어 있다. 별도 프로세스인 `apps/worker`가 동행복권 비공식
엔드포인트를 `IngestDraws` 유스케이스로 주기적으로(매주 추첨 이후) 수집해 채워 넣는다;
`DummyDrawDataAdapter`는 코드로는 남아 있지만(테스트/시드 용도) 앱 컨테이너 기본값에서는 빠졌다.
픽은 `PickRepositoryPort` 뒤의 `InMemoryPickRepository`(서버 프로세스 메모리, 실제 DB 아님)로
저장된다 — 이후 Supabase로 교체해도 어댑터만 바뀌고 유스케이스/DTO/FE는 무수정이다. 인증은 아직
없음(게스트 전용); Supabase Auth + 로그인 게이팅은 v1 문서 기준 후속 단계다.

## TDD

도메인 계산과 유스케이스는 테스트 우선(Red → Green → Refactor)으로 작성한다 — `core/domain`
함수들을 순수 함수로 유지하는 이유가 바로 이것이다. 도메인 규칙이나 유스케이스를 추가할 때는
구현 전에 대상 파일 옆에 `*.test.ts`를 먼저 작성한다 (`packages/core/src/**`와
`apps/web/src/modules/**/viewmodel/*.test.ts` 아래 기존 `*.test.ts` 파일들 참고).

## git 분기 전략 — vault 공통 정책을 따른다

브랜치 생성 · 워크트리 생성/제거 · 병합 · push · 브랜치 삭제 전에 vault의 `git-strategy` 스킬을
먼저 호출한다. 정본은 vault의 `Resource/자동화/git 분기 전략/📋 작업 규격.md`이고, 실행 절차와
**이 저장소의 예외**는 vault의 `.claude/skills/git-strategy/SKILL.md` §7에 있다.

요지 — `main` ← `dev`는 PR로만 / `dev` ← `implement`는 `--no-ff` 후 `implement`로 복귀 / 작업은
`implement/{주제}` 워크트리에서 하고 끝나면 폴더·로컬·원격 브랜치를 모두 지운다 / 모든 브랜치는
원격 추적 브랜치를 가진다.

**이 저장소의 예외:** `dev`가 로컬에만 있다(원격 추적 없음). 작업 전에
`git push -u origin dev`로 먼저 연결한다 — 지금 상태에서는 손상이 나면 복구 사본이 없다.

## Known quirks

- **OneDrive + git worktree 손상 (사고 3건 → 2026-08-26 잔재 정리 완료).** 이 저장소는 OneDrive
  동기화 vault 안에 있어 vault 루트가 문서화한 손상 패턴을 겪었다. `.worktrees/`의 고아 폴더
  2건(`implement.orphaned-20260730`, `-20260801`)과 관리 폴더 1건(`.git/worktrees/implement1`)이
  실제 흔적이었다. **셋 다 2026-08-26에 제거했고 지금은 워크트리 잔재가 없다.**
  **위험 자체는 그대로이므로 완화책은 유효하다** — 브랜치/워크트리 작업은 raw
  `git worktree add` 대신 Orca 네이티브 생성(`EnterWorktree` 또는 `orca worktree create`)을 쓴다.
- **`implement1`이 내던 커밋 오류는 사라졌다.** 커밋할 때마다 붙던
  `error: failed to delete '.git/worktrees/implement1': Permission denied`가 그것이다(커밋 자체는
  늘 성공했으므로 실패로 오인하지 않는다). **`git worktree prune`으로는 끝까지 안 지워졌고,
  OneDrive 동기화를 일시중지한 뒤 직접 `rm -rf`로 지워야 했다.** 같은 증상을 다시 만나면 이
  순서를 쓴다 — prune 반복은 소용없다.
- **`mmap failed: Invalid argument`.** `git checkout`/`git fsck` 등이 이 오류로 실패하면, OneDrive
  cloud-only 플레이스홀더(`.git/objects/pack/*`, `.git/index` 등)가 완전히 하이드레이션되지 않은
  것일 수 있다(파일 크기는 정상으로 보여도 Windows 파일 속성이 `ReparsePoint`). "cloud file provider
  is not running" 같은 명시적 메시지가 없어도 같은 원인일 수 있다 — 실제 손상으로 단정하기 전에
  해당 파일을 PowerShell `[System.IO.File]::ReadAllBytes($path)`로 강제 전체 읽기해 하이드레이션시킨
  뒤 재시도한다.
- **Remote 추적 상태(2026-08-26).** `main`·`dev`·`implement` 셋 다 `origin`을 추적한다. `dev`는
  이날 처음 push했다(그전까지 로컬 전용이라 손상 시 복구 사본이 없었다). **로컬 `main`이
  `origin/main`보다 5커밋 앞서 있고 아직 push하지 않았다** — 전략 도입 이전에 `main`에 직접
  커밋한 흔적이다. PR #2의 base는 `origin/main`이므로 이 5커밋을 포함하지 않는다.
- **판정 5 이탈을 2026-08-26에 교정했다.** `dev`가 `implement`의 조상이 되어 있었다.
  `dev` ← `implement`를 `--no-ff`로 병합해(`6c0978f`) 끊었고 `implement`는 그 앞(`a995a5a`)에 남겼다.
- **크로스 머신 워크트리 정리 시 주의.** `git worktree list`가 "prunable"로 표시하는 항목이 이
  머신에서 죽은 로컬 경로인지, 다른 머신(예: Mac Orca 워크스페이스)에서 여전히 쓰이는 항목인지
  먼저 확인한다 — 이 저장소의 `.git`이 OneDrive로 동기화되므로, `git worktree prune`은 다른 머신이
  보는 등록 정보도 함께 지운다.
