import type { CountdownResponse } from "@fortuna-lottery/core/countdown/dto";
import { apiGet } from "@/shared/lib/fetcher";
import { assembleCountdown } from "../transport/assembler/countdown.assembler";
import type { CountdownModel } from "../model/countdown.model";

export async function fetchCountdown(): Promise<CountdownModel> {
  return assembleCountdown(await apiGet<CountdownResponse>("/api/countdown"));
}
