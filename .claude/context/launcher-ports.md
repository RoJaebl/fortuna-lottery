# 런처와 포트 — `pnpm dev` 와 `pnpm start`

이 저장소가 화면(`apps/web`)과 응용 서버(`apps/api`)를 띄울 때 포트를 고르고 넘기는 법. 규약 자체는 vault 의
[launcher-ports](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/launcher-ports.md>)가 소유하고,
이 문서는 그 규약의 **이 저장소의 실제 이름과 번호**, 그리고 규약에서 벗어난 자리를 적는다. 포트·프록시·다시 띄우기를
고치기 전에 이 문서를 먼저 본다.

## 띄우는 프로그램은 하나다

`tools/launch/launch.mjs` 가 포트를 고르는 유일한 자리다. `pnpm dev` 와 `pnpm start` 가 이것을 부른다. 받는 쪽(화면·서버)은
받은 포트에 서고 옮기지 않는다.

- `ports.mjs` — `isFree(port, host = "127.0.0.1")`, `pickPort({ from?, strict? })`. `from` 이 없으면 OS 가 준 빈 포트,
  `strict` 면 그 번호가 비었을 때만 쓰고 아니면 「포트 <n> 이 이미 쓰이고 있다」로 실패, 그 밖에는 `from` 부터 하나씩
  올려 첫 빈 포트(최대 100 개).
- `env.mjs` — `childEnv(base, extra)`. 사람의 셸에 남은 `PORT`·`HOST` 를 지우고 서비스마다 따로 채운다.
- 시험은 `pnpm test:tools`(`node --test`)이고 `pnpm check` 끝에 들어 있다.
- 자식은 셸을 거치지 않고 `node <패키지의 bin 파일>` 로 띄운다. `next`·`@nestjs/cli` 의 `package.json` `bin` 을 그 앱 폴더
  기준으로 찾으므로 운영체제마다 다른 `.bin` 껍데기(sh·`.cmd`)에 기대지 않는다. 자식 출력은 줄마다 `[web]`·`[api]`·`[watch]`
  이름표를 붙여 넘기고, 화면 지우기 제어열은 걷어 낸다.
- 두 서버가 선 뒤 알리는 것은 한 줄뿐이다: `화면 http://127.0.0.1:<web>/ · 서버 http://127.0.0.1:<api>/api`.

| 명령 | 화면 포트 | 서버 포트 | 서버의 `FORTUNA_MODE` | 다시 띄우기 |
|---|---|---|---|---|
| `pnpm dev` | 3000 부터 빈 포트 | 4000 부터 빈 포트 | `dev`(스케줄러 꺼짐) | 런처가 `apps/api/dist` 를 지켜보다 300 ms 조용해지면 |
| `pnpm start` | `FORTUNA_WEB_PORT` 고정, 없으면 OS 포트 | `FORTUNA_API_PORT` 고정, 없으면 OS 포트 | `start`(스케줄러 켜짐) | 없음 |

## 환경 이름

| 이름 | 넘기는 쪽 | 받는 쪽 | 뜻 |
|---|---|---|---|
| `PORT` | 런처 | 화면 · 서버 | 설 포트. 서버는 혼자 뜨면 기본 4000, 화면은 `next dev/start -p <PORT>` 로 받는다. 사람의 셸에 있는 값은 런처가 지운다 |
| `API_ORIGIN` | 런처 | 화면의 `/api/*` 경로 처리기 | 서버 주소 `http://127.0.0.1:<서버 포트>`. 요청마다 읽는다. 없으면 `http://127.0.0.1:4000` |
| `FORTUNA_STRICT_PORT` | 런처 | 서버 | `1` 이면 `PORT` 를 옮기지 않고, 쥐여 있으면 5 초(1 초 × 5 번) 기다린 뒤 `EADDRINUSE` 로 죽는다 |
| `FORTUNA_MODE` | 런처 | 서버 | `dev`·`start`. 스케줄러 기본값을 정한다. `SCHEDULER_ENABLED` 를 적으면 그 값이 이긴다 |
| `FORTUNA_WEB_PORT` | 운영자 | 런처(`start`) | 화면이 설 고정 포트 |
| `FORTUNA_API_PORT` | 운영자 | 런처(`start`) | 서버가 설 고정 포트 |

