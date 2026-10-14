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
  올려 첫 빈 포트(최대 20 개). 빈 포트는 `127.0.0.1` 과 `::` 양쪽에서 열려야 한다 — `next`·`nest` 는 `::` 에
  서는데 윈도우는 `::` 가 쥐여 있어도 `127.0.0.1` 을 따로 열어 주므로, 한쪽만 보면 쥔 포트를 빈 것으로 읽는다.
- `env.mjs` — `childEnv(base, extra)`. 사람의 셸에 남은 `PORT`·`HOST` 를 지우고 서비스마다 따로 채운다.
- 시험은 `pnpm test:tools`(`node --test`)이고 `pnpm check` 끝에 들어 있다.
- 자식은 셸을 거치지 않고 `node <패키지의 bin 파일>` 로 띄운다. `next`·`@nestjs/cli` 의 `package.json` `bin` 을 그 앱 폴더
  기준으로 찾으므로 운영체제마다 다른 `.bin` 껍데기(sh·`.cmd`)에 기대지 않는다. 자식 출력은 줄마다 `[web]`·`[api]`·`[watch]`
  이름표를 붙여 넘기고, 화면 지우기 제어열은 걷어 낸다.
- 두 서버가 선 뒤 알리는 것은 한 줄뿐이다: `화면 http://127.0.0.1:<web>/ · 서버 http://127.0.0.1:<api>/api`.

| 명령 | 화면 포트 | 서버 포트 | 서버의 `FORTUNA_MODE` | 다시 띄우기 |
|---|---|---|---|---|
| `pnpm dev` | 3000 부터 빈 포트, `FORTUNA_DEV_WEB_PORT` 를 적으면 그 번호 고정 | 4000 부터 빈 포트, `FORTUNA_DEV_API_PORT` 를 적으면 그 번호 고정 | `dev`(스케줄러 꺼짐) | 런처가 `apps/api/dist` 를 지켜보다 300 ms 조용해지면 |
| `pnpm start` | OS 포트, `FORTUNA_WEB_PORT` 를 적으면 그 번호부터 빈 포트 | OS 포트, `FORTUNA_API_PORT` 를 적으면 그 번호부터 빈 포트 | `start`(스케줄러 켜짐) | 없음 |

## 환경 이름

| 이름 | 넘기는 쪽 | 받는 쪽 | 뜻 |
|---|---|---|---|
| `PORT` | 런처 | 화면 · 서버 | 설 포트. 서버는 혼자 뜨면 기본 4000, 화면은 `next dev/start -p <PORT>` 로 받는다. 사람의 셸에 있는 값은 런처가 지운다 |
| `API_ORIGIN` | 런처 | 화면의 `/api/*` 경로 처리기 | 서버 주소 `http://127.0.0.1:<서버 포트>`. 요청마다 읽는다. 없으면 `http://127.0.0.1:4000` |
| `FORTUNA_STRICT_PORT` | 런처 | 서버 | `1` 이면 `PORT` 를 옮기지 않고, 쥐여 있으면 5 번 시도(약 4 초)한 뒤 `EADDRINUSE` 로 죽는다 |
| `FORTUNA_MODE` | 런처 | 서버 | `dev`·`start`. 스케줄러 기본값을 정한다. `SCHEDULER_ENABLED` 를 적으면 그 값이 이긴다 |
| `FORTUNA_DEV_WEB_PORT` | 사람 | 런처(`dev`) | 화면이 설 포트. 쥐여 있으면 실패한다 |
| `FORTUNA_DEV_API_PORT` | 사람 | 런처(`dev`) | 서버가 설 포트. 쥐여 있으면 실패한다. `editor` 의 `DEV_WEB_PORT`·`DEV_API_PORT` 와 겹치지 않게 접두를 붙였다 — `editor` 의 `pnpm dev` 는 그 값을 자식 환경에 넣으므로 거기서 연 터미널이 물려받는다 |
| `FORTUNA_WEB_PORT` | 운영자 | 런처(`start`) | 화면이 찾기 시작할 포트 |
| `FORTUNA_API_PORT` | 운영자 | 런처(`start`) | 서버가 찾기 시작할 포트 |
| `DATABASE_URL` | 사람(적지 않아도 된다) | 런처의 DB 준비 · 서버 | SQLite 주소. 없으면 `file:./fortuna.db` |

`FORTUNA_PUBLIC_URL`(규약 §3)은 지금 소비자가 없어 두지 않는다. `HOST` 는 런처가 지우기만 한다.

## `pnpm dev`

1. 공용 패키지를 한 번 빌드한다(`pnpm --filter "./packages/*" build`). 패키지는 감시하지 않는다 — 계약을 고치면 다시 띄운다.
2. 화면 3000·서버 4000 에서 시작해 빈 포트를 고른다. 두 찾는 범위(20 개)는 겹치지 않는다. 이어서 DB 를 준비한다(아래 「DB 준비」).
3. 지난 `apps/api/dist` 를 지우고 `nest build --watch` 를 띄운다. 감시자가 첫 바퀴를 마쳐 `dist` 가 조용해지고
   `dist/main.js` 가 있으면 `node dist/main.js` 를 띄우고, 그 뒤로 `dist` 가 바뀔 때마다 조용해진 뒤 한 번 끄고 다시 띄운다.
   `dist` 가 잠시 사라져도 다시 생기면 이어서 지켜본다. `nest start --watch`·`node --watch` 는 쓰지 않는다.
