import type { ResultsCheckResponse } from "@fortuna-lottery/contract/results";
import { apiGet } from "@/shared/lib/fetcher";
import { assembleResults } from "../transport/assembler/results-response.assembler";
import type { ResultsModel } from "../model/results.model";

export async function fetchResults(): Promise<ResultsModel> {
  return assembleResults(await apiGet<ResultsCheckResponse>("/api/results"));
}
