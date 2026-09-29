// ESLint 위반 표본 확인 전용 설정 — 화면 앱 설정에서 옛 구역 ignores 만 뺀 것이다.
// 표본은 apps/web/src/modules/** 꼴이라 옛 구역 글롭과 겹치므로, 그것이 있으면 검사기가 보지 못한다.
import config, { OLD_ZONE } from "../../apps/web/eslint.config.mjs";

export default config.filter((c) => c.ignores !== OLD_ZONE);
