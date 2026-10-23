# 서식을 가진 뷰와 공용 부품을 폴더로 묶기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서식 파일(`*.styles.ts`)을 가진 뷰와 `shared/ui` 부품을 모두 폴더로 묶는다. 폴더 안에는 `index.tsx` · `<폴더>.styles.ts` · 시험이 선다. 검사기는 서식의 주인을 폴더로 판정한다.

**Architecture:**
- 지난 작업(`view-styles+`, `dev` 병합 `f6a4e4e`)은 서식 파일을 뷰 곁에 파일로 세웠다. 이번에는 vault 골조 개정과 같은 규칙을 따른다: **그 뷰만 쓰는 서식 파일이 생기면 그 뷰는 폴더가 된다.**
- 옮길 것은 넷이다. `shared/ui` 의 `ball`·`card`·`tabs` 셋, 그리고 `StatisticsPanel/PatternDistribution.tsx` 하나. `GeneratorCard`·`ResultsCard`·`SimulationCard` 는 이미 폴더라 그대로다.
- 검사기 `styles-owned-by-its-screen` 은 같은 폴더의 `X.tsx` 가 `X.styles` 를 가져오는 것을 더는 허용하지 않는다. 그리고 `X.styles.ts` 가 이름이 `X` 인 폴더 밖에 서면 오류다.

**Tech Stack:** Next.js · tailwind-variants · vitest · ESLint

**근거:** 2026-10-23 대화의 결정(폴더 이름 PascalCase, 폴더 안 이름은 폴더 이름을 따름). vault 쪽 골조 개정 계획은 vault 저장소의 `docs/superpowers/plans/2026-10-23-styles-promote-view.md`(브랜치 `styles-folder+`)다. 이 저장소는 그 개정이 `dev` 에 들어가기 전에 규칙을 먼저 적용한다 — CLAUDE.md 에 그 사실을 적는다.

## 세울 폴더 구조

```
apps/web/src/
  shared/ui/
    Ball/    index.tsx · Ball.styles.ts · Ball.styles.test.ts
    Card/    index.tsx · Card.styles.ts · Card.test.tsx
    Tabs/    index.tsx · Tabs.styles.ts · Tabs.styles.test.ts
  app/(home)/StatisticsPanel/
    PatternDistribution/   index.tsx · PatternDistribution.styles.ts · PatternDistribution.styles.test.ts
```

## Global Constraints

- 작업 자리는 워크트리 `C:/Users/hnpark/orca/workspaces/fortuna-lottery/styles-folder`(브랜치 `styles-folder+`)다. 새 워크트리라 첫 Task 는 `pnpm install --config.confirm-modules-purge=false` 부터 돈다.
- 매 Task 끝에 `pnpm check` 가 통과한다.
- 옮기기는 `git mv` 로 해서 이력을 잇는다. 대소문자가 바뀌는 이름(`ball.tsx` → `Ball/index.tsx`)도 경로가 달라 Windows 에서 그대로 옮겨진다.
- 폴더 이름은 PascalCase 이고 내보내는 이름과 같다(`Ball`·`Card`·`Tabs`·`PatternDistribution`). 가져오기는 `@ui/Ball`·`@ui/Card`·`@ui/Tabs`.
- 폴더 안 이름은 폴더 이름을 따른다. 서식 `<폴더>.styles.ts`, 서식 시험 `<폴더>.styles.test.ts`, 화면 시험 `<폴더>.test.tsx`. 서식 객체의 내보내는 이름은 폴더 이름의 camelCase 다(`ball`·`card`·`tabs`·`patternDistribution`, 지금과 같다).
- 화면에 걸리는 클래스와 동작은 바뀌지 않는다. 옮긴 뒤 바뀌는 것은 경로와 import 줄뿐이고, 기존 시험은 이름만 바뀐 채 같은 단언으로 통과한다.
- 코드 주석·문서는 한국어 `-다` 말투. 문서 링크는 `§번호 제목` 과 링크를 함께 쓰고, 공백 있는 경로는 꺾쇠로 감싸며, `%20` 과 역슬래시를 쓰지 않는다.
- 커밋 메시지는 `refactor(web):`·`chore(checks):`·`docs:` 접두에 한국어 본문, 끝에 `Co-Authored-By: <그 커밋을 쓴 모델 이름> <noreply@anthropic.com>`.
- `tools/checks/run-violations.sh` 는 CRLF 라 LF 사본으로 돌린다(`tr -d '\r' < tools/checks/run-violations.sh > tools/checks/run-violations.lf.sh` → Git bash 로 실행 → 사본 삭제).

