#!/usr/bin/env node
// 화면(apps/web)과 응용 서버(apps/api)를 함께 띄우는 프로그램 — `pnpm dev`·`pnpm start` 가 부른다 (launcher-ports)
//
// - 포트를 고르는 자리는 여기 하나다. 고른 값을 환경으로 넘기고, 받는 쪽은 옮기지 않는다.
// - dev   : 화면 3000·서버 4000 에서 시작해 쥐여 있으면 하나씩 올린다. 서버는 `nest build --watch` 가 낸 dist 를
//           지켜보다 조용해지면 이 프로그램이 다시 띄운다(런타임의 감시 모드를 쓰지 않는다).
// - start : FORTUNA_WEB_PORT·FORTUNA_API_PORT 를 적으면 그 번호에 고정으로 서고(쥐여 있으면 실패), 없으면 OS 가 준 빈 포트.
//
// 자식은 셸을 거치지 않고 `node <패키지의 bin 파일>` 로 띄운다 — 패키지의 package.json `bin` 을 그 앱 기준으로 찾으므로
// 운영체제마다 다른 `.bin` 껍데기(sh·.cmd)에 기대지 않는다.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, watch } from "node:fs";
import { createRequire } from "node:module";
import { connect } from "node:net";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { childEnv } from "./env.mjs";
import { pickPort } from "./ports.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const API_DIR = join(ROOT, "apps/api");
const WEB_DIR = join(ROOT, "apps/web");
const API_DIST = join(API_DIR, "dist");
const API_MAIN = join(API_DIST, "main.js");
const IS_WINDOWS = process.platform === "win32";

/** dist 가 이만큼 조용해지면 서버를 다시 띄운다 */
const QUIET_MS = 300;

const say = (line) => process.stdout.write(`[launch] ${line}\n`);
const complain = (line) => process.stderr.write(`[launch] ${line}\n`);

/** 앱 폴더 기준으로 패키지의 실행 파일(JS)을 찾는다 */
function binOf(appDir, pkg, name) {
  const pkgJson = createRequire(join(appDir, "package.json")).resolve(`${pkg}/package.json`);
  const { bin } = JSON.parse(readFileSync(pkgJson, "utf8"));
  return join(dirname(pkgJson), typeof bin === "string" ? bin : bin[name]);
}

// ── 자식 프로세스 ────────────────────────────────────────────

const children = new Set();

/** 화면을 지우는 제어열(ESC[2J · ESC[3J · ESC[H) — 감시자가 파이프로도 내보내 알린 주소 줄을 지우므로 걷어 낸다 */
const CLEAR_SCREEN = /\x1b\[(?:[23]J|H)/g;

/** 자식의 출력 한 줄마다 이름표를 붙인다 */
function relay(stream, out, tag) {
  createInterface({ input: stream }).on("line", (line) => out.write(`[${tag}] ${line.replace(CLEAR_SCREEN, "")}\n`));
}

/** `node <script> ...args` 로 자식을 띄운다. 윈도우 밖에서는 프로세스 묶음째 끌 수 있게 detached 로 띄운다 */
function run(tag, script, args, { cwd, env }) {
  const child = spawn(process.execPath, [script, ...args], { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: !IS_WINDOWS });
  relay(child.stdout, process.stdout, tag);
  relay(child.stderr, process.stderr, tag);
  child.tag = tag;
  child.done = new Promise((resolveDone) => {
    child.once("exit", (code, signal) => {
      children.delete(child);
      resolveDone({ code, signal });
    });
    child.once("error", (error) => {
      complain(`${tag} 를 띄우지 못했다 — ${error.message}`);
      children.delete(child);
      resolveDone({ code: 1, signal: null });
    });
  });
  children.add(child);
  return child;
}

/** 자식을 나무째 끈다 — 윈도우는 taskkill /t /f, 그 밖은 프로세스 묶음에 SIGTERM */
function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return child.done;
  try {
    if (IS_WINDOWS) spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    else process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  return child.done;
}

const exitCodeOf = ({ code, signal }) => (code ?? (signal ? 1 : 0));

let shuttingDown = false;

/** 모든 자식을 내리고 그 코드로 나간다 */
async function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  await Promise.all([...children].map(stop));
  process.exit(code);
}

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => void shutdown(0));