`FORTUNA_PUBLIC_URL`(규약 §3)은 지금 소비자가 없어 두지 않는다. `HOST` 는 런처가 지우기만 한다.

## `pnpm dev`

1. 공용 패키지를 한 번 빌드한다(`pnpm --filter "./packages/*" build`). 패키지는 감시하지 않는다 — 계약을 고치면 다시 띄운다.
2. 화면 3000·서버 4000 에서 시작해 빈 포트를 고른다. 두 찾는 범위(100 개)는 겹치지 않는다.
3. 지난 `apps/api/dist` 를 지우고 `nest build --watch` 를 띄운다. 감시자가 첫 바퀴를 마쳐 `dist` 가 조용해지고
   `dist/main.js` 가 있으면 `node dist/main.js` 를 띄우고, 그 뒤로 `dist` 가 바뀔 때마다 조용해진 뒤 한 번 끄고 다시 띄운다.
   `dist` 가 잠시 사라져도 다시 생기면 이어서 지켜본다. `nest start --watch`·`node --watch` 는 쓰지 않는다.
4. 화면은 `next dev -p <web>` 이다.
5. 서버가 죽어도 화면과 감시자는 멈추지 않고 「서버가 끝났다(코드 n) — 소스를 고치면 다시 띄운다」 한 줄을 적는다. 그동안
   화면의 `/api/*` 는 503 이다. 감시자나 화면이 죽으면 나머지도 내리고 그 코드로 나간다.

## `pnpm start` — 고정 포트는 규약에서 벗어난다

`pnpm build` 뒤 빌드 결과(`apps/api/dist/main.js`, `apps/web/.next`)로 두 서버를 띄운다. 빌드 결과가 없으면 「먼저 pnpm build
를 돌린다」로 끝난다. 어느 자식이든 끝나면 나머지도 내리고 그 코드로 나간다.

- 포트를 적지 않으면 두 서버 모두 OS 가 준 빈 포트에 선다(규약 §2 빌드 서버). 서버 주소는 `API_ORIGIN` 으로 화면에 넘긴다 —
  화면의 경로 처리기가 요청마다 읽으므로 빌드 결과 하나를 어느 포트 조합에서도 쓸 수 있다.
- **`FORTUNA_WEB_PORT`·`FORTUNA_API_PORT` 를 적으면 그 번호에 고정으로 서고, 쥐여 있으면 피해 가지 않고 실패한다.**
  규약은 「`PORT` 를 적으면 그 번호부터 피해 간다」고 하지만, `pnpm start` 는 실제 서비스로 띄우는 명령이라 그 앞에 이
  번호를 보는 리버스 프록시나 방화벽 규칙이 있을 수 있다. 조용히 다른 번호로 옮기면 서비스가 끊기므로 의도해서 벗어난다.
- 규약의 빌드 서버는 「혼자 뜨는 서버」를 전제하지만 여기서는 화면과 서버가 짝으로 뜬다. 화면이 서버 주소를 받는 길은
  `API_ORIGIN` 이다. 두 이탈은 vault 에 보고할 목록에 올라 있다.

## 끄기

`SIGINT`·`SIGTERM` 을 받으면 자식에게 넘기고 모두 끝난 뒤 0 으로 나간다. 자식은 윈도우 밖에서 `detached` 로 띄워 프로세스
묶음째 `SIGTERM` 으로 끄고(`next` 의 일꾼 프로세스까지), 윈도우에서는 `taskkill /t /f` 로 나무째 끈다.
