// 띄우는 프로그램이 포트를 고르는 유일한 자리 (launcher-ports §1·§2)
import { createServer } from "node:net";

/** 몇 개까지 올려 보는가 — 화면 3000·서버 4000 의 찾는 범위가 서로 겹치지 않는다(editor 의 dev-ports 와 같은 20 개) */
const SEARCH_LIMIT = 20;

/** 그 주소에서 포트를 열어 보고 바로 닫는다. IPv6 를 열 수 없는 기기면 그 주소는 빈 것으로 본다 */
function opens(port, host) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", (error) => resolve(error.code === "EAFNOSUPPORT" || error.code === "EADDRNOTAVAIL"));
    server.listen(port, host, () => server.close(() => resolve(true)));
  });
}

/**
 * 127.0.0.1 과 :: 양쪽에서 열리면 비어 있다. next·nest 는 :: 에 서는데, 윈도우는 :: 가 쥐여 있어도
 * 127.0.0.1 을 따로 열어 주므로 한쪽만 보면 쥔 포트를 빈 것으로 읽는다
 */
export async function isFree(port) {
  return (await opens(port, "127.0.0.1")) && (await opens(port, "::"));
}

/** 포트 0 으로 열어 OS 가 준 번호를 읽고 닫는다 */
function osPort(host = "127.0.0.1") {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, host, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

/**
 * 설 포트를 고른다.
 * - `from` 이 없으면 OS 가 준 빈 포트.
 * - `from` 이 있고 `strict` 면 그 번호가 비었을 때만 돌려주고, 쥐여 있으면 까닭과 함께 실패한다.
 * - `from` 이 있고 `strict` 가 아니면 `from` 부터 하나씩 올려 첫 빈 포트(최대 20 개).
 */
export async function pickPort({ from, strict = false } = {}) {
  if (from === undefined) return osPort();
  if (strict) {
    if (await isFree(from)) return from;
    throw new Error(`포트 ${from} 이 이미 쓰이고 있다`);
  }
  for (let port = from; port < from + SEARCH_LIMIT; port++) {
    if (await isFree(port)) return port;
  }
  throw new Error(`포트 ${from}~${from + SEARCH_LIMIT - 1} 이 모두 쓰이고 있다`);
}
