import { describe, expect, it } from "vitest";
import { canReach, ownerPathOf, statePrefixOf } from "./paths.mjs";

describe("paths", () => {
  it("소유 폴더 경로는 괄호를 빼고 상태 폴더를 세지 않는다", () => {
    expect(ownerPathOf("C:\\repo\\apps\\web\\src\\app\\documents\\[id]\\_state\\panel.state.ts")).toBe("documents.[id]");
    expect(ownerPathOf("/repo/apps/web/src/widgets/DocumentPreview/state/zoom.state.ts")).toBe("widgets.DocumentPreview");
    expect(ownerPathOf("/repo/apps/web/src/app/(home)/GeneratorCard/GeneratorCard.presenter.ts")).toBe("home.GeneratorCard");
    expect(statePrefixOf("/r/src/app/(home)/_state/combination.state.ts")).toBe("state.home.");
  });

  it("자기 폴더와 조상 폴더의 key 에만 닿고, 앞부분은 마디 단위로 잰다", () => {
    const presenter = "/r/src/app/(home)/GeneratorCard/GeneratorCard.presenter.ts";
    expect(canReach("state.home.combination", presenter)).toBe(true);
    expect(canReach("state.home.GeneratorCard.mode", presenter)).toBe(true);
    expect(canReach("state.home.PicksCard.draft", presenter)).toBe(false);
    expect(canReach("state.documents.selection", "/r/src/app/documentsArchive/Archive.presenter.ts")).toBe(false);
  });
});
