# 라이트 테마 전환 + `.claude/context/` SSOT 도입 설계

## 배경

현재 UI는 다크 테마 전용(`color-scheme: dark`, slate-950 배경)이다. 이를 화이트(라이트) 단일 테마로
교체하고, 그 과정에서 확정한 컬러 토큰을 프로젝트 SSOT 문서로 남겨 이후 어떤 작업(디자인 관련이든
아니든)을 시작하기 전에도 항상 참고되도록 한다. 이 패턴은 vault 최상위 `CLAUDE.md`가 이미 사용하는
`.claude/context/` SSOT 개념을 이 저장소(FortunaLottery) 스코프로 그대로 적용한 것이다.

`frontend-design` 플러그인 스킬의 전역 캐시 폴더(`~/.claude/plugins/cache/...`)에 프로젝트 전용 문서를
두는 방식은 채택하지 않는다 — 그 폴더는 모든 프로젝트가 공유하고, 스킬 자체가 그 폴더의 임의 문서를
읽어들이는 로직이 없으며, 플러그인 업데이트 시 통째로 갈아엎어질 수 있다(과거 Obsidian MCP 설정이
플러그인 업데이트로 리셋된 것과 동일한 패턴). 대신 프로젝트 저장소 안에 문서를 두고 이 저장소의
`CLAUDE.md`가 세션 시작 시 항상 로드되는 성질을 이용한다.

## 범위

1. `.claude/context/design-system.md` 신설 — 컬러 토큰 표 + 적용 규칙을 문서화
2. 프로젝트 `CLAUDE.md`에 `.claude/context/` SSOT 안내 섹션 추가
3. 다크 → 라이트 컬러 치환 (전체 파일 목록은 아래 "적용 파일" 참고)
4. 로또 공 색상(`shared/lib/lotto-colors.ts`)은 변경하지 않는다 — hex로 고정된 도메인 규칙(설계 문서
   명시: "공 색은 바꾸지 않는다")

다크 모드 토글은 만들지 않는다 — 라이트 단일 테마로 완전히 교체한다(사용자 결정).

## 컬러 토큰 매핑

시맨틱 이름으로 문서화하고, 각 컴포넌트는 시맨틱 의미에 맞는 실제 Tailwind 클래스로 치환한다.

| 시맨틱 토큰 | 다크(기존) | 라이트(신규) | 용도 |
|---|---|---|---|
| `background` | `slate-950` | `white` | 페이지 배경 |
| `surface` | `slate-900` | `white` + `border-slate-200` | 카드/패널 배경 |
| `surface-border` | `slate-800` / `slate-700` | `slate-200` / `slate-300` | 카드·구분선 테두리 |
| `surface-muted` | `slate-800` (비활성 칩/버튼 배경) | `slate-100` | 토글 미선택 상태, 값 없는 진행 바 트랙 |
| `text-primary` | `slate-100` | `slate-900` | 제목, 본문 강조 |
| `text-secondary` | `slate-300` | `slate-700` | 본문 보조 |
| `text-muted` | `slate-400` / `slate-500` | `slate-500` | 캡션, 라벨 |
| `accent-info` | `sky-500` / `sky-600` | `sky-600` | 정보성 강조(예: 다음 추첨 카운트다운) |
| `accent-success` | `emerald-400` / `500` / `600` | `emerald-600` | 긍정 신호(예: 당첨 일치) |
| `accent-warning` | `amber-300` / `400` / `500` | 텍스트 `amber-600`, 배경 칩 `amber-50` + `border-amber-200` | 희귀도 배지, 정직성 각주 강조 |
| `accent-special` | `violet-500` / `600` | `violet-600` | 특수 강조(생성기 등) |
| `accent-danger` | `red-400` | `red-600` | 에러/불일치 강조 |
| `accent-ring` | `white` (`ring-white`) | `slate-900` (`ring-slate-900`) | `Ball`의 일치 번호 강조 링 — 밝은 배경에서 대비를 내려면 반전 필요 |
| 로또 공 색상 | 변경 없음 (hex 고정) | 변경 없음 | `ballColor()` — 도메인 규칙, 손대지 않음 |

버튼처럼 배경·글자색을 함께 지정해 그 자체로 대비가 완결되는 요소(예: `bg-emerald-600 text-white`,
`bg-sky-600 text-white`)는 페이지 배경이 바뀌어도 그대로 둔다 — 치환 대상은 페이지/카드 배경에
기대어 대비를 얻던 클래스(텍스트 단독 색상, 테두리, 미선택 상태 배경)로 한정한다.