## Review Focus

1. **옮긴 파일의 상대 경로가 한 층 깊어진다.** `shared/ui/<Name>/` 안의 `../lib/…` 는 `../../lib/…` 가 되어야 한다. `PatternDistribution/` 안의 `./_model/…` 은 `../_model/…` 이 되어야 한다. 빠지면 typecheck 가 잡는다.
2. **폴더 import 가 `index.tsx` 로 풀리는지.** `StatisticsPanel/index.tsx` 의 `./PatternDistribution` 과 presenter 의 `import type { … } from "./PatternDistribution"` 은 경로를 바꾸지 않아도 폴더의 `index.tsx` 로 풀려야 한다. typecheck 와 Next 빌드가 잡는다.
3. **대소문자만 다른 옛 경로가 남는다.** Windows 는 대소문자를 가리지 않아 `@ui/ball` 이 로컬에서 우연히 풀릴 수 있다. 리눅스 CI 에서는 깨진다. Task 1 의 grep 이 소문자 경로 0건을 확인한다.
4. **검사기를 좁힌 뒤 기존 허용이 사라진다.** 같은 폴더의 `X.tsx` 허용을 빼면, 지금 그 꼴로 서 있는 파일이 하나라도 남았을 때 lint 가 깨진다. Task 3 을 Task 1·2 뒤에 둔다.
5. **`X.styles.ts` 의 자리 판정이 시험 파일을 오판한다.** `X.styles.test.ts` 는 서식 파일이 아니다. 새 판정은 `.styles.ts` 로 끝나는 파일만 본다.

---

### Task 1: `shared/ui` 부품 셋을 폴더로 묶는다

**Files:**
- Move: `apps/web/src/shared/ui/ball.tsx` → `Ball/index.tsx`, `ball.styles.ts` → `Ball/Ball.styles.ts`, `ball.styles.test.ts` → `Ball/Ball.styles.test.ts`
- Move: `card.tsx` → `Card/index.tsx`, `card.styles.ts` → `Card/Card.styles.ts`, `card.test.tsx` → `Card/Card.test.tsx`
- Move: `tabs.tsx` → `Tabs/index.tsx`, `tabs.styles.ts` → `Tabs/Tabs.styles.ts`, `tabs.styles.test.ts` → `Tabs/Tabs.styles.test.ts`
- Modify: 옮긴 파일 안의 상대 경로, 그리고 `@ui/ball`·`@ui/card`·`@ui/tabs` 를 가져오는 파일 전부(`apps/web/src/app/(home)/` 아래)

- [ ] **Step 1: `pnpm install --config.confirm-modules-purge=false`** 를 돌린다.
- [ ] **Step 2: `git mv` 로 아홉 파일을 옮긴다.**
- [ ] **Step 3: 옮긴 파일 안의 경로를 고친다.** `../lib/…` → `../../lib/…`, `./ball.styles` → `./Ball.styles`, `./card` → `.`(시험이 `./card` 대신 `.` 또는 `./index` 로 화면을 가져온다), 나머지도 같은 꼴로.
- [ ] **Step 4: 가져오는 쪽을 고친다.** `@ui/ball` → `@ui/Ball`, `@ui/card` → `@ui/Card`, `@ui/tabs` → `@ui/Tabs`.
- [ ] **Step 5: 확인한다.**
  - `git grep -nE '@ui/(ball|card|tabs)\b' -- apps/web/src` → 0
  - `git grep -nE '\.\./lib/' -- apps/web/src/shared/ui` → 0(전부 `../../lib/`)
  - `pnpm --filter @fortuna-lottery/web exec vitest run src/shared/ui` → 옮긴 시험 셋 PASS
  - `pnpm check` 통과
- [ ] **Step 6: 커밋한다** — `refactor(web): shared/ui 의 공·카드·탭을 서식과 함께 폴더로 묶는다`

---

### Task 2: `PatternDistribution` 을 폴더로 승격한다

**Files:**
- Move: `apps/web/src/app/(home)/StatisticsPanel/PatternDistribution.tsx` → `PatternDistribution/index.tsx`, `PatternDistribution.styles.ts` → `PatternDistribution/PatternDistribution.styles.ts`, `PatternDistribution.styles.test.ts` → `PatternDistribution/PatternDistribution.styles.test.ts`
- Modify: `PatternDistribution/index.tsx` 의 `./_model/…` → `../_model/…`

