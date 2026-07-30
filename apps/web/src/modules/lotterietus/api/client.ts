import type { LotterietusStatusResponse } from "@fortuna-lottery/core/lotterietus/dto";
import { apiGet } from "@/shared/lib/fetcher";
import { assembleLotterietusStatus } from "../transport/assembler/lotterietus.assembler";
import type { LotterietusModel } from "../model/lotterietus.model";

export async function fetchLotterietusStatus(): Promise<LotterietusModel> {
  return assembleLotterietusStatus(await apiGet<LotterietusStatusResponse>("/api/lotterietus"));
}
