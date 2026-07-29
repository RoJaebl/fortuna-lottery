import type { CountdownResponse } from "@fortuna-lottery/core/countdown/dto";
import type { CountdownModel } from "../../model/countdown.model";

export function assembleCountdown(dto: CountdownResponse): CountdownModel {
  return { nextDrawAt: new Date(dto.nextDrawAt), nextRound: dto.nextRound };
}
