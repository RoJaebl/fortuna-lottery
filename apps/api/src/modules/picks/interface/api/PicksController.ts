import { Body, Controller, Delete, Get, Inject, Param, Post } from "@nestjs/common";
import { z } from "zod";
import {
  PicksCreateRequestSchema,
  PicksCreateResponseSchema,
  PicksDeleteResponseSchema,
  PicksListResponseSchema,
} from "@fortuna-lottery/contract/picks";
import { parseRequest } from "../../../../infrastructure/http/parseRequest.js";
import { PicksFacade } from "../facade/PicksFacade.js";

@Controller("picks")
export class PicksController {
  constructor(@Inject(PicksFacade) private readonly picks: PicksFacade) {}

  @Get()
  async list() {
    return PicksListResponseSchema.parse(await this.picks.list()); // 틀리면 500 — 서버 결함
  }

  @Post() // 옛 Next 처리기가 201 을 냈다 — Nest 의 POST 기본값 그대로다
  async save(@Body() raw: unknown) {
    const request = parseRequest(PicksCreateRequestSchema, raw); // 틀리면 400 — 클라이언트 잘못
    return PicksCreateResponseSchema.parse(await this.picks.save(request));
  }

  @Delete(":id")
  async remove(@Param("id") rawId: string) {
    const id = parseRequest(z.string().min(1), rawId); // 틀리면 400 — 클라이언트 잘못
    return PicksDeleteResponseSchema.parse(await this.picks.delete(id)); // 틀리면 500 — 서버 결함
  }
}
