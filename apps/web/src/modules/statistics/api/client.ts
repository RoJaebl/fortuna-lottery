import type { StatisticsResponse } from "@fortuna-lottery/core/statistics/dto";
import { apiGet } from "@/shared/lib/fetcher";
import { assembleStatistics } from "../transport/assembler/statistics-response.assembler";
import type { StatisticsModel } from "../model/statistics.model";

export async function fetchStatistics(): Promise<StatisticsModel> {
  return assembleStatistics(await apiGet<StatisticsResponse>("/api/statistics"));
}
