import type { INestApplication } from "@nestjs/common";

export const GLOBAL_PREFIX = "api";

/** main.ts 와 시험이 함께 부르는 앱 설정 — 시험이 실제 기동과 같은 설정을 거치게 한다 */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix(GLOBAL_PREFIX);
  return app;
}
