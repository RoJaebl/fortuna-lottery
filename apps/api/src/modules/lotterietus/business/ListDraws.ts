import { Inject, Injectable } from "@nestjs/common";
import type { Draw } from "../domain/model/Draw.model.js";
import { DRAW_DATA, type DrawDataPort } from "../domain/port/DrawDataPort.js";

/** 과거 회차 전부 — 회차 오름차순, 마지막 원소가 최신 회차 */
@Injectable()
export class ListDraws {
  constructor(@Inject(DRAW_DATA) private readonly drawData: DrawDataPort) {}

  execute(): Promise<readonly Draw[]> {
    return this.drawData.getAllDraws();
  }
}
