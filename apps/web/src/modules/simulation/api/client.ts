import type { SimulationBacktestResponse } from "@fortuna-lottery/contract/simulation";
import { apiPost } from "@/shared/lib/fetcher";
import { assembleBacktest } from "../transport/assembler/simulation-response.assembler";
import { mapSimulationRequest } from "../transport/mapper/simulation-request.mapper";
import type { BacktestModel } from "../model/simulation.model";

export async function postBacktest(numbers: number[]): Promise<BacktestModel> {
  return assembleBacktest(
    await apiPost<SimulationBacktestResponse>("/api/simulation", mapSimulationRequest(numbers)),
  );
}
