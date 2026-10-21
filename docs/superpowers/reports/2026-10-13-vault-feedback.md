# vault 골조 문서에 보고할 것

골조 정렬 작업(2026-10-13)에서 드러난 골조 문서의 빈자리와 어긋남이다. vault 사본은 이 저장소에서 고치지 않았다.
각 항목은 문서·절, 지금 문구가 말하는 것, 이 저장소에서 드러난 문제, 제안 순이다.

## 1. 들어오는 비HTTP 자리의 폴더가 없다

- 문서·절: backend-module-layout §2 (계층 표).
- 지금 문구: `interface/` 아래에 `api` 와 `facade` 만 있다.
- 문제: 수집 스케줄러(타이머)가 들어오는 자리인데 둘 어디에도 맞지 않는다.
- 제안: `interface/schedule/` 을 더하고 `interface/api` 와 같은 의존 규칙을 준다. 이 저장소는 depcruise 의 `api-imports-no-module` 을 `schedule` 에도 건다.

## 2. `interface/api` 가 `infrastructure/` 를 볼 수 없다

- 문서·절: backend-module-layout §2 표.
- 지금 문구: `interface/api` 가 볼 수 있는 것에 `infrastructure/` 가 없다.
- 문제: 컨트롤러가 요청 검사에 `infrastructure/http/parseRequest` 를 쓴다. 표대로면 컨트롤러마다 같은 검사를 되풀이해야 한다.
- 제안: `interface/api` 가 `infrastructure/http` 를 볼 수 있다고 표에 적거나, 요청 검사 도구가 놓일 자리를 따로 정한다.

## 3. `config` 를 보는 자리가 `interface/facade/` 하나로 적혀 있다

- 문서·절: backend-module-layout 119~120 행 근방.
- 지금 문구: `config` 는 `interface/facade/` 만 본다.
- 문제: `interface/schedule/` 의 스케줄러가 켜짐 여부를 `CONFIG` 에서 읽는다.
- 제안: 들어오는 자리(`schedule`)도 `config` 를 볼 수 있다고 적는다.

## 4. 「business·context → domain/adapter 금지」 규칙이 없다

- 문서·절: boundary-enforcement §3.
- 지금 문구: 어댑터를 `business`·`context` 가 가져오면 안 된다는 규칙이 없다.
- 문제: 이 저장소는 `business-must-not-reach-adapter` 를 더했다. 시험 파일도 예외로 두지 않았고, `picks` 의 `business/` 시험 셋은 공용 `business/fakePickRepository.test-helper.ts`(포트를 구현하고 어댑터는 가져오지 않는다)를 쓰게 다시 썼다.
- 제안: 같은 규칙을 §3 에 싣고 시험 파일을 예외로 두지 않는다고 적는다.

## 5. 뷰 폴더 공개 표면 규칙의 설정 전문이 없다

- 문서·절: boundary-enforcement §4, fractal-view-promotion §7.
- 지금 문구: §4 에 그 ESLint 규칙의 설정 전문이 없고, §7 은 「이 규칙이 아예 없다」고 적는다.
- 문제: 이 저장소는 규칙을 세웠다. 규칙은 상대 경로뿐 아니라 `@/` 별칭 import 도 잡아야 새지 않는다.
- 제안: 설정 전문을 §4 에 싣고 §7 의 문구를 고친다. `@/` 별칭 일치를 명시한다.

## 6. 빌드 서버 모드에서 화면이 서버 주소를 받는 법이 없다

- 문서·절: launcher-ports (빌드 서버).
- 지금 문구: 빌드 서버는 혼자 뜨는 서버를 전제한다.
- 문제: 화면과 서버가 짝으로 뜨는 빌드 모드에서 화면이 서버 주소를 받을 길이 없다. `next.config` 의 `rewrites` 는 빌드 때 굳어 런타임 포트를 못 받는다.
- 제안: 서버 주소를 `API_ORIGIN` 으로 런타임에 넘기고, 화면은 경로 처리기가 요청마다 읽어 프록시하는 방식을 싣는다.

## 7. 실제 서비스에서 운영자 포트는 고정이어야 한다

- 문서·절: launcher-ports (포트 선택).
- 지금 문구: 쥐인 포트는 피해 올려 간다.
- 문제: `pnpm start` 에서 운영자가 `FORTUNA_WEB_PORT`·`FORTUNA_API_PORT` 로 적은 포트를 조용히 바꾸면 앞단 설정과 어긋난다.
- 제안: 운영자가 적은 포트는 고정하고 쥐여 있으면 실패한다고 구분해 적는다. 피해 가기는 dev 에 한정한다.
- **철회(2026-10-14).** 사람의 결정으로 `pnpm start` 도 규약대로 적은 번호부터 피해 간다(`../editor` 의 dev-ports 와 같다). 올리지 않는다.

## 8. `DocumentOutlineReadModel` 접미사가 규칙인지 불명확하다

