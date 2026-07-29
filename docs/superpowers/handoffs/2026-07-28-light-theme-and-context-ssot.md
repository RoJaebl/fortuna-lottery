# 라이트 테마 전환 + `.claude/context/` SSOT 도입 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 다크 전용 UI를 라이트(화이트) 단일 테마로 교체하고, 그 과정에서 확정한 컬러 토큰을
`.claude/context/design-system.md`에 SSOT로 남겨 이후 모든 작업에서 항상 참고되게 한다.

**Architecture:** 순수 스타일링 교체 — `packages/core`나 뷰모델 로직은 건드리지 않는다. 컬러는
Tailwind 유틸리티 클래스(대부분) + 두 곳의 하드코딩된 hex(`ball.tsx`의 인라인 `boxShadow`는 무관,
`recent-grid.tsx`의 빈 칸 hex는 대상)로 이루어져 있다. 설계 문서
(`docs/superpowers/specs/2026-07-28-light-theme-and-context-ssot-design.md`)에서 확정한 시맨틱 토큰
표를 그대로 따른다.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4 (`@import "tailwindcss"` — CSS 변수 기반),
React, vitest, eslint.

## Global Constraints

- 로또 공 색상(`shared/lib/lotto-colors.ts`의 `ballColor()`)은 절대 변경하지 않는다 — hex로 고정된
  도메인 규칙.
- 다크 모드 토글은 만들지 않는다 — 라이트 단일 테마로 완전히 교체한다.
- 타이포그래피, 레이아웃, 컴포넌트 구조 변경은 이번 범위에 포함하지 않는다 — 색상 클래스 치환과
  SSOT 문서화만 다룬다.
- 배경·글자색이 그 자체로 대비가 완결되는 버튼(예: `bg-emerald-600 ... text-white`,
  `bg-sky-600 ... text-white`, `bg-violet-600 ... text-white`, `bg-slate-700 ... hover:bg-slate-600
  text-white`)은 페이지 배경이 바뀌어도 그대로 둔다 — 손대지 않는다.
- 모든 변경은 기존 vitest 스위트를 깨서는 안 된다(`pnpm test` 통과 유지). 색상 클래스는 로직에
  영향을 주지 않으므로 실패하는 테스트가 생기면 그 자체가 버그 신호다.
- 커밋 메시지에 gitmoji 접두사를 쓰지 않는다 — 이 세션에서 그 규칙(`gitmoji-commit` 스킬)을
  제거했다. 일반 conventional-commit 스타일(`style:`, `docs:`, `chore:`)로 작성한다.
- 컬러 토큰의 유일한 출처는 `.claude/context/design-system.md`다 — 이 문서에 없는 색상 값을
  임의로 새로 만들지 않는다.

---

### Task 1: `.claude/context/design-system.md` 작성

**Files:**
- Create: `.claude/context/design-system.md`

**Interfaces:**
- Consumes: 없음 — `docs/superpowers/specs/2026-07-28-light-theme-and-context-ssot-design.md`의
  컬러 토큰 표를 그대로 옮긴다.
- Produces: 이후 모든 Task가 참고하는 시맨틱 토큰 표. Task 3~12는 이 문서의 값을 그대로 사용한다.

- [ ] **Step 1: 문서 작성**

