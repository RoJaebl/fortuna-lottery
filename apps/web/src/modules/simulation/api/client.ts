import type { SimulationResponse } from "@fortuna-lottery/core/simulation/dto";
import { apiPost } from "@/shared/lib/fetcher";
import { assembleBacktest } from "../transport/assembler/simulation-response.assembler";
import { mapSimulationRequest } from "../transport/mapper/simulation-request.mapper";
import type { BacktestModel } from "../model/simulation.model";

export async function postBacktest(numbers: number[]): Promise<BacktestModel> {
  return assembleBacktest(
    await apiPost<SimulationResponse>("/api/simulation", mapSimulationRequest(numbers)),
  );
}