- 문서·절: model-vocabulary §7.
- 지금 문구: 예에서 `DocumentOutlineReadModel` 이름을 쓴다.
- 문제: `*ReadModel` 접미사가 규칙인지 예일 뿐인지 알 수 없다. 이 저장소는 옛 접미사 표를 버렸다.
- 제안: 접미사가 규칙인지 밝히고, 아니면 예의 이름을 접미사 없는 것으로 바꾼다.

## 9. 캐시 도구의 `invalidate` 가 `Q = void` 일 때 새로 받지 않는다

- 문서·절: frontend-module-layout §3.1 (전문 199 행 근방의 캐시 도구 목록).
- 지금 문구: 규격 코드가 `if (watchers.has(key) && query !== undefined) void fetchInto(key, query)` 로 갈라 다시 받는다(frontend-module-layout 226 행 근방). 조건이 `void` 인 캐시는 값이 늘 `undefined` 라 이 줄이 다시 받지 못한다.
- 문제: 입력이 없는 캐시(`Q = void`)는 `query` 가 늘 `undefined` 라서 지우기만 하고 다시 받지도 알리지도 않는다.
- 제안: 조건을 `queries.has(key)` 로 바꾼다. 이 저장소는 `serverCache.ts` 에서 고쳤고 회귀 시험을 더했다.

## 10. dev 런처는 서버가 죽어도 화면을 둔다

- 문서·절: launcher-ports §5·§7.
- 지금 문구: 문서와 일치한다. dev 에서 응용 서버가 죽으면 화면을 올려 두고 다음 빌드 결과로 서버를 다시 띄운다.
- 문제: 어긋남은 없고 알려 둘 한계가 있다. 런처 자신이 SIGKILL 을 받으면 정리 코드가 돌지 못해 자식이 남을 수 있다. 이는 `.claude/context/launcher-ports.md` 에 적었다.
- 제안: §5 에 SIGKILL 은 잡을 수 없다는 한계를 한 줄 더한다.

## 11. 규격 `FetchHttpClient` 는 서버 본문의 오류 문구를 버린다

