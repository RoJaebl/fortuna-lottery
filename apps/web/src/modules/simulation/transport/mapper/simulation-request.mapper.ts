import type { SimulationBacktestRequest } from "@fortuna-lottery/contract/simulation";

export function mapSimulationRequest(numbers: number[]): SimulationBacktestRequest {
  return { numbers: [...numbers] };
}
