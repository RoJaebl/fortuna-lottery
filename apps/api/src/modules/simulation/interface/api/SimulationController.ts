import { Body, Controller, HttpCode, Inject, Post } from "@nestjs/common";
import {
  SimulationBacktestRequestSchema,
  SimulationBacktestResponseSchema,
} from "@fortuna-lottery/contract/simulation";
import { parseRequest } from "../../../../infrastructure/http/parseRequest.js";
import { SimulationFacade } from "../facade/SimulationFacade.js";

@Controller("simulation")
export class SimulationController {
  constructor(@Inject(SimulationFacade) private readonly simulation: SimulationFacade) {}

  @Post()
  @HttpCode(200) // 옛 Next 처리기가 200 을 냈다 — Nest 의 POST 기본값 201 로 바꾸지 않는다
  async backtest(@Body() raw: unknown) {
    const request = parseRequest(SimulationBacktestRequestSchema, raw); // 틀리면 400 — 클라이언트 잘못
    return SimulationBacktestResponseSchema.parse(await this.simulation.backtest(request)); // 틀리면 500 — 서버 결함
  }
}
