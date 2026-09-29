import { Module } from "@nestjs/common";
import { GuestIdentityAdapter } from "./domain/adapter/GuestIdentityAdapter.js";
import { IDENTITY_PORT } from "./domain/port/IdentityPort.js";
import { IdentityFacade } from "./interface/facade/IdentityFacade.js";

@Module({
  providers: [IdentityFacade, { provide: IDENTITY_PORT, useClass: GuestIdentityAdapter }],
  exports: [IdentityFacade],
})
export class IdentityModule {}
