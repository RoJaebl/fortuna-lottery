import type { SimulationRequest } from "@lotto-lab/core/simulation/dto";

export function mapSimulationRequest(numbers: number[]): SimulationRequest {
  return { numbers: [...numbers] };
}