/** 이 자식이 뜻밖에 끝나면 나머지도 내리고 그 코드로 나간다 */
function fatalOnExit(child) {
  void child.done.then((result) => {
    if (shuttingDown) return;
    complain(`${child.tag} 가 끝났다(코드 ${exitCodeOf(result)}) — 나머지도 내린다`);
    void shutdown(exitCodeOf(result));
  });
}

/** pnpm 을 부른다 — pnpm 스크립트 안이면 그 pnpm(npm_execpath)을, 아니면 PATH 의 pnpm 을 쓴다 */
function runPnpm(args) {
  const execPath = process.env.npm_execpath;
  const [command, argv, shell] =
    execPath && /\.[cm]?js$/.test(execPath)
      ? [process.execPath, [execPath, ...args], false]
      : IS_WINDOWS
        ? // 윈도우의 pnpm.cmd 는 셸로 띄운다 — 배열과 shell 을 함께 쓰면 DEP0190 이므로 한 줄로 잇는다
          [["pnpm", ...args.map((a) => `"${a}"`)].join(" "), [], true]
        : ["pnpm", args, false];
  return new Promise((resolveRun) => {
    const child = spawn(command, argv, { cwd: ROOT, stdio: "inherit", shell });
    child.once("exit", (code) => resolveRun(code ?? 1));
    child.once("error", () => resolveRun(1));
  });
}

/** 그 포트에 TCP 로 닿는지 본다 */
function reachable(port) {
  return new Promise((resolveReach) => {
    const socket = connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolveReach(true);
    });
    socket.once("error", () => resolveReach(false));
  });
}

/** 포트가 열릴 때까지 기다린다 */
async function waitForPort(port) {
  while (!shuttingDown && !(await reachable(port))) await new Promise((r) => setTimeout(r, 200));
}

/** 두 서버가 선 뒤 열린 자리 한 줄만 알린다 */
async function announce(webPort, apiPort) {
  await Promise.all([waitForPort(webPort), waitForPort(apiPort)]);
  if (!shuttingDown) say(`화면 http://127.0.0.1:${webPort}/ · 서버 http://127.0.0.1:${apiPort}/api`);
}

// ── dev ─────────────────────────────────────────────────────

/** dist 를 지켜보다 QUIET_MS 동안 조용해지고 main.js 가 있으면 onQuiet 를 부른다. dist 가 잠시 사라져도 견딘다 */
function watchDist(onQuiet) {
  let watcher = null;
  let timer = null;
  const poke = () => {
    clearTimeout(timer);
    timer = setTimeout(() => existsSync(API_MAIN) && onQuiet(), QUIET_MS);
  };
  const detach = () => {
    watcher?.close();
    watcher = null;
  };
  const tick = () => {
    if (watcher && !existsSync(API_DIST)) detach();
    if (watcher || !existsSync(API_DIST)) return;
    try {
      watcher = watch(API_DIST, { recursive: true }, poke);
      watcher.on("error", detach);
      poke(); // 붙기 전에 쓰인 파일도 한 번 센다
    } catch {
      detach();
    }
  };
  tick();
  setInterval(tick, 200).unref();
}

