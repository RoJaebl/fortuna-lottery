import { defineConfig } from "supa-store/config";

// include 는 기본값(src/**/*.state.ts)을 쓴다 — 정의 파일의 폴더 자리는 ESLint 가 지킨다.
// out 을 composition/ 에 두는 것은 화면 모듈 안을 import 하는 파일이 조립 루트 밖에 생기지 않게 하려는 것이다
export default defineConfig({ out: "src/composition/store.gen.ts", targets: ["tsserver", "next", "cli"] });
