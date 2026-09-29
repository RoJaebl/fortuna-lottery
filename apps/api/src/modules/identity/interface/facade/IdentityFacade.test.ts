import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { IdentityModule } from "../../IdentityModule.js";
import { IdentityFacade } from "./IdentityFacade.js";

describe("IdentityFacade", () => {
  it("MVP 에서는 게스트 사용자를 돌려준다", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [IdentityModule] }).compile();

    const user = await moduleRef.get(IdentityFacade).currentUser();

    expect(user).toEqual({ id: "guest", isGuest: true });
  });
});
