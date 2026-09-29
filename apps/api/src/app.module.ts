import { Controller, Get, Module } from "@nestjs/common";
import { CompositionModule } from "./composition/CompositionModule.js";

export const GLOBAL_PREFIX = "api";

/** 살아 있는지만 답한다. 도메인이 아니므로 모듈을 만들지 않고 여기 둔다 */
@Controller()
class HealthController {
  @Get("health")
  health() {
    return { ok: true };
  }
}

@Module({ imports: [CompositionModule], controllers: [HealthController] })
export class AppModule {}
