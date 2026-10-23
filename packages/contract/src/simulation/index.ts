import type { z } from "zod";
import type {
  SimulationBacktestRequestSchema,
  SimulationBacktestResponseSchema,
} from "./schema.js";

export * from "./schema.js";

export type SimulationBacktestRequest = z.infer<typeof SimulationBacktestRequestSchema>;
export type SimulationBacktestResponse = z.infer<typeof SimulationBacktestResponseSchema>;
