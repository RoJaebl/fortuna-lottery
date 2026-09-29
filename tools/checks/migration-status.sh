#!/usr/bin/env bash
# tools/checks/migration-status.sh — pnpm check:migration 이 부른다
set -euo pipefail

EXCLUDE_RE="$(node -p "require('./.dependency-cruiser.cjs').options.exclude.path")"

echo "== 골조 이관 상태 =="

TOTAL=$(git ls-files '*.ts' '*.tsx' | grep -vc '\.test\.' || true)
OLD=$(git ls-files '*.ts' '*.tsx' | grep -v '\.test\.' | grep -cE "$EXCLUDE_RE" || true)
echo "옛 구역 파일: $OLD / $TOTAL"

echo
echo "-- 아직 옮기지 않은 구역 --"
git ls-files '*.ts' '*.tsx' | grep -E "$EXCLUDE_RE" | sed 's|/[^/]*$||' | sort -u | sed 's/^/  /'

echo
echo "-- 옮긴 모듈 --"
git ls-files 'apps/*/src/modules/*/index.ts' | { grep -vE "$EXCLUDE_RE" || true; } | sed 's|/index.ts$||' | sed 's/^/  /'

echo
echo "-- 옛 구역에 최근 30일 안에 생긴 파일 (규칙 3절 위반 후보) --"
git log --since='30 days ago' --diff-filter=A --name-only --format= \
  | grep -E "$EXCLUDE_RE" | sort -u | sed 's/^/  /' || echo "  없음"
