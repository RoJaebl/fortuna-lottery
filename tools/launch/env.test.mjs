import assert from "node:assert/strict";
import { test } from "node:test";
import { childEnv } from "./env.mjs";

test("셸의 PORT·HOST 가 자식에 새지 않는다", () => {
  const base = { PORT: "9999", HOST: "0.0.0.0", PATH: "/usr/bin" };
  const env = childEnv(base, { FORTUNA_MODE: "dev" });
  assert.equal("PORT" in env, false);
  assert.equal("HOST" in env, false);
  assert.equal(env.PATH, "/usr/bin");
  assert.equal(env.FORTUNA_MODE, "dev");
  assert.equal(base.PORT, "9999", "넘겨받은 환경은 고치지 않는다");
});

test("extra 의 PORT 는 서비스마다 따로 채운다", () => {
  const env = childEnv({ PORT: "9999" }, { PORT: "4001" });
  assert.equal(env.PORT, "4001");
});
