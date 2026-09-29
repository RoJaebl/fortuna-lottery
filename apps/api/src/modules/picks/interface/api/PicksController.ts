import { Body, Controller, Delete, Get, Inject, Param, Post } from "@nestjs/common";
import {
  PicksItemSchema,
  PicksListResponseSchema,
  PicksSaveRequestSchema,
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
    const request = parseRequest(PicksSaveRequestSchema, raw); // 틀리면 400 — 클라이언트 잘못
    return PicksItemSchema.parse(await this.picks.save(request));
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.picks.delete(id); // 삭제 응답은 계약에 스키마가 없다 — { deleted: true } 그대로
  }
}