4. 화면은 `next dev -p <web>` 이다.
5. 서버가 죽어도 화면과 감시자는 멈추지 않고 「서버가 끝났다(코드 n) — 소스를 고치면 다시 띄운다」 한 줄을 적는다. 그동안
   화면의 `/api/*` 는 503 이다. 감시자나 화면이 죽으면 나머지도 내리고 그 코드로 나간다.

## `pnpm start`

`pnpm build` 뒤 빌드 결과(`apps/api/dist/main.js`, `apps/web/.next`)로 두 서버를 띄운다. 빌드 결과가 없으면 「먼저 pnpm build
를 돌린다」로 끝난다. 포트를 고른 뒤 DB 를 준비하고(아래 「DB 준비」) 두 서버를 띄운다. 어느 자식이든 끝나면 나머지도 내리고
그 코드로 나간다.

- 포트를 적지 않으면 두 서버 모두 OS 가 준 빈 포트에 선다(규약 §2 빌드 서버). 서버 주소는 `API_ORIGIN` 으로 화면에 넘긴다 —
  화면의 경로 처리기가 요청마다 읽으므로 빌드 결과 하나를 어느 포트 조합에서도 쓸 수 있다.
- `FORTUNA_WEB_PORT`·`FORTUNA_API_PORT` 를 적으면 그 번호부터 쥔 포트를 피해 간다(규약 §2, `../editor` 의 dev-ports 와 같다).
  두 번호의 찾는 범위가 겹쳐 같은 번호가 나오면 서버 쪽을 그다음 빈 포트로 옮긴다.
- 규약의 빌드 서버는 「혼자 뜨는 서버」를 전제하지만 여기서는 화면과 서버가 짝으로 뜬다. 화면이 서버 주소를 받는 길은
  `API_ORIGIN` 이다. 이 이탈은 vault 에 보고할 목록에 올라 있다.

## DB 준비 — Docker 없이 SQLite

`pnpm dev`·`pnpm start` 는 서버를 띄우기 전에 `apps/api` 에서 Prisma CLI 를 세 번 돈다. 출력에는 `[db]` 이름표가 붙고, 어느
쪽이든 실패하면 「DB 준비(prisma …)에 실패했다」를 적고 1 로 나간다.

1. `prisma generate` — 클라이언트를 지금 스키마로 다시 짓는다. `pnpm install` 때만 돌던 단계라, 스키마를 바꾼 커밋을 받은
   체크아웃이 옛 클라이언트로 남아 「the URL must start with the protocol `postgresql://`」 같은 500 을 냈다.
2. `prisma migrate deploy` — 마이그레이션을 적용한다. 파일이 없으면 만든다.
3. `prisma db execute --file prisma/seed.sql` — 회차 1~1245 를 `INSERT OR IGNORE` 로 넣는다. 이미 있는 회차는 건너뛰므로
   매번 돌려도 같다.

`DATABASE_URL` 이 없으면 런처와 서버(`apps/api/src/config.ts` 의 `DEFAULT_DATABASE_URL`)가 같은 값 `file:./fortuna.db` 를
쓴다. SQLite 의 상대 경로는 `schema.prisma` 기준이므로 어느 작업 디렉터리에서 띄워도 `apps/api/prisma/fortuna.db` 다.
두 자리의 값은 손으로 맞춘다 — 런처는 `.mjs` 라 서버의 TS 상수를 가져오지 못한다.

## 끄기

`SIGINT`·`SIGTERM`·`SIGHUP`(터미널·편집기 탭을 닫을 때) 을 받으면 자식에게 넘기고 모두 끝난 뒤 0 으로 나간다. 자식은 윈도우
밖에서 `detached` 로 띄워 프로세스 묶음째 `SIGTERM` 으로 끄고(`next` 의 일꾼 프로세스까지), 묶음이 빌 때까지 기다린다. 윈도우에서는
`taskkill /t /f` 로 나무째 끈다.

- 끄는 중에 신호가 한 번 더 오거나 5 초가 지나도 남은 묶음은 `SIGKILL` 로 끄고 나간다(두 번째 신호면 코드 1).
- 런처 자신의 오류(띄우는 도중의 예외, 처리되지 않은 거부 — 예: 3000~3099 가 모두 쥐여 있음)는 까닭 한 줄을 적고 자식을 내린 뒤 1 로 나간다.
- 어떤 길로 끝나든 `exit` 처리기가 남은 묶음을 `SIGKILL` 로 끈다. **런처 자신이 `SIGKILL` 을 받으면 이것도 돌지 않으므로 자식이 남는다** —
  그때는 3000·4000 을 쥔 지난 프로세스를 손으로 끈다(그대로 두면 다음 `pnpm dev` 가 3001·4001 로 올라간다).
- `next` 가 끝날 때 띄우는 원격 측정 전송(`next/dist/telemetry/detached-flush.js`)은 `next` 가 스스로 떼어 낸 프로세스라 묶음에 들지 않는다.
  포트를 쥐지 않고 곧 스스로 끝난다.