```markdown
# 디자인 시스템 — 컬러 토큰 (라이트 테마)

이 저장소(FortunaLottery)의 유일한 컬러 토큰 SSOT. 코드에서 색상 관련 작업(신규 컴포넌트,
기존 컴포넌트 수정)을 하기 전에 이 표를 먼저 확인하고, 여기 없는 색상 값을 임의로 새로 만들지
않는다.

## 시맨틱 토큰

| 시맨틱 토큰 | Tailwind 클래스 | 용도 |
|---|---|---|
| `background` | `bg-white` | 페이지 배경 |
| `surface` | `bg-white border border-slate-200 shadow-sm` | 카드/패널 배경 (`shared/ui/card.tsx`) |
| `surface-border` | `border-slate-200` / `border-slate-300` | 카드·구분선 테두리 |
| `surface-muted` | `bg-slate-100` | 토글 미선택 상태, 값 없는 진행 바 트랙 |
| `text-primary` | `text-slate-900` | 제목, 본문 강조 |
| `text-secondary` | `text-slate-700` | 본문 보조 |
| `text-muted` | `text-slate-500` | 캡션, 라벨, 보조 설명 |
| `accent-info` | `sky-600` | 정보성 강조 (다음 추첨 카운트다운 등) |
| `accent-success` | `emerald-600` | 긍정 신호 (당첨 일치 등) |
| `accent-warning` (텍스트) | `text-amber-600` | 희귀도 배지, 정직성 각주 강조 |
| `accent-warning` (배경 칩) | `bg-amber-50 border border-amber-200` | 희귀 패턴 강조 칩 |
| `accent-special` | `violet-600` | 특수 강조 (생성기 등) |
| `accent-danger` | `text-red-600` | 에러/불일치 강조 |
| `accent-ring` | `ring-slate-900` | `Ball`의 일치 번호 강조 링 |
| 로또 공 색상 | 변경 없음 (hex 고정) | `ballColor()` — 도메인 규칙, 절대 손대지 않음 |

## 원칙

- 배경·글자색을 함께 지정해 그 자체로 대비가 완결되는 버튼(예: `bg-emerald-600 text-white`)은
  페이지/카드 배경과 무관하게 항상 그대로 둔다 — 토큰 치환 대상이 아니다.
- 다크 모드는 없다 — 라이트 단일 테마다. 다크 모드 토글이나 `dark:` variant를 추가하지 않는다.
- 로또 공 색상은 실제 로또 공 색(노랑·파랑·빨강·회색·초록) 규칙이며 어떤 이유로도 바꾸지 않는다.
```

- [ ] **Step 2: 커밋**

```bash
git add .claude/context/design-system.md
git commit -m "$(cat <<'EOF'
docs: 라이트 테마 컬러 토큰 SSOT 문서 추가

색상 관련 작업 전에 항상 먼저 참고할 단일 출처가 없었다. .claude/context/를
이 저장소의 SSOT 폴더로 도입하는 첫 문서로 컬러 토큰 표를 남긴다.
EOF
)"
```

---

### Task 2: `CLAUDE.md`에 `.claude/context/` SSOT 안내 추가

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: Task 1에서 만든 `.claude/context/design-system.md`의 존재.
- Produces: 없음 (문서 안내 텍스트).

- [ ] **Step 1: `CLAUDE.md`의 "## 명령어" 섹션 바로 앞에 SSOT 안내 섹션 삽입**

`CLAUDE.md`에서 다음을 찾는다:

```markdown
## 명령어
```

그 바로 앞에 삽입한다:

```markdown
## 작업 전 필수 참고 — `.claude/context/` (SSOT)

`.claude/context/`는 이 저장소에서 작업을 시작하기 전에 알아야 하거나 참고하면 도움이 되는 문서를
모아두는 SSOT(Single Source of Truth) 폴더다. 코드/디자인/설정 변경 등 어떤 작업이든 시작하기 전에
이 폴더의 문서 목록을 먼저 확인하고, 관련 내용이 있으면 그것을 우선 근거로 삼는다.

- 문서는 조사/의사결정의 최종 결론과 현재 상태만 담는다 — 탐색 과정, 중간 시행착오, 폐기된 대안은
  기록하지 않는다.
- 실제 코드/설정 상태와 문서 내용이 어긋난 것을 발견하면, 작업을 계속하기 전에 문서를 최신 상태로
  갱신한다.

현재 문서: `design-system.md` (컬러 토큰).

## 명령어
```

- [ ] **Step 2: 커밋**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: CLAUDE.md에 .claude/context/ SSOT 안내 추가

