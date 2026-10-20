// 화면 앱 package.json 에 "sideEffects": false 가 있으면 실패한다 — boundary-enforcement §6.
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "apps/web/package.json";
if (JSON.parse(readFileSync(file, "utf8")).sideEffects === false) {
  console.error(
    `error no-side-effects-false: ${file} — "sideEffects": false 를 두지 않는다. ` +
      "번들러가 값을 가져오지 않는 import 를 떨어뜨려 store 등록이 사라진다",
  );
  process.exit(1);
}
