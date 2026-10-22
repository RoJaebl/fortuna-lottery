import { describe, expect, it } from "vitest";
import { canReach, infraKeyOf, keyPrefixOf, ownerPathOf } from "./paths.mjs";

describe("paths", () => {
  it("소유 폴더 경로는 괄호를 빼고 정의 폴더(_state·_action)를 세지 않는다", () => {
    expect(ownerPathOf("C:\\repo\\apps\\web\\src\\app\\documents\\[id]\\_state\\panel.state.ts")).toBe("documents.[id]");
    expect(ownerPathOf("/repo/apps/web/src/widgets/DocumentPreview/state/zoom.state.ts")).toBe("widgets.DocumentPreview");
    expect(ownerPathOf("/repo/apps/web/src/app/(home)/GeneratorCard/GeneratorCard.presenter.ts")).toBe("home.GeneratorCard");
    expect(ownerPathOf("/r/src/app/(home)/PicksCard/_action/picks.state.ts")).toBe("home.PicksCard");
    expect(keyPrefixOf("/r/src/app/(home)/_state/combination.state.ts", "state")).toBe("state.home.");
    expect(keyPrefixOf("/r/src/app/(home)/PicksCard/_action/picks.state.ts", "api")).toBe("api.home.PicksCard.");
  });

  it("infra key 는 infrastructure/<이름>/ 의 파일만 정의하고 그 이름을 그대로 쓴다", () => {
    expect(infraKeyOf("C:\\r\\src\\infrastructure\\http\\http.state.ts")).toBe("infra.http");
    expect(infraKeyOf("/r/src/app/(home)/_state/combination.state.ts")).toBeNull();
  });

  it("자기 폴더와 조상 폴더의 key 에만 닿고, 앞부분은 마디 단위로 잰다", () => {
    const presenter = "/r/src/app/(home)/GeneratorCard/GeneratorCard.presenter.ts";
    expect(canReach("state.home.combination", presenter)).toBe(true);
    expect(canReach("state.home.GeneratorCard.mode", presenter)).toBe(true);
    expect(canReach("state.home.PicksCard.draft", presenter)).toBe(false);
    expect(canReach("state.documents.selection", "/r/src/app/documentsArchive/Archive.presenter.ts")).toBe(false);
    expect(canReach("api.home.PicksCard.picks", "/r/src/app/(home)/ResultsCard/ResultsCard.presenter.ts")).toBe(false);
  });

  it("event 는 범위 밖에서도, infra 는 어디서나 닿는다", () => {
    expect(canReach("event.home.PicksCard.changed", "/r/src/app/(home)/ResultsCard/_action/check.state.ts")).toBe(true);
    expect(canReach("infra.http", "/r/src/app/(home)/PicksCard/_action/picks.state.ts")).toBe(true);
  });
});