design-system.md를 포함해 이후 추가될 SSOT 문서들을 작업 시작 전에 항상
확인하도록 안내한다.
EOF
)"
```

---

### Task 3: `globals.css` 라이트 테마 베이스

**Files:**
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes: Task 1의 `background`/`text-primary` 토큰(`white` / `slate-900`).
- Produces: 페이지 기본 배경·텍스트 색 — 이후 모든 뷰 컴포넌트가 이 위에 렌더링된다.

- [ ] **Step 1: 다크 선언을 라이트로 교체**

`apps/web/src/app/globals.css` 전체를 다음으로 교체:

```css
@import "tailwindcss";

:root {
  color-scheme: light;
}

body {
  background-color: #ffffff;
  color: var(--color-slate-900);
}
```

- [ ] **Step 2: lint 확인**

Run: `pnpm --filter web lint`
Expected: 에러 없음 (CSS 파일은 eslint 대상이 아니므로 기존과 동일하게 통과해야 함).

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/app/globals.css
git commit -m "$(cat <<'EOF'
style: 페이지 기본 테마를 다크에서 라이트로 전환

color-scheme과 body 배경/텍스트 기본값을 라이트 테마로 교체한다. 이후
컴포넌트별 색상 치환의 기반이 된다.
EOF
)"
```

---

### Task 4: 공유 UI 프리미티브 (`card.tsx`, `ball.tsx`)

**Files:**
- Modify: `apps/web/src/shared/ui/card.tsx`
- Modify: `apps/web/src/shared/ui/ball.tsx`

**Interfaces:**
- Consumes: Task 1의 `surface`, `surface-border`, `text-primary`, `text-muted`, `accent-warning`,
  `accent-ring` 토큰. Task 3에서 라이트 배경이 적용된 상태를 전제로 시각 확인한다.
- Produces: `Card`, `Ball` — 이후 모든 뷰 컴포넌트가 이 두 컴포넌트를 통해 카드 배경/공 강조 링을
  얻는다. 이 Task가 끝나야 다른 컴포넌트의 시각 검증이 의미가 있다.

- [ ] **Step 1: `card.tsx`의 배경/테두리/텍스트 색 치환**

`apps/web/src/shared/ui/card.tsx`에서:

```tsx
    <section className={`rounded-xl border border-slate-800 bg-slate-900 p-5 ${className}`}>
      <header className="mb-4">
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
      </header>
      {children}
      {footnote ? (
        <p className="mt-4 border-t border-slate-800 pt-2 text-[11px] leading-relaxed text-amber-500/90">
          ⚠ {footnote}
        </p>
      ) : null}
    </section>
```

를 다음으로 교체:

```tsx
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <header className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
      </header>
      {children}
      {footnote ? (
        <p className="mt-4 border-t border-slate-200 pt-2 text-[11px] leading-relaxed text-amber-600/90">
          ⚠ {footnote}
        </p>
      ) : null}
    </section>
```

- [ ] **Step 2: `ball.tsx`의 일치 강조 링 색 반전**

`apps/web/src/shared/ui/ball.tsx`에서:

```tsx
      className={`inline-flex items-center justify-center rounded-full font-bold tabular-nums select-none ${SIZES[size]} ${dimmed ? "opacity-30" : ""} ${ring ? "ring-2 ring-white" : ""}`}
```

를 다음으로 교체:

```tsx
      className={`inline-flex items-center justify-center rounded-full font-bold tabular-nums select-none ${SIZES[size]} ${dimmed ? "opacity-30" : ""} ${ring ? "ring-2 ring-slate-900" : ""}`}
```

(흰 배경의 카드 위에서 `ring-white`는 보이지 않으므로 `ring-slate-900`으로 반전한다.)

- [ ] **Step 3: lint + 테스트 확인**

