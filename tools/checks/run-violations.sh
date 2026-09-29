#!/usr/bin/env bash
# 위반 표본이 각자의 규칙에서 실제로 실패하는지 확인한다 — boundary-enforcement §5.
# 표본 폴더 이름이 곧 규칙 이름이다. 규칙 경로가 `^apps/...` 꼴이라, 표본 폴더 안을 작업 디렉터리로 삼아
# 그 안의 apps/·packages/ 가 저장소 루트의 것처럼 보이게 한다. check 에 넣지 않는다(표본은 실패해야 한다).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BIN="$ROOT/node_modules/dependency-cruiser/bin/dependency-cruiser.mjs"
bad=0

# 폴더 이름의 `--` 뒤는 같은 규칙의 다른 표본(예: 패키지 이름 꼴 import)이다.
# 표본 폴더에 tsconfig.json 이 있으면 그 paths 로 패키지 이름·@/ 별칭을 표본 안의 경로로 푼다.
for dir in "$ROOT"/tools/checks/violations/*/; do
  name="$(basename "$dir")"
  rule="${name%%--*}"
  tsconfig="$ROOT/tsconfig.base.json"
  [[ -f "$dir/tsconfig.json" ]] && tsconfig="$dir/tsconfig.json"
  out="$(cd "$dir" && node "$BIN" --config "$ROOT/tools/checks/violations-config.cjs" --ts-config "$tsconfig" . 2>&1)"
  if grep -q "error $rule:" <<<"$out"; then
    echo "OK   $name"
    grep "error $rule:" <<<"$out" | sed 's/^/       /'
  else
    echo "FAIL $name — 표본이 규칙 $rule 에 걸리지 않았다"
    bad=1
  fi
done

# ESLint 모양 규칙 표본 — 규칙 이름이 no-restricted-* 로 겹치므로 메시지 조각으로 어느 규칙인지 가린다.
# 표본 안의 apps/web 을 작업 디렉터리로 삼는다(-c 로 준 설정의 글롭은 작업 디렉터리 기준이다).
ESLINT="$ROOT/apps/web/node_modules/eslint/bin/eslint.js"
declare -A EXPECT=(
  [view-with-state]='화면은 상태를 갖지 않는다'
  [viewmodel-spread]='표시 모델을 얕은 전개로 복제하면'
  [view-folder-public-surface]='뷰 폴더 밖에서는 그 폴더의 index 만'
)
for dir in "$ROOT"/tools/checks/eslint-violations/*/; do
  rule="$(basename "$dir")"
  out="$(cd "$dir/apps/web" && node "$ESLINT" -c "$ROOT/tools/checks/eslint-violations.config.mjs" src 2>&1)"
  if [[ -n "${EXPECT[$rule]:-}" ]] && grep -q "${EXPECT[$rule]}" <<<"$out"; then
    echo "OK   $rule (eslint)"
    grep "error" <<<"$out" | sed 's/^/       /'
  else
    echo "FAIL $rule (eslint) — 표본이 이 규칙에 걸리지 않았다"
    bad=1
  fi
done

exit $bad