- 문서·절: [frontend-app-layers §4.2 `infrastructure/` — 앱이 쓸 구현](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#42-infrastructure--앱이-쓸-구현>) (HTTP 클라이언트 규격 코드).
- 지금 문구: 응답이 실패하면 ``if (!res.ok) throw new Error(`${res.status} ${path}`)`` 로 상태 코드와 경로만 담아 예외를 던진다.
- 문제: 계약이 「도메인 실패는 메시지를 실은 400」을 정한 저장소에서는 서버가 준 문구가 사라져 화면에 보일 문구가 없다.
- 제안: 실패 응답의 본문에서 오류 문구를 꺼내 예외 메시지로 쓰도록 규격 코드에 싣는다. 이 저장소는 `infrastructure/http` 에서 그렇게 했다.

## 12. 규격 §3.2 예의 `useSyncExternalStore` 에 `getServerSnapshot` 이 없다

- 문서·절: frontend-module-layout §3.2 (조회 action 의 훅 예).
- 지금 문구: `useSyncExternalStore` 에 구독 함수와 읽기 함수 둘만 넘긴다.
- 문제: Next 가 서버에서 그릴 때 셋째 인자가 없으면 렌더가 실패한다.
- 제안: 예에 서버 스냅샷(서버에서는 값 없음)을 셋째 인자로 더한다. 이 저장소의 훅은 `readOnServer` 를 넘긴다.

## 13. `Container` 에 훅 없이 꺼내는 길이 없다

- 문서·절: [frontend-app-layers §5.3 컨테이너를 내리는 자리 — 앱과 시험](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#53-컨테이너를-내리는-자리--앱과-시험>).
- 지금 문구: 시험이 `deps` 로 가짜 HTTP 를 꺼내는 길만 적는다.
- 문제: 훅 없이 등록된 캐시·요청을 꺼내는 길이 없다. 전파 규칙 시험이 그 길을 필요로 한다.
- 제안: `Container` 에 `resolve(key)` 를 더한다. 이 저장소는 그렇게 했다.

## 14. 라우트 폴더 `index.ts` 가 뷰 폴더 공개 표면 규칙과 부딪친다

- 문서·절: [frontend-app-layers §7 주소 — store 의 route 영역](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#7-주소--store-의-route-영역>), [boundary-enforcement §4 코드 모양 규칙 — ESLint](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#4-코드-모양-규칙--eslint>).
- 지금 문구: 라우트 폴더 `index.ts` 가 자식 뷰 폴더의 `_action/` 을 직접 짚게 한다.
- 문제: 그 꼴은 뷰 폴더 공개 표면 규칙(`VIEW_FOLDER_SURFACE`)과 부딪친다. 경계 검사 장이 이 겹침을 다루지 않는다.
- 제안: 라우트 폴더 `index.ts` 를 그 규칙의 예외로 적는다. 이 저장소는 `src/app/**/index.ts` 를 예외로 두었다.

## 15. ESLint 전문의 첫 블록이 `shared/lib/store` 자신의 시험을 잡는다

- 문서·절: [boundary-enforcement §4 코드 모양 규칙 — ESLint](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/boundary-enforcement.md#4-코드-모양-규칙--eslint>), [frontend-app-layers §4.1 shared/lib/store/ — 범용 store](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-app-layers.md#41-sharedlibstore--범용-store>).
- 지금 문구: 첫 블록이 `src/**` 전체에 `useStore` 금지와 최상단 등록 선택자를 건다.
- 문제: `shared/lib/store` 자신의 시험이 걸린다.
- 제안: store 시험을 그 블록의 예외로 적는다. 이 저장소는 시험 파일 하나에서 `no-restricted-syntax` 를 껐다.

## 16. state 의 등록부 값이 값 타입이면 바꾸는 함수의 타입이 나오지 않는다

- 문서·절: [frontend-shared-state §2 정의는 _state 파일이 한다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-shared-state.md#2-정의는-_state-파일이-한다>), [§4 presenter 가 쓰는 법](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-shared-state.md#4-presenter-가-쓰는-법>).
- 지금 문구: 등록부에 `'state.documents.selection': readonly DocumentPath[]` 처럼 값 타입을 올리고, `useStoreState` 가 「[값, 바꾸는 함수들] — 타입은 key 에서 나온다」고 적는다.
- 문제: 등록부에 값 타입만 있으면 바꾸는 함수의 이름과 인자 타입을 key 에서 얻을 길이 없다. 또 정의를 인라인 객체로 넘기면 바꾸는 함수의 첫 인자(`now`)에 문맥 타입이 없어 암묵적 `any` 가 된다.
- 제안: 등록부 값을 정의 자체로 정한다. 이 저장소는 정의를 `const x = { initial, actions } satisfies StateDef<값>` 으로 짓고 `'state.home.combination': typeof x` 를 올린 뒤 `store.state(key, x)` 로 등록한다. 규약 층이 등록부 값에서 값 타입과 바꾸는 함수 타입을 뽑아 `useStoreState`·`c.resolve` 의 반환 타입을 짓는다.

## 17. 엔진의 등록 함수 하나로는 event 영역의 등록 함수 셋을 낼 수 없다

- 문서·절: [frontend-store §1 독립 라이브러리 다섯 — shared/lib](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-store.md#1-독립-라이브러리-다섯--sharedlib>), [§2 영역 — store 와 독립 라이브러리를 잇는 연결부](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-store.md#2-영역--store-와-독립-라이브러리를-잇는-연결부>).
- 지금 문구: 「꽂은 이름이 곧 등록 함수의 이름이 된다 — store.<영역 이름>(key, 정의)」. 그런데 event 영역은 `store.event`·`store.invalidates`·`store.unaffected` 셋으로 등록한다. `defineArea` 의 `describe(key, def)` 는 key 하나를 찍는다.
- 문제: 영역 하나가 등록 함수 하나만 가지므로 `invalidates(사건, 캐시, meta)` 꼴이 엔진에서 나오지 않는다. 사건 아래에 그 규칙을 다는 출력도 key 하나만 보는 `describe` 로는 지을 수 없다. `emit` 이 등록된 사건을 확인하려면 http 영역이 event 영역의 정의를 보아야 하는데 `build(def, ctx)` 는 자기 정의만 받는다.
- 제안: 셋 중 하나를 문서에 정한다. 이 저장소는 (1) `framework/index.ts` 가 `invalidates`·`unaffected` 를 「사건 → 캐시」 key 의 event 정의로 바꿔 넘기고, (2) `describe` 를 영역의 정의 전부를 받는 꼴로 넓히고, (3) event 영역의 `attach` 가 컨테이너마다 등록된 사건을 기억해 http 영역의 `emit` 이 그것을 확인하게 했다. 세 일 모두 규약 층 안에서 끝나고 엔진은 영역 이름을 모른다.

## 18. `describeWithUsage()` 가 `import.meta.url` 로 소스 뿌리를 찾으면 시험 러너에서 실패한다

- 문서·절: [frontend-store §3 규약 층 — framework/](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-store.md#3-규약-층--framework>), [frontend-shared-state §6 store 출력이 쓰는 곳까지 적는다](<C:/Users/hnpark/orca/workspaces/vaults/global/docs/context/architecture/frontend/frontend-shared-state.md#6-store-출력이-쓰는-곳까지-적는다>).
- 지금 문구: 「소스를 훑는 일은 paths.mjs 를 쓴다. 시험만 부른다」. 소스 뿌리를 찾는 법은 적지 않는다.
- 문제: 화면 시험은 jsdom 환경에서 돌고, 거기서 `import.meta.url` 은 `file:` 이 아니라 `fileURLToPath` 가 실패한다.
- 제안: 시험 러너가 넣어 주는 `__dirname` 으로 찾는다고 적는다. 이 저장소의 `framework/describe.ts` 가 그렇게 한다.