Run: `pnpm --filter web lint && pnpm --filter web test`
Expected: 둘 다 통과 (기존 테스트가 클래스명을 assert하지 않으므로 회귀 없음).

- [ ] **Step 4: 커밋**

```bash
git add apps/web/src/shared/ui/card.tsx apps/web/src/shared/ui/ball.tsx
git commit -m "$(cat <<'EOF'
style: 공유 Card/Ball 컴포넌트를 라이트 테마로 전환

카드 배경/테두리/텍스트를 라이트 토큰으로 바꾸고, 흰 배경에서 보이지
않던 Ball의 일치 강조 링(ring-white)을 ring-slate-900으로 반전한다.
EOF
)"
```

---

### Task 5: 앱 셸 (`page.tsx`, `identity-badge.tsx`)

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/modules/identity/view/identity-badge.tsx`

**Interfaces:**
- Consumes: Task 4의 `Card`/`Ball` (간접, 이 Task는 직접 사용하지 않지만 같은 페이지에 렌더링됨).
- Produces: 없음 — 리프 레벨 뷰.

- [ ] **Step 1: `page.tsx`의 강조 텍스트 색 치환**

`apps/web/src/app/page.tsx`에서:

```tsx
            로또랩 <span className="text-emerald-400">Lotto Lab</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
```

를 다음으로 교체:

```tsx
            로또랩 <span className="text-emerald-600">Lotto Lab</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
```

(`<h1>`은 명시적 텍스트 색이 없어 `body`의 `text-slate-900`을 그대로 상속하므로 별도 수정이
필요 없다.)

- [ ] **Step 2: `identity-badge.tsx`의 배지 색 치환**

`apps/web/src/modules/identity/view/identity-badge.tsx`에서:

```tsx
    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
```

를 다음으로 교체:

```tsx
    <span className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-500">
```

- [ ] **Step 3: lint + 테스트 확인**

Run: `pnpm --filter web lint && pnpm --filter web test`
Expected: 둘 다 통과.

- [ ] **Step 4: 커밋**

```bash
git add apps/web/src/app/page.tsx apps/web/src/modules/identity/view/identity-badge.tsx
git commit -m "$(cat <<'EOF'
style: 앱 셸(헤더/신원 배지)을 라이트 테마로 전환
EOF
)"
```

---

### Task 6: `countdown-card.tsx`

**Files:**
- Modify: `apps/web/src/modules/countdown/view/countdown-card.tsx`

**Interfaces:**
- Consumes: Task 4의 `Card`.
- Produces: 없음.

- [ ] **Step 1: 카운트다운 강조 텍스트 색 치환**

```tsx
      <p className="text-3xl font-bold tabular-nums tracking-tight text-emerald-400">
```

를:

```tsx
      <p className="text-3xl font-bold tabular-nums tracking-tight text-emerald-600">
```

- [ ] **Step 2: lint + 테스트 확인**

Run: `pnpm --filter web lint && pnpm --filter web test`
Expected: 둘 다 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/modules/countdown/view/countdown-card.tsx
git commit -m "$(cat <<'EOF'
style: 카운트다운 카드를 라이트 테마로 전환
EOF
)"
```

---

### Task 7: `latest-draw-card.tsx`

**Files:**
- Modify: `apps/web/src/modules/draw/view/latest-draw-card.tsx`

**Interfaces:**
- Consumes: Task 4의 `Card`, `Ball`.
- Produces: 없음.

- [ ] **Step 1: 에러 텍스트 색 치환**

```tsx
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
```

를:

```tsx
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
```

(`text-slate-500` 두 곳 — "+" 구분자, "불러오는 중…" — 은 이미 목표 토큰(`text-muted` =
`slate-500`)과 같으므로 변경하지 않는다.)

- [ ] **Step 2: lint + 테스트 확인**

