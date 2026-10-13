import type { IdGeneratorPort } from "../port/IdGeneratorPort.js";

/** 기본 ID 생성 — 런타임 의존성 없는 시각+난수 조합 (충돌 확률 무시 가능한 MVP 수준) */
export const randomPickId: IdGeneratorPort = () =>
  `pick_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