- [ ] **Step 1: `git mv` 로 세 파일을 옮기고 상대 경로를 고친다.** `StatisticsPanel/index.tsx` 와 `StatisticsPanel.presenter.ts` 의 `./PatternDistribution` 은 그대로 둔다 — 폴더의 `index.tsx` 로 풀린다.
- [ ] **Step 2: 확인한다.**
  - `pnpm --filter @fortuna-lottery/web exec vitest run "src/app/(home)/StatisticsPanel"` → PASS
  - `pnpm check` 통과
- [ ] **Step 3: 커밋한다** — `refactor(web): 서식을 가진 PatternDistribution 을 폴더로 승격한다`

---

### Task 3: 서식의 주인을 폴더로 판정하게 검사기를 좁히고 문서에 적는다

**Files:**
- Modify: `apps/web/eslint.config.mjs`(규칙 `styles-owned-by-its-screen`), `tools/checks/run-violations.sh`, `tools/checks/eslint-violations/styles-owned-by-its-screen*`, `tools/checks/eslint-allowed/styles-owned-by-its-screen*`, `CLAUDE.md`, `.claude/context/design-system.md`

- [ ] **Step 1: 규칙의 판정을 고친다.**
  - `X.styles`(확장자 유무 무관)를 가져올 수 있는 파일은 둘뿐이다: 폴더 `X` 의 `index.tsx`, 같은 폴더의 `X.styles.test.ts`. 같은 폴더의 `X.tsx` 허용을 뺀다.
  - 새 판정 하나: 파일 이름이 `X.styles.ts` 이면 그 파일이 선 폴더의 이름이 `X` 여야 한다(파일 경로의 구분자는 `/`·`\` 둘 다 받는다). 메시지: 「서식 파일 `X.styles.ts` 는 폴더 `X` 안에 둔다 — 서식을 가진 뷰는 폴더로 승격한다」.
  - 규칙 주석에 판정 둘과 근사의 한계(정적 `import` 선언만 본다)를 적는다. vault 골조 개정 계획을 가리키는 한 줄도 적는다.
- [ ] **Step 2: 표본을 맞춘다.**
  - 위반 표본: 형제 화면이 `./Card.styles` 를 가져온다(지금 것), 그리고 새로 하나 — 같은 폴더의 `Card.tsx` 가 `./Card.styles` 를 가져온다(이제 금지), 하나 더 — `Card.styles.ts` 가 `Card/` 밖에 선다.
  - 허용 표본: `Card/index.tsx` 가 `./Card.styles` 를 가져온다(지금 것), `Card/Card.styles.test.ts` 가 `./Card.styles` 를 가져온다.
  - `run-violations.sh` 의 EXPECT 를 필요한 만큼 더한다.
- [ ] **Step 3: 문서를 고친다.**
  - `.claude/context/design-system.md` 「규칙」 절의 「화면 곁 `<화면>.styles.ts`」를 「뷰 폴더 안의 `<폴더>.styles.ts` — 서식을 가진 뷰는 폴더로 승격한다」로 고친다. `shared/ui` 부품도 `<Name>/index.tsx` · `<Name>.styles.ts` 폴더라는 줄을 더한다.
  - `CLAUDE.md`: ESLint 규칙 목록의 `styles-owned-by-its-screen` 설명을 새 판정에 맞춘다. 「이 저장소가 정한 것 — vault 골조가 답하지 않는 자리」에 한 줄: 서식을 가진 뷰와 `shared/ui` 부품은 폴더로 승격한다. vault 골조는 이 규칙을 개정 중이고(vault `styles-folder+`), 그 개정이 `dev` 에 들어가기 전까지 이 저장소가 먼저 따른다.
- [ ] **Step 4: 확인한다.**
  - `pnpm --filter @fortuna-lottery/web lint` 오류 0
  - run-violations(LF 사본) 모든 줄 OK, 새 표본 포함
  - `find apps/web/src -name "*.styles.ts"` 의 모든 줄에서 폴더 이름 = 파일 이름 앞부분
  - `pnpm check` 통과, `pnpm --filter @fortuna-lottery/web build` 성공
- [ ] **Step 5: 커밋한다** — `chore(checks): 서식 파일의 주인을 폴더로 판정하고 승격 규칙을 문서에 적는다`
