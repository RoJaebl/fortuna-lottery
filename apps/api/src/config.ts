/** 환경 변수를 읽는 유일한 자리 (backend-module-layout 규칙 1절) */
export interface ApiConfig {
  port: number;
}

export function loadConfig(): ApiConfig {
  return { port: Number(process.env.PORT ?? 4000) };
}
