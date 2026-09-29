import { Global, Module } from "@nestjs/common";
import { IdentityModule } from "../modules/identity/IdentityModule.js";

/**
 * 조립 루트 — 서비스에 하나. 포트에 facade 를 꽂는 유일한 자리다(backend-module-layout 규칙 7절).
 * 모듈 등록도 여기서 한다 — app.module 은 조립 루트만 import 한다.
 */
@Global()
@Module({ imports: [IdentityModule] })
export class CompositionModule {}
