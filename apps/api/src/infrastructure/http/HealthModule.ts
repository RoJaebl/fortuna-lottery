import { Controller, Get, Module } from "@nestjs/common";

/** 살아 있는지만 답한다. 도메인이 아니므로 모듈의 계층을 두지 않는다 */
@Controller()
class HealthController {
  @Get("health")
  health() {
    return { ok: true };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
