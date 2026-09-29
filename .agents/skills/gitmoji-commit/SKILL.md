---
name: gitmoji-commit
description: Use whenever creating a git commit in this repository (fortuna-lottery). Formats the commit message header as ":gitmoji: <type> title" — a gitmoji shortcode prefix followed by a conventional-commit type in angle brackets and a concise title. Applies to every `git commit` in this repo, not just docs/feature work.
---

# Gitmoji 커밋 스킬

이 저장소의 모든 커밋 제목은 다음 형식을 따른다.

```
:gitmoji: <type> 제목
```

- `:gitmoji:` — 아래 표에서 변경 성격에 맞는 **하나의** 짧은코드(shortcode)를 그대로 사용 (콜론 포함, 유니코드 이모지로 치환하지 않음)
- `<type>` — 아래 표의 영문 소문자 타입, 꺾쇠괄호(`<>`) 포함
- `제목` — 한글 명령형 요약 (기존 저장소 관례대로 한글 사용). 무엇을 했는지가 아니라 왜 했는지가 드러나게

예:
```
:sparkles: <feat> 픽 저장 시 사용자별 조합 검증 추가
:bug: <fix> 백테스트 등수 계산에서 보너스 매칭 오류 수정
:memo: <docs> 아키텍처 설계 문서 v2 추가
```

## 타입 선택 원칙

1. 변경의 **주된 성격 하나**만 고른다. 여러 성격이 섞여 있으면(예: 리팩토링 중 버그도 고침) 커밋을 나누거나, 더 지배적인 쪽을 택한다.
2. 이모지를 두 개 이상 붙이지 않는다.
3. 표에 맞는 타입이 없으면 가장 가까운 것을 쓰고, 정 애매하면 `:wrench: <chore>`로 처리한다.

## Gitmoji ↔ Type 매핑표

| Gitmoji | Type | 사용 시점 |
|---|---|---|
| `:sparkles:` | `<feat>` | 새 기능 추가 |
| `:bug:` | `<fix>` | 버그 수정 |
| `:ambulance:` | `<hotfix>` | 긴급(critical) 수정 |
| `:memo:` | `<docs>` | 문서 추가/수정 |
| `:recycle:` | `<refactor>` | 동작 변화 없는 리팩토링 |
| `:zap:` | `<perf>` | 성능 개선 |
| `:art:` | `<style>` | 코드 구조·포맷 개선 (로직 무변화) |
| `:white_check_mark:` | `<test>` | 테스트 추가/수정 |
| `:wrench:` | `<chore>` | 설정 파일 추가/수정 (그 외 잡무) |
| `:package:` | `<build>` | 빌드 산출물·패키징 관련 |
| `:construction_worker:` | `<ci>` | CI 빌드 시스템 |
| `:fire:` | `<remove>` | 코드·파일 삭제 |
| `:truck:` | `<rename>` | 파일·리소스 이동 또는 이름 변경 |
| `:lock:` | `<security>` | 보안 이슈 수정 |
| `:arrow_up:` | `<deps-up>` | 의존성 업그레이드 |
| `:arrow_down:` | `<deps-down>` | 의존성 다운그레이드 |
| `:heavy_plus_sign:` | `<deps-add>` | 의존성 추가 |
| `:heavy_minus_sign:` | `<deps-remove>` | 의존성 제거 |
| `:card_file_box:` | `<db>` | DB 스키마·마이그레이션 변경 |
| `:globe_with_meridians:` | `<i18n>` | 국제화·현지화 |
| `:lipstick:` | `<ui>` | UI/스타일(시각) 파일 |
| `:rewind:` | `<revert>` | 이전 변경 되돌리기 |
| `:twisted_rightwards_arrows:` | `<merge>` | 브랜치 병합 |
| `:bookmark:` | `<release>` | 릴리스/버전 태그 |
| `:rocket:` | `<deploy>` | 배포 관련 변경 |

## 본문·트레일러

제목 아래 본문은 이 세션(하네스)의 표준 커밋 규칙을 그대로 따른다 — "무엇을"이 아니라 "왜"를 1~2문장으로, 그리고 필요한 Co-Authored-By 등 트레일러를 유지한다. 이 스킬은 **제목 줄의 gitmoji 접두사 형식만** 규정한다.

## 커밋 작성 절차

1. `git status` / `git diff --staged`로 변경 내용을 파악한다.
2. 위 표에서 타입을 정한다.
3. HEREDOC으로 커밋한다:

```bash
git commit -m "$(cat <<'EOF'
:sparkles: <feat> 픽 저장 시 사용자별 조합 검증 추가

InMemoryPickRepository가 소유자 검증 없이 삭제를 허용해 다른 게스트 세션의
픽도 지울 수 있었다.

Co-Authored-By: Codex <noreply@anthropic.com>
EOF
)"
```

4. 커밋 후 `git log -1 --format=%s`로 제목이 `:gitmoji: <type> ...` 형식인지 확인한다.
