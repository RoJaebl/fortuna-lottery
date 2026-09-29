#!/usr/bin/env bash
# tools/checks/migration-status.sh — pnpm check:migration 이 부른다
set -euo pipefail

# 옛 구역은 .dependency-cruiser.cjs 의 options.exclude 가 정한다. 그 옵션이 없으면(이관 끝) 옛 구역도 없다
EXCLUDE_RE="$(node -p "require('./.dependency-cruiser.cjs').options.exclude?.path ?? ''")"

# 옛 구역에 드는 경로만 남긴다 — 옛 구역이 없거나 맞는 것이 없어도 실패하지 않는다
in_old_zone() {
  if [ -z "$EXCLUDE_RE" ]; then cat >/dev/null; return 0; fi
  grep -E "$EXCLUDE_RE" || true
}

# 목록이 비면 「없음」을 찍는다
or_none() {
  local lines
  lines="$(cat)"
  if [ -z "$lines" ]; then echo "  없음"; else printf '%s\n' "$lines" | sed 's/^/  /'; fi
}

echo "== 골조 이관 상태 =="

TOTAL=$(git ls-files '*.ts' '*.tsx' | grep -vc '\.test\.' || true)
OLD=$(git ls-files '*.ts' '*.tsx' | grep -v '\.test\.' | in_old_zone | grep -c . || true)
echo "옛 구역 파일: $OLD / $TOTAL"

echo
echo "-- 아직 옮기지 않은 구역 --"
git ls-files '*.ts' '*.tsx' | in_old_zone | sed 's|/[^/]*$||' | sort -u | or_none

echo
echo "-- 옮긴 모듈 --"
# 옛 구역에 파일이 하나도 남지 않은 모듈 폴더 — 서버 모듈은 index.ts 가 없고, 화면 모듈은 옛 하위 폴더만 제외되므로
# index.ts 유무로는 가를 수 없다
git ls-files 'apps/*/src/modules/*' | cut -d/ -f1-5 | sort -u | while read -r m; do
  [ -n "$(git ls-files "$m" | in_old_zone)" ] || echo "  $m"
done

echo
echo "-- 옛 구역에 최근 30일 안에 생긴 파일 (규칙 3절 위반 후보) --"
git log --since='30 days ago' --diff-filter=A --name-only --format= \
  | in_old_zone | sort -u | or_none
