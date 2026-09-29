import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PicksItem, PicksListResponse, PicksSaveRequest } from "@fortuna-lottery/contract/picks";
import { RequestRejected } from "../../../../infrastructure/http/RequestRejected.js";
import { DeletePick } from "../../business/DeletePick.js";
import { ListPicks } from "../../business/ListPicks.js";
import { SavePick } from "../../business/SavePick.js";
import type { Pick } from "../../domain/model/Pick.model.js";
import { CURRENT_USER, type CurrentUserPort } from "../../domain/port/CurrentUserPort.js";

/** 도메인 원형을 계약 모양으로 옮긴다 — userId 는 밖으로 나가지 않는다 */
const toItem = (pick: Pick): PicksItem => ({
  id: pick.id,
  numbers: [...pick.numbers],
  createdAt: pick.createdAt,
});

@Injectable()
export class PicksFacade {
  constructor(
    @Inject(CURRENT_USER) private readonly user: CurrentUserPort,
    @Inject(SavePick) private readonly savePick: SavePick,
    @Inject(ListPicks) private readonly listPicks: ListPicks,
    @Inject(DeletePick) private readonly deletePick: DeletePick,
  ) {}

  async list(): Promise<PicksListResponse> {
    const { id } = await this.user.currentUser();
    return (await this.listPicks.execute(id)).map(toItem);
  }

  async save(request: PicksSaveRequest): Promise<PicksItem> {
    const { id } = await this.user.currentUser();
    const result = await this.savePick.execute(id, request);
    if (!result.ok) throw new RequestRejected(result.error);
    return toItem(result.value);
  }

  async delete(pickId: string): Promise<{ deleted: true }> {
    const { id } = await this.user.currentUser();
    const result = await this.deletePick.execute(id, pickId);
    // 옛 처리기가 404 { error } 를 냈다 — 객체를 넘기면 그 모양 그대로 본문이 된다
    if (!result.ok) throw new NotFoundException({ error: result.error });
    return result.value;
  }
}