Run: `pnpm --filter web lint && pnpm --filter web test`
Expected: 둘 다 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/modules/draw/view/latest-draw-card.tsx
git commit -m "$(cat <<'EOF'
style: 최근 회차 카드 에러 텍스트를 라이트 테마로 전환
EOF
)"
```

---

### Task 8: `generator-card.tsx`

**Files:**
- Modify: `apps/web/src/modules/generator/view/generator-card.tsx`

**Interfaces:**
- Consumes: Task 4의 `Card`, `Ball`.
- Produces: 없음.

- [ ] **Step 1: 모드 토글 버튼의 미선택 상태 색 치환**

```tsx
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              vm.mode === key
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
```

를:

```tsx
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              vm.mode === key
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
```

- [ ] **Step 2: 번호 선택 버튼의 미선택 상태 색 치환**

```tsx
              className={`rounded-md py-1 text-xs font-semibold tabular-nums transition-colors ${
                vm.selected.includes(n)
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
```

를:

```tsx
              className={`rounded-md py-1 text-xs font-semibold tabular-nums transition-colors ${
                vm.selected.includes(n)
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
```

- [ ] **Step 3: 에러 텍스트 색 치환**

```tsx
      {vm.error ? <p className="mt-3 text-sm text-red-400">{vm.error}</p> : null}
```

를:

```tsx
      {vm.error ? <p className="mt-3 text-sm text-red-600">{vm.error}</p> : null}
```

- [ ] **Step 4: lint + 테스트 확인**

Run: `pnpm --filter web lint && pnpm --filter web test`
Expected: 둘 다 통과.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/modules/generator/view/generator-card.tsx
git commit -m "$(cat <<'EOF'
style: 번호 생성기 카드를 라이트 테마로 전환

토글/번호 선택 버튼의 미선택 상태 배경을 다크 대비용 slate-800에서
라이트 대비용 slate-100으로 바꾼다.
EOF
)"
```

---

### Task 9: `picks-card.tsx`

**Files:**
- Modify: `apps/web/src/modules/picks/view/picks-card.tsx`

**Interfaces:**
- Consumes: Task 4의 `Card`, `Ball`.
- Produces: 없음.

- [ ] **Step 1: 에러 텍스트 색 치환**

```tsx
      {vm.error ? <p className="mb-3 text-sm text-red-400">{vm.error}</p> : null}
```

를:

```tsx
      {vm.error ? <p className="mb-3 text-sm text-red-600">{vm.error}</p> : null}
```

- [ ] **Step 2: 삭제 버튼 hover 색 치환**

```tsx
                  className="rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
```

를:

```tsx
                  className="rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
```

(빈 상태 문구 `text-slate-500`, 저장 시각 `text-slate-500`은 이미 목표 토큰과 같아 변경하지
않는다.)

- [ ] **Step 3: lint + 테스트 확인**

Run: `pnpm --filter web lint && pnpm --filter web test`
Expected: 둘 다 통과.

- [ ] **Step 4: 커밋**

```bash
git add apps/web/src/modules/picks/view/picks-card.tsx
git commit -m "$(cat <<'EOF'
style: 내 번호 카드를 라이트 테마로 전환
EOF
)"
```

---

### Task 10: `results-card.tsx`

**Files:**
- Modify: `apps/web/src/modules/results/view/results-card.tsx`

**Interfaces:**
- Consumes: Task 4의 `Card`, `Ball`.
- Produces: 없음.

- [ ] **Step 1: 에러 텍스트 색 치환**

```tsx
      {vm.error ? <p className="mt-3 text-sm text-red-400">{vm.error}</p> : null}
```

를:

```tsx
      {vm.error ? <p className="mt-3 text-sm text-red-600">{vm.error}</p> : null}
```

- [ ] **Step 2: 당첨 번호 행 테두리/라벨 색 치환**

```tsx
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3">
                <span className="mr-1 text-xs text-slate-400">당첨</span>
```

를:

```tsx
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3">
                <span className="mr-1 text-xs text-slate-500">당첨</span>
```

- [ ] **Step 3: 등수 라벨 색 치환**

```tsx
                    className={`shrink-0 text-xs font-semibold ${
                      item.rank >= 1 ? "text-amber-300" : "text-slate-500"
                    }`}
```

를:

```tsx
                    className={`shrink-0 text-xs font-semibold ${
                      item.rank >= 1 ? "text-amber-600" : "text-slate-500"
                    }`}
```

(대조 버튼 `bg-slate-700 ... hover:bg-slate-600 text-white`는 자체 완결 버튼이라 그대로 둔다.)

- [ ] **Step 4: lint + 테스트 확인**

Run: `pnpm --filter web lint && pnpm --filter web test`
Expected: 둘 다 통과.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/modules/results/view/results-card.tsx
git commit -m "$(cat <<'EOF'
style: 결과 확인 카드를 라이트 테마로 전환
EOF
)"
```

---

### Task 11: `simulation-card.tsx`

**Files:**
- Modify: `apps/web/src/modules/simulation/view/simulation-card.tsx`

**Interfaces:**
- Consumes: Task 4의 `Card`.
- Produces: 없음.

- [ ] **Step 1: 에러 텍스트 색 치환**

```tsx
      {vm.error ? <p className="mt-3 text-sm text-red-400">{vm.error}</p> : null}
```

를:

```tsx
      {vm.error ? <p className="mt-3 text-sm text-red-600">{vm.error}</p> : null}
```

- [ ] **Step 2: 요약 문구 색 치환**

```tsx
          <p className="text-sm text-slate-300">{vm.summaryLine(vm.result)}</p>
```

를:

```tsx
          <p className="text-sm text-slate-700">{vm.summaryLine(vm.result)}</p>
```

- [ ] **Step 3: 등수 요약 칩 색 치환**

```tsx
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    rank <= 2 ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-200"
                  }`}
```

