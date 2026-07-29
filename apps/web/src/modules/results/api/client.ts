import type { ResultsResponse } from "@fortuna-lottery/core/results/dto";
import { apiGet } from "@/shared/lib/fetcher";
import { assembleResults } from "../transport/assembler/results-response.assembler";
import type { ResultsModel } from "../model/results.model";

export async function fetchResults(): Promise<ResultsModel> {
  return assembleResults(await apiGet<ResultsResponse>("/api/results"));
}
