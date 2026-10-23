import { execSync } from "node:child_process";

// 시험 전에 한 번 생성 파일을 쓴다 — test.setup.ts 가 screens.ts 를 거쳐 그것을 싣는다
export default function storeGen() {
  execSync("pnpm exec store-gen", { cwd: __dirname, stdio: "inherit" });
}