를:

```tsx
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    rank <= 2
                      ? "border border-amber-200 bg-amber-50 text-amber-600"
                      : "bg-slate-100 text-slate-700"
                  }`}
```

(대입 버튼 `bg-violet-600 ... hover:bg-violet-500 text-white`는 자체 완결 버튼이라 그대로 둔다.)

- [ ] **Step 4: lint + 테스트 확인**

Run: `pnpm --filter web lint && pnpm --filter web test`
Expected: 둘 다 통과.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/modules/simulation/view/simulation-card.tsx
git commit -m "$(cat <<'EOF'
style: 타임머신 시뮬레이션 카드를 라이트 테마로 전환
EOF
)"
```

---

### Task 12: 통계 모듈 전체 (`modules/statistics/view/*`)

**Files:**
- Modify: `apps/web/src/modules/statistics/view/statistics-panel.tsx`
- Modify: `apps/web/src/modules/statistics/view/hot-cold-board.tsx`
- Modify: `apps/web/src/modules/statistics/view/pattern-distribution.tsx`
- Modify: `apps/web/src/modules/statistics/view/probability-reality.tsx`
- Modify: `apps/web/src/modules/statistics/view/recent-grid.tsx`
- Modify: `apps/web/src/modules/statistics/view/top-pairs-list.tsx`
- No change (검증만): `apps/web/src/modules/statistics/view/frequency-heatmap.tsx`,
  `apps/web/src/modules/statistics/view/number-frequency-bars.tsx`,
  `apps/web/src/modules/statistics/view/sum-distribution-chart.tsx`

**Interfaces:**
- Consumes: Task 4의 `Card`, `Ball`; `shared/lib/lotto-colors.ts`의 `ballColor()`(변경 없음, 그대로
  사용).
- Produces: 없음 — 통계 패널의 리프 컴포넌트들.

