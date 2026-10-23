// 경로 ↔ store key 규칙의 정본 — 검사기(eslint.config.mjs)가 부른다.
// 이 규칙은 이 파일에만 적는다 (frontend-store §3, frontend-shared-state §3).
// file 은 절대 경로여도 된다. src/app/·src/widgets/·src/infrastructure/ 뒤만 읽는다.

/**
 * 파일이 선 폴더의 소유 폴더 경로 — app/ 아래 폴더 이름을 점으로 잇는다. 라우트 그룹의 괄호는 빼고, 위젯은 widgets. 로 시작한다.
 * 정의 폴더(_state/·_action/, 위젯의 state/·action/)는 마디에 들지 않는다.
 *   ".../src/app/documents/[id]/_state/panel.state.ts"     → "documents.[id]"
 *   ".../src/widgets/DocumentPreview/state/zoom.state.ts"  → "widgets.DocumentPreview"
 *   ".../src/app/(home)/PicksCard/_action/picks.state.ts"  → "home.PicksCard"
 */
export function ownerPathOf(file) {
  const path = file.replaceAll("\\", "/");
  const at = path.match(/(?:^|\/)src\/(app|widgets)\/(.*)$/);
  if (!at) return null;
  const folders = at[2].split("/").slice(0, -1);
  const isWidget = at[1] === "widgets";
  if ((isWidget ? /^(state|action)$/ : /^_(state|action)$/).test(folders.at(-1))) folders.pop();
  const segments = folders.map((name) => name.replace(/^\((.+)\)$/, "$1"));
  return (isWidget ? ["widgets", ...segments] : segments).join(".");
}

/** 그 파일이 등록할 key 의 앞부분 — 뒤에 이름 마디 하나가 온다. area 는 "state" | "api" | "event" */
export function keyPrefixOf(file, area) {
  return `${area}.${ownerPathOf(file)}.`;
}

/** infrastructure/<이름>/ 의 파일이 등록할 key — 그 밖의 파일이면 null */
export function infraKeyOf(file) {
  const at = file.replaceAll("\\", "/").match(/(?:^|\/)src\/infrastructure\/([^/]+)\//);
  return at ? `infra.${at[1]}` : null;
}

/**
 * 그 파일이 key 에 닿는가 — key 의 소유 폴더 경로가 파일 폴더 경로와 같거나 마디 단위로 그 앞부분이어야 한다.
 * event 는 범위 밖에서도 읽고, infra 는 어디서나 읽는다.
 */
export function canReach(key, file) {
  if (/^(event|infra)\./.test(key)) return true;
  const here = ownerPathOf(file);
  const owner = key.replace(/^(state|api)\./, "").split(".").slice(0, -1).join(".");
  return here !== null && owner !== "" && (here === owner || here.startsWith(`${owner}.`));
}
