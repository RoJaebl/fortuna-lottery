#!/usr/bin/env bash
# 위반 표본이 각자의 규칙에서 실제로 실패하는지 확인한다 — boundary-enforcement §5.
# 표본 폴더 이름이 곧 규칙 이름이다. 규칙 경로가 `^apps/...` 꼴이라, 표본 폴더 안을 작업 디렉터리로 삼아
# 그 안의 apps/·packages/ 가 저장소 루트의 것처럼 보이게 한다. check 에 넣지 않는다(표본은 실패해야 한다).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BIN="$ROOT/node_modules/dependency-cruiser/bin/dependency-cruiser.mjs"
bad=0

for dir in "$ROOT"/tools/checks/violations/*/; do
  rule="$(basename "$dir")"
  out="$(cd "$dir" && node "$BIN" --config "$ROOT/tools/checks/violations-config.cjs" --ts-config "$ROOT/tsconfig.base.json" . 2>&1)"
  if grep -q "error $rule:" <<<"$out"; then
    echo "OK   $rule"
    grep "error $rule:" <<<"$out" | sed 's/^/       /'
  else
    echo "FAIL $rule — 표본이 이 규칙에 걸리지 않았다"
    bad=1
  fi
done

exit $bad
