import { Inject, Injectable } from "@nestjs/common";
import type { User } from "../../domain/model/User.model.js";
import { IDENTITY_PORT, type IdentityPort } from "../../domain/port/IdentityPort.js";

/** identity 가 밖에 한 약속 — 화면이 부르지 않으므로 컨트롤러가 없고, 다른 모듈이 자기 포트로 받는다 */
@Injectable()
export class IdentityFacade {
  constructor(@Inject(IDENTITY_PORT) private readonly identity: IdentityPort) {}

  currentUser(): Promise<User> {
    return this.identity.currentUser();
  }
}
