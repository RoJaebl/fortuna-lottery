import { Global, Module, type Type } from "@nestjs/common";
import { GeneratorModule } from "../modules/generator/GeneratorModule.js";
import { IdentityModule } from "../modules/identity/IdentityModule.js";
import { IdentityFacade } from "../modules/identity/interface/facade/IdentityFacade.js";
import { CURRENT_USER, type CurrentUserPort } from "../modules/picks/domain/port/CurrentUserPort.js";
import { PicksModule } from "../modules/picks/PicksModule.js";

/**
 * 조립 루트 — 서비스에 하나. 포트에 facade 를 꽂는 유일한 자리다(backend-module-layout 규칙 7절).
 * 모듈 등록도 여기서 한다 — app.module 은 조립 루트만 import 한다.
 */
@Global()
@Module({
  imports: [IdentityModule, GeneratorModule, PicksModule],
  providers: [
    // picks 가 필요로 하는 「현재 사용자」는 identity 가 준다
    { provide: CURRENT_USER, useExisting: IdentityFacade satisfies Type<CurrentUserPort> },
  ],
  exports: [CURRENT_USER],
})
export class CompositionModule {}