async function dev() {
  if ((await runPnpm(["--filter", "./packages/*", "build"])) !== 0) {
    complain("공용 패키지 빌드에 실패했다");
    process.exit(1);
  }
  const webPort = await pickPort({ from: 3000 });
  const apiPort = await pickPort({ from: 4000 });

  // 감시자가 첫 바퀴를 마친 뒤에 서버를 띄우려고 지난 dist 를 먼저 지운다
  rmSync(API_DIST, { recursive: true, force: true });
  const watcher = run("watch", binOf(API_DIR, "@nestjs/cli", "nest"), ["build", "--watch"], {
    cwd: API_DIR,
    env: childEnv(process.env, {}),
  });
  fatalOnExit(watcher);

  let api = null;
  let restarting = false;
  let pending = false;
  const startApi = () => {
    const child = run("api", API_MAIN, [], {
      cwd: API_DIR,
      env: childEnv(process.env, { PORT: String(apiPort), FORTUNA_STRICT_PORT: "1", FORTUNA_MODE: "dev" }),
    });
    // 서버가 죽어도 화면과 감시자는 멈추지 않는다 — 소스를 고치면 다시 띄운다 (launcher-ports §5)
    void child.done.then((result) => {
      if (!shuttingDown && !child.replaced) complain(`서버가 끝났다(코드 ${exitCodeOf(result)}) — 소스를 고치면 다시 띄운다`);
    });
    return child;
  };
  const restartApi = async () => {
    if (shuttingDown) return;
    if (restarting) {
      pending = true;
      return;
    }
    restarting = true;
    if (api) {
      api.replaced = true;
      await stop(api);
    }
    if (!shuttingDown) api = startApi();
    restarting = false;
    if (pending) {
      pending = false;
      void restartApi();
    }
  };
  watchDist(() => void restartApi());

  const web = run("web", binOf(WEB_DIR, "next", "next"), ["dev", "-p", String(webPort)], {
    cwd: WEB_DIR,
    env: childEnv(process.env, { PORT: String(webPort), API_ORIGIN: `http://127.0.0.1:${apiPort}` }),
  });
  fatalOnExit(web);

  await announce(webPort, apiPort);
}

// ── start ───────────────────────────────────────────────────

/** 운영자가 적은 번호면 그 번호에 고정, 없으면 OS 가 준 빈 포트 */
async function startPort(name) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return pickPort({});
  const from = Number(raw);
  if (!Number.isInteger(from) || from < 1 || from > 65535) throw new Error(`${name}=${raw} 는 포트 번호가 아니다`);
  return pickPort({ from, strict: true });
}

async function start() {
  if (!existsSync(API_MAIN) || !existsSync(join(WEB_DIR, ".next"))) {
    complain("빌드 결과가 없다 — 먼저 pnpm build 를 돌린다");
    process.exit(1);
  }
  let webPort;
  let apiPort;
  try {
    webPort = await startPort("FORTUNA_WEB_PORT");
    apiPort = await startPort("FORTUNA_API_PORT");
    // OS 가 두 번 모두 같은 번호를 줄 수는 있으므로 서버 쪽을 다시 받는다
    while (apiPort === webPort && !process.env.FORTUNA_API_PORT) apiPort = await pickPort({});
    if (apiPort === webPort) throw new Error(`FORTUNA_WEB_PORT 와 FORTUNA_API_PORT 가 같은 번호(${webPort})다`);
  } catch (error) {
    complain(error.message);
    process.exit(1);
  }

  const api = run("api", API_MAIN, [], {
    cwd: API_DIR,
    env: childEnv(process.env, { PORT: String(apiPort), FORTUNA_STRICT_PORT: "1", FORTUNA_MODE: "start" }),
  });
  fatalOnExit(api);
  const web = run("web", binOf(WEB_DIR, "next", "next"), ["start", "-p", String(webPort)], {
    cwd: WEB_DIR,
    env: childEnv(process.env, { PORT: String(webPort), API_ORIGIN: `http://127.0.0.1:${apiPort}` }),
  });
  fatalOnExit(web);

  await announce(webPort, apiPort);
}

const mode = process.argv[2];
if (mode === "dev") await dev();
else if (mode === "start") await start();
else {
  complain("쓰는 법: node tools/launch/launch.mjs <dev|start>");
  process.exit(2);
}
