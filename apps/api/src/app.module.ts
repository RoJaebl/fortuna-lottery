import { Module } from "@nestjs/common";
import { CompositionModule } from "./composition/CompositionModule.js";
import { HealthModule } from "./infrastructure/http/HealthModule.js";

@Module({ imports: [CompositionModule, HealthModule] })
export class AppModule {}