## 적용 파일

- `apps/web/src/app/globals.css` — `color-scheme: light`로 변경, body 배경/텍스트 기본값 교체
- `apps/web/src/shared/ui/card.tsx` — surface/border 토큰 적용
- `apps/web/src/shared/ui/ball.tsx` — 일치 번호 강조 링(`ring-white` → `ring-slate-900`)
- `apps/web/src/app/page.tsx`
- `apps/web/src/modules/countdown/view/countdown-card.tsx`
- `apps/web/src/modules/draw/view/latest-draw-card.tsx`
- `apps/web/src/modules/generator/view/generator-card.tsx`
- `apps/web/src/modules/identity/view/identity-badge.tsx`
- `apps/web/src/modules/picks/view/picks-card.tsx`
- `apps/web/src/modules/results/view/results-card.tsx`
- `apps/web/src/modules/simulation/view/simulation-card.tsx`
- `apps/web/src/modules/statistics/view/statistics-panel.tsx`
- `apps/web/src/modules/statistics/view/frequency-heatmap.tsx`
- `apps/web/src/modules/statistics/view/hot-cold-board.tsx`
- `apps/web/src/modules/statistics/view/number-frequency-bars.tsx`
- `apps/web/src/modules/statistics/view/pattern-distribution.tsx`
- `apps/web/src/modules/statistics/view/probability-reality.tsx`
- `apps/web/src/modules/statistics/view/recent-grid.tsx` — 미출현 칸 hex(`#1e293b` → `#e2e8f0`)
- `apps/web/src/modules/statistics/view/top-pairs-list.tsx`

이 파일들은 모두 `*View`/`*Card` 컴포넌트로, 색상 클래스 치환만 필요하며 로직 변경은 없다.

`apps/web/src/modules/statistics/view/sum-distribution-chart.tsx`는 검토했으나 변경하지 않는다 — SVG
막대/마커 색상(`#38bdf8`, `#f59e0b`, `#64748b`)이 흰 배경에서도 이미 충분한 대비를 가지며, 카드 배경에
기대어 대비를 얻는 방식이 아니기 때문이다.

## `.claude/context/` SSOT 도입

`design-system.md`는 위 컬러 토큰 표를 그대로 담되, "최종 결론만" 원칙에 따라 탐색 과정이나 이전
다크 테마 값은 남기지 않는다(다크 값은 이 설계 문서와 git 히스토리에만 남는다).

`CLAUDE.md`에 다음 섹션을 추가한다(vault 최상위 문서의 문구를 이 저장소 스코프로 축약):

> ## 작업 전 필수 참고 — `.claude/context/` (SSOT)
>
> `.claude/context/`는 이 저장소에서 작업을 시작하기 전에 알아야 하거나 참고하면 도움이 되는 문서를
> 모아두는 SSOT 폴더다. 코드/디자인/설정 변경 등 어떤 작업이든 시작하기 전에 이 폴더의 문서 목록을
> 먼저 확인하고, 관련 내용이 있으면 그것을 우선 근거로 삼는다.
>
> - 문서는 조사/의사결정의 최종 결론과 현재 상태만 담는다 — 탐색 과정, 중간 시행착오, 폐기된 대안은
>   기록하지 않는다.
> - 실제 코드/설정 상태와 문서 내용이 어긋난 것을 발견하면, 작업을 계속하기 전에 문서를 최신 상태로
>   갱신한다.

이후 다른 SSOT 문서(도메인 규칙, API 계약 등)가 필요해지면 같은 폴더에 추가한다 — 이번 범위는
`design-system.md` 하나만 만든다.

## 테스트/검증

- 색상 클래스 치환은 로직에 영향을 주지 않으므로 기존 vitest 스위트(`pnpm test`)가 그대로 통과해야
  한다.
- `pnpm --filter web lint`로 import 경계/타입 오류 없는지 확인.
- dev 서버(`pnpm dev`)를 띄워 브라우저로 홈, 통계, 시뮬레이션 화면을 확인 — 대비(contrast)가
  충분한지, 로또 공 색상이 흰 배경에서도 잘 보이는지 육안 확인.

## 제외 범위

- 다크 모드 토글/다크 모드 재도입은 하지 않는다.
- 로또 공 색상 규칙 변경은 하지 않는다.
- 타이포그래피, 레이아웃, 컴포넌트 구조 변경은 이번 범위에 포함하지 않는다 — 색상 토큰 교체와 SSOT
  문서화만 다룬다.
