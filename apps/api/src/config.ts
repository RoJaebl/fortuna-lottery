/** 환경 변수를 읽는 유일한 자리 (backend-module-layout 규칙 1절) */
export interface ApiConfig {
  port: number;
  /** 회차 수집 스케줄러를 돌리는가 — 시험과 두 번째 인스턴스는 SCHEDULER_ENABLED=false 로 끈다 */
  schedulerEnabled: boolean;
}

/** 조립 루트가 전역으로 내주는 설정의 주입 토큰 — 모듈은 이것을 @Inject(CONFIG) 로 받는다 */
export const CONFIG = Symbol("ApiConfig");

/**
 * apps/api/.env 를 프로세스 환경에 싣는다 — main.ts 가 앱을 만들기 전에 부른다.
 * 이미 있는 환경 변수는 덮지 않고, 파일이 없으면 아무것도 하지 않는다. 경로는 작업 디렉터리가 아니라 이 파일 기준이다(src/·dist/ 한 칸 위).
 */
export function loadEnvFile(): void {
  try {
    process.loadEnvFile(new URL("../.env", import.meta.url));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  // 스케줄러 기본값: `dev` 스크립트(watch 로 자주 재시작한다)에서는 꺼짐, 그 밖(`start`)에서는 켜짐.
  // SCHEDULER_ENABLED 를 적으면 그 값이 이긴다. pnpm 이 돌리는 스크립트 이름을 npm_lifecycle_event 로 알려 준다.
  const schedulerDefault = env.npm_lifecycle_event === "dev" ? "false" : "true";
  return {
    port: Number(env.PORT ?? 4000),
    schedulerEnabled: (env.SCHEDULER_ENABLED ?? schedulerDefault) !== "false",
  };
}
