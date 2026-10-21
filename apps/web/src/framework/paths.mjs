// 경로 ↔ state key 규칙의 정본 — 검사기(eslint.config.mjs)·스냅숏 시험(describe.ts)·state 영역이 함께 부른다.
// 이 규칙은 이 파일에만 적는다 (frontend-store §3, frontend-shared-state §3).
// file 은 절대 경로여도 된다. src/app/ 과 src/widgets/ 뒤만 읽는다.

/**
 * 파일이 선 폴더의 소유 폴더 경로 — app/ 아래 폴더 이름을 점으로 잇는다. 라우트 그룹의 괄호는 빼고, 위젯은 widgets. 로 시작한다.
 * 상태 정의 폴더(_state/, 위젯의 state/)는 마디에 들지 않는다.
 *   ".../src/app/documents/[id]/_state/panel.state.ts"     → "documents.[id]"
 *   ".../src/widgets/DocumentPreview/state/zoom.state.ts"  → "widgets.DocumentPreview"
 *   ".../src/app/(home)/GeneratorCard/GeneratorCard.presenter.ts" → "home.GeneratorCard"
 */
export function ownerPathOf(file) {
  const path = file.replaceAll("\\", "/");
  const at = path.match(/(?:^|\/)src\/(app|widgets)\/(.*)$/);
  if (!at) return null;
  const folders = at[2].split("/").slice(0, -1);
  const isWidget = at[1] === "widgets";
  if (folders.at(-1) === (isWidget ? "state" : "_state")) folders.pop();
  const segments = folders.map((name) => name.replace(/^\((.+)\)$/, "$1"));
  return (isWidget ? ["widgets", ...segments] : segments).join(".");
}

/** 그 파일이 등록할 state key 의 앞부분 — 뒤에 이름 마디 하나가 온다 */
export function statePrefixOf(file) {
  return `state.${ownerPathOf(file)}.`;
}

/** 그 파일이 key 에 닿는가 — key 의 소유 폴더 경로가 파일 폴더 경로와 같거나 마디 단위로 그 앞부분이어야 한다 */
export function canReach(key, file) {
  const here = ownerPathOf(file);
  const owner = key.replace(/^state\./, "").split(".").slice(0, -1).join(".");
  return here !== null && owner !== "" && (here === owner || here.startsWith(`${owner}.`));
}
