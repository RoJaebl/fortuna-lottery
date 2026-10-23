import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { IdentityModule } from "./IdentityModule.js";
import { IDENTITY_PORT, type IdentityPort } from "./domain/port/IdentityPort.js";
import { IdentityFacade } from "./interface/facade/IdentityFacade.js";

describe("IdentityModule", () => {
  it("MVP 에서는 게스트 사용자를 돌려준다", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [IdentityModule] }).compile();

    const user = await moduleRef.get(IdentityFacade).currentUser();

    expect(user).toEqual({ id: "guest", isGuest: true });
  });

  it("돌려준 사용자는 어댑터의 객체와 다른 참조다", async () => {
    const adapterUser = { id: "guest", isGuest: true } as const;
    const moduleRef = await Test.createTestingModule({ imports: [IdentityModule] })
      .overrideProvider(IDENTITY_PORT)
      .useValue({ currentUser: async () => adapterUser } satisfies IdentityPort)
      .compile();

    const user = await moduleRef.get(IdentityFacade).currentUser();

    expect(user).toEqual(adapterUser);
    expect(user).not.toBe(adapterUser);
  });
});
