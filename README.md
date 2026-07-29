# 로또랩 Lotto Lab

사기 전에, 데이터로 확인하세요. 과거 회차 데이터 기반의 **정직한 통계**로 로또(6/45) 번호 선택을 돕는 의사결정 도우미입니다. 과거 통계는 미래 당첨 확률을 높이지 않습니다 — 이 서비스는 그 사실부터 정직하게 보여줍니다.

## 설계 문서

- [v2 — 데이터 흐름 중심 아키텍처 (현행)](docs/superpowers/specs/2026-07-03-lotto-lab-architecture-v2.md)
- [v1 — 제품 개요·기능 범위](docs/superpowers/specs/2026-06-04-lotto-lab-design.md)

## 구조

```
apps/web/          Next.js 단일 앱
  src/app/api/     HTTP 입구 (인프라 계층 — core 유스케이스 호출)
  src/modules/     FMA 프론트 모듈 (view / viewmodel / model / transport(mapper·assembler) / api)
  src/shared/      디자인 시스템 · fetcher
  src/server/      컴포지션 루트 (포트에 어댑터 주입)
packages/core/     순수 TS 도메인 (domain / application / dto / infrastructure) — 프레임워크 0
```

- **경계 규칙(ESLint 강제)**: FE 모듈은 core의 `dto`만 타입 import · 모듈 간 deep import 금지 · 라우트는 조립만
- **2-tier**: 쓰기 도메인(picks/results/identity)은 풀 파이프라인, 읽기 도메인은 얇게
- **MVP 어댑터**: `DummyDrawDataAdapter`(시드 고정 생성 데이터) · `InMemoryPickRepository` · 게스트 모드 — 포트 뒤라 실데이터/Supabase 교체 시 도메인 무수정

## 실행

```bash
pnpm install
pnpm dev      # 개발 서버
pnpm test     # core 44 + web 10 단위 테스트
pnpm lint     # 타입체크 + 경계 규칙
pnpm build    # 프로덕션 빌드
```
