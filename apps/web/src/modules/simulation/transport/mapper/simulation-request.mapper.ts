import type { SimulationRequest } from "@fortuna-lottery/core/simulation/dto";

export function mapSimulationRequest(numbers: number[]): SimulationRequest {
  return { numbers: [...numbers] };
}
