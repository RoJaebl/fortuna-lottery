// 사람의 셸 환경이 서비스로 새지 않게 한다 (launcher-ports §6)

/** 서비스마다 다른 값이어야 하는 일반 이름 — 띄우는 프로그램이 비우고 서비스마다 따로 채운다 */
const PER_SERVICE = ["PORT", "HOST"];

/** `base` 에서 `PORT`·`HOST` 를 지운 사본에 `extra` 를 얹는다. `base` 는 고치지 않는다 */
export function childEnv(base, extra) {
  const env = { ...base };
  for (const name of PER_SERVICE) delete env[name];
  return { ...env, ...extra };
}