이 그룹의 8개 뷰 파일은 모두 "통계 패널" 하나로 묶여 리뷰되고, 치환 규칙이 동일(단순 색상 클래스
교체)해 한 Task로 묶는다. `frequency-heatmap.tsx`와 `number-frequency-bars.tsx`는 이미 목표
토큰(`text-slate-500`)과 같은 클래스만 쓰고 있어 **수정하지 않는다** — 육안 확인만 한다.
`sum-distribution-chart.tsx`도 설계 문서에서 검토 후 변경 불필요로 결론 낸 파일이라 손대지 않는다.

- [ ] **Step 1: `statistics-panel.tsx`의 에러 텍스트 색 치환**

```tsx
  if (error) return <p className="text-sm text-red-400">통계를 불러오지 못했습니다: {error}</p>;
```

를:

```tsx
  if (error) return <p className="text-sm text-red-600">통계를 불러오지 못했습니다: {error}</p>;
```

(로딩 문구 `text-slate-500`은 이미 목표 토큰과 같아 변경하지 않는다.)

- [ ] **Step 2: `hot-cold-board.tsx`의 섹션 라벨 색 치환 (2곳)**

```tsx
          <p className="mb-2 text-xs font-medium text-slate-400">오래 안 나온 번호 TOP 8</p>
```

를:

```tsx
          <p className="mb-2 text-xs font-medium text-slate-500">오래 안 나온 번호 TOP 8</p>
```

그리고:

```tsx
          <p className="mb-2 text-xs font-medium text-slate-400">최근 나온 번호 TOP 8</p>
```

를:

```tsx
          <p className="mb-2 text-xs font-medium text-slate-500">최근 나온 번호 TOP 8</p>
```

- [ ] **Step 3: `pattern-distribution.tsx`의 막대·라벨 색 치환**

```tsx
            className={`w-full rounded-t ${i === highlight ? "bg-amber-400" : "bg-sky-600/70"}`}
            style={{ height: `${6 + (count / max) * 56}px` }}
          />
          <span className={`text-[10px] ${i === highlight ? "font-bold text-amber-300" : "text-slate-500"}`}>
```

를:

```tsx
            className={`w-full rounded-t ${i === highlight ? "bg-amber-600" : "bg-sky-600/70"}`}
            style={{ height: `${6 + (count / max) * 56}px` }}
          />
          <span className={`text-[10px] ${i === highlight ? "font-bold text-amber-600" : "text-slate-500"}`}>
```

그리고 섹션 라벨 3곳(`text-slate-400` → `text-slate-500`):

```tsx
          <p className="mb-2 text-xs font-medium text-slate-400">홀수 개수 (0~6)</p>
```
→
```tsx
          <p className="mb-2 text-xs font-medium text-slate-500">홀수 개수 (0~6)</p>
```

```tsx
          <p className="mb-2 text-xs font-medium text-slate-400">저구간(1~22) 개수 (0~6)</p>
```
→
```tsx
          <p className="mb-2 text-xs font-medium text-slate-500">저구간(1~22) 개수 (0~6)</p>
```

```tsx
          <p className="mb-2 text-xs font-medium text-slate-400">구간별 총 출현</p>
```
→
```tsx
          <p className="mb-2 text-xs font-medium text-slate-500">구간별 총 출현</p>
```

- [ ] **Step 4: `probability-reality.tsx`의 확률 숫자·설명 색 치환**

```tsx
      <p className="mb-3 text-3xl font-bold tracking-tight text-slate-100">
        1 <span className="text-slate-500">/</span> {stats.totalCombinations.toLocaleString()}
      </p>
      <ul className="space-y-1.5">
        {facts.map((fact) => (
          <li key={fact} className="text-sm leading-relaxed text-slate-400">
```

를:

```tsx
      <p className="mb-3 text-3xl font-bold tracking-tight text-slate-900">
        1 <span className="text-slate-500">/</span> {stats.totalCombinations.toLocaleString()}
      </p>
      <ul className="space-y-1.5">
        {facts.map((fact) => (
          <li key={fact} className="text-sm leading-relaxed text-slate-500">
```

