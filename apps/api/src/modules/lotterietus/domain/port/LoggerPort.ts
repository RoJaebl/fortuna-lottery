/** 수집 경과를 남기는 자리 — 프로덕션: Nest 로거 / 테스트: 가짜 함수 */
export type LoggerPort = (message: string) => void;

export const LOGGER = Symbol("LotterietusLoggerPort");
