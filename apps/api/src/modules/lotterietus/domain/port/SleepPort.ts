/** 원격 요청 사이의 대기 — 프로덕션: 타이머 / 테스트: 곧바로 끝나는 가짜 */
export type SleepPort = (ms: number) => Promise<void>;

export const SLEEP = Symbol("LotterietusSleepPort");
