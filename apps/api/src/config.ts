/** 환경 변수를 읽는 유일한 자리 (backend-module-layout 규칙 1절) */
export interface ApiConfig {
  port: number;
  /** 회차 수집 스케줄러를 돌리는가 — 시험과 두 번째 인스턴스는 SCHEDULER_ENABLED=false 로 끈다 */
  schedulerEnabled: boolean;
}

/** 조립 루트가 전역으로 내주는 설정의 주입 토큰 — 모듈은 이것을 @Inject(CONFIG) 로 받는다 */
export const CONFIG = Symbol("ApiConfig");

export function loadConfig(): ApiConfig {
  return {
    port: Number(process.env.PORT ?? 4000),
    schedulerEnabled: process.env.SCHEDULER_ENABLED !== "false",
  };
}
