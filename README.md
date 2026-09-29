# 로또랩 Lotto Lab

사기 전에, 데이터로 확인하세요. 과거 회차 데이터 기반의 **정직한 통계**로 로또(6/45) 번호 선택을 돕는 의사결정 도우미입니다. 과거 통계는 미래 당첨 확률을 높이지 않습니다 — 이 서비스는 그 사실부터 정직하게 보여줍니다.

## 설계 문서

- [v1 — 제품 개요·기능 범위](<docs/superpowers/specs/2026-06-04-fortuna-lottery-design.md>)
- [골조 이관 계획 — 지금 구조](<docs/superpowers/plans/2026-09-29-vault-architecture-migration.md>) (옛 v2 아키텍처 문서를 대체한다)

## 구조

화면 앱과 응용 서버가 각자 프로세스를 갖는 **두 서버** 배치다.

```
apps/web/            Next.js 화면 앱 (:3000) — src/app(셸), src/modules/<도메인>, src/shared
apps/api/            NestJS 응용 서버 (:4000, /api) — src/modules/<도메인>, 조립 루트, Prisma, 회차 수집 스케줄러
packages/contract/   zod 와이어 계약 — 두 앱이 참조한다
packages/kernel/     로또 순수 커널 — apps/api 만 참조한다
```

- 브라우저는 `apps/web` 의 `/api/*` 를 부르고, Next `rewrites` 가 그것을 `apps/api` 로 넘긴다.
- 의존 방향과 층 경계는 dependency-cruiser 가, 화면 코드의 모양은 ESLint 가 강제한다.
- 픽은 아직 서버 메모리에 저장되고, 인증은 없다(게스트 모드).

자세한 규칙과 이 저장소가 정한 것은 [`CLAUDE.md`](<CLAUDE.md>)에 있다.

## 실행

```bash
pnpm install
docker compose up -d   # 로컬 Postgres — apps/api/.env 는 .env.example 을 본뜬다
pnpm dev               # apps/web 과 apps/api 를 함께 띄운다
pnpm check             # 타입 검사 · lint · 의존 규칙 · 시험
pnpm build             # 프로덕션 빌드
```
