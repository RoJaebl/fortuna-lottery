import { Global, Module } from "@nestjs/common";

/**
 * 조립 루트 — 서비스에 하나. 포트에 facade 를 꽂는 유일한 자리다(backend-module-layout 규칙 7절).
 * 아직 옮긴 모듈이 없어 비어 있다.
 */
@Global()
@Module({})
export class CompositionModule {}
