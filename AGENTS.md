# AGENTS.md

이 문서는 이 저장소에서 작업하는 Codex(Codex.ai/code)를 위한 가이드다.

## 이 저장소는 무엇인가

**로또랩 (fortuna-lottery)** — 한국 로또 6/45 사용자를 위한 의사결정 도우미 서비스. 실제 로또를 사기 전에
과거 회차 데이터 기반의 정직한 통계를 보여주고, 번호는 사용자가 직접 고르게 한다. 예측력을 주장하지
않는다는 원칙을 명시적으로 지킨다: 로또 추첨은 매 회차 독립 사건이며 과거 통계는 미래 당첨 확률을
높이지 못한다 — 핫/콜드·확률 관련 화면은 모두 이 사실을 명시해야 한다. 몰입감 있는 UX(다음 추첨
카운트다운, 희귀도 배지, "타임머신" 백테스트)는 이 정직한 통계 위에 얹히는 것이며, 이 정직함이
곧 후속 구독 전환의 신뢰 기반이다.

설계 문서는 [v1 설계](<docs/superpowers/specs/2026-06-04-fortuna-lottery-design.md>)(제품 개요·기능 범위·정직성
원칙, 지금도 유효)와 [골조 이관 계획](<docs/superpowers/plans/2026-09-29-vault-architecture-migration.md>)(지금 구조가
어떻게 섰는지) 둘이다. 옛 v2 아키텍처 문서는 이 계획으로 대체되어 기록으로만 남는다.

참고: 이 저장소는 사용자의 Obsidian vault(별도로 관리되는 OneDrive 동기화 폴더) 안에 위치하지만,
`RoJaebl/fortuna-lottery`라는 자체 GitHub 원격 저장소를 가진 독립된 git 저장소다 — vault의
PARA/MOC 규칙과는 무관하다.

## 커밋 메시지

이 저장소의 모든 커밋 제목은 `:gitmoji: <type> 제목` 형식을 따라야 한다 (gitmoji 짧은코드,
꺾쇠괄호 안의 conventional-commit 타입, "무엇을"이 아니라 "왜"가 드러나는 한글 명령형 요약).
전체 gitmoji↔type 매핑표는 `.agents/skills/gitmoji-commit/SKILL.md` 참고. 이 저장소에서 커밋할 때는
`gitmoji-commit` 스킬을 사용한다.

## 명령어·구조·현황은 `CLAUDE.md` 가 소유한다

명령어, 배치(두 서버: `apps/web` 과 `apps/api`), vault 골조 문서를 가리키는 아키텍처 절, 이 저장소가 정한
것, MVP 현황, TDD 규칙은 루트의 [`CLAUDE.md`](<CLAUDE.md>)가 소유한다. 작업을 시작하기 전에 그 파일을 읽는다.
여기 다시 적지 않는 것은 두 파일이 서로 어긋나며 낡기 때문이다.
