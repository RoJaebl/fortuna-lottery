/** 새 픽의 식별자를 짓는다 — 프로덕션: 시각+난수 / 테스트: 순번 고정 */
export type IdGeneratorPort = () => string;

export const ID_GENERATOR = Symbol("IdGeneratorPort");
