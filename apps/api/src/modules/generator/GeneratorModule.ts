import { Module } from "@nestjs/common";
import { GenerateCombination } from "./business/GenerateCombination.js";
import { RNG } from "./domain/port/RandomPort.js";
import { GeneratorController } from "./interface/api/GeneratorController.js";
import { GeneratorFacade } from "./interface/facade/GeneratorFacade.js";

@Module({
  controllers: [GeneratorController],
  providers: [GeneratorFacade, GenerateCombination, { provide: RNG, useValue: Math.random }],
  exports: [GeneratorFacade],
})
export class GeneratorModule {}
