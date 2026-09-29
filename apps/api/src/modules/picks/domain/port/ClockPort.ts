/** 지금 시각 — 프로덕션: 시스템 시계 / 테스트: 시각 고정 */
export type ClockPort = () => Date;

export const CLOCK = Symbol("ClockPort");
