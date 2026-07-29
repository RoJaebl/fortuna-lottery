import type { CountdownResponse } from "@lotto-lab/core/countdown/dto";
import type { CountdownModel } from "../../model/countdown.model";

export function assembleCountdown(dto: CountdownResponse): CountdownModel {
  return { nextDrawAt: new Date(dto.nextDrawAt), nextRound: dto.nextRound };
}