- [ ] **Step 5: `recent-grid.tsx`의 미출현 칸 hex 치환**

```tsx
                  style={{
                    backgroundColor: present.has(n) ? ballColor(n).bg : "#1e293b",
                  }}
```

를:

```tsx
                  style={{
                    backgroundColor: present.has(n) ? ballColor(n).bg : "#e2e8f0",
                  }}
```

(`#1e293b`는 slate-800, `#e2e8f0`는 slate-200 — 흰 배경에서도 "출현 안 함" 칸이 옅게 구분되도록.)

- [ ] **Step 6: `top-pairs-list.tsx`의 진행 바 트랙·카운트 색 치환**

```tsx
            <div className="h-2 flex-1 overflow-hidden rounded bg-slate-800">
              <div
                className="h-full rounded bg-sky-600"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs tabular-nums text-slate-400">{count}회</span>
```

를:

```tsx
            <div className="h-2 flex-1 overflow-hidden rounded bg-slate-100">
              <div
                className="h-full rounded bg-sky-600"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs tabular-nums text-slate-500">{count}회</span>
```

- [ ] **Step 7: lint + 테스트 확인**

Run: `pnpm --filter web lint && pnpm --filter web test`
Expected: 둘 다 통과.

- [ ] **Step 8: 커밋**

```bash
git add apps/web/src/modules/statistics/view/statistics-panel.tsx \
        apps/web/src/modules/statistics/view/hot-cold-board.tsx \
        apps/web/src/modules/statistics/view/pattern-distribution.tsx \
        apps/web/src/modules/statistics/view/probability-reality.tsx \
        apps/web/src/modules/statistics/view/recent-grid.tsx \
        apps/web/src/modules/statistics/view/top-pairs-list.tsx
git commit -m "$(cat <<'EOF'
style: 통계 패널 전체를 라이트 테마로 전환

frequency-heatmap, number-frequency-bars, sum-distribution-chart는 이미
라이트 배경에서도 충분한 대비를 가져 변경하지 않았다.
EOF
)"
```

---

### Task 13: 전체 검증

**Files:**
- 없음 (검증 전용 Task, 코드 변경 없음)

**Interfaces:**
- Consumes: Task 1~12의 모든 산출물.
- Produces: 없음 — 이 계획의 마지막 게이트.

- [ ] **Step 1: 전체 테스트/린트 스위트 실행**

Run: `pnpm test && pnpm lint`
Expected: `packages/core` vitest(44개) + `apps/web` vitest(10개) 모두 통과, `apps/web` eslint(경계
규칙) + `packages/core` tsc 통과.

- [ ] **Step 2: dev 서버로 육안 확인**

Run: `pnpm dev`

브라우저에서 다음을 확인한다:
- 홈 화면 전체가 흰 배경 + slate-900 텍스트로 렌더링되는지 (다크 잔재 없는지)
- 통계 패널의 모든 카드(히트맵, 핫/콜드, 패턴 분포, 확률, 잔디밭, 페어, 빈도 막대, 합계 분포)에서
  로또 공 색상이 흰 배경에서도 선명하게 보이는지
- `ResultsCard`에서 일치 번호에 `ring-slate-900` 강조 링이 실제로 보이는지 (이전 `ring-white`는
  흰 카드 위에서 안 보였을 부분)
- 에러 상태(예: 개발자 도구로 API 호출 실패를 흉내내거나 코드 임시 수정)에서 `text-red-600`이
  흰 배경에서 충분히 읽히는지

문제가 있으면 해당 Task로 돌아가 수정한다. 이 Step은 코드 변경이 없으므로 커밋도 없다.

- [ ] **Step 3: (문제 없을 시) 완료 — 별도 커밋 없음**

이 Task는 검증 전용이라 Step 1~2가 모두 통과하면 커밋할 변경 사항이 없다. 앞선 12개 Task의
커밋이 이미 전체 작업 이력을 구성한다.
