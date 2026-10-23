import assert from "node:assert/strict";
import { createServer } from "node:net";
import { test } from "node:test";
import { isFree, pickPort } from "./ports.mjs";

/** OS 가 준 빈 포트 하나를 쥔 서버를 연다 — 시험이 끝나면 닫는다 */
function hold(port = 0, host = "127.0.0.1") {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(port, host, () => resolve(server));
  });
}

const close = (server) => new Promise((resolve) => server.close(() => resolve()));

test("쥔 포트를 건너뛴다", async () => {
  const held = await hold();
  const port = held.address().port;
  try {
    assert.equal(await isFree(port), false);
    const picked = await pickPort({ from: port });
    assert.ok(picked > port, `${picked} 은 ${port} 보다 커야 한다`);
    assert.equal(await isFree(picked), true);
  } finally {
    await close(held);
  }
});

test("strict 면 쥔 포트에서 이유와 함께 실패한다", async () => {
  const held = await hold();
  const port = held.address().port;
  try {
    await assert.rejects(pickPort({ from: port, strict: true }), new Error(`포트 ${port} 이 이미 쓰이고 있다`));
  } finally {
    await close(held);
  }
});

test("strict 이고 빈 포트면 그 번호를 그대로 돌려준다", async () => {
  const held = await hold();
  const port = held.address().port;
  await close(held);
  assert.equal(await pickPort({ from: port, strict: true }), port);
});

test("from 이 없으면 0 이 아닌 번호", async () => {
  const picked = await pickPort({});
  assert.ok(Number.isInteger(picked) && picked > 0);
  assert.equal(await isFree(picked), true);
});

test("IPv6 :: 에서 쥔 포트도 쓰이는 것으로 본다 — next·nest 는 :: 에 선다", async (t) => {
  let held;
  try {
    held = await hold(0, "::");
  } catch {
    return t.skip("이 기기는 IPv6 를 열 수 없다");
  }
  const port = held.address().port;
  try {
    assert.equal(await isFree(port), false);
    assert.notEqual(await pickPort({ from: port }), port);
  } finally {
    await close(held);
  }
});
