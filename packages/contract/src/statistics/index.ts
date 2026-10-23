import type { z } from "zod";
import type {
  StatisticsReadResponseSchema,
} from "./schema.js";

export * from "./schema.js";

export type StatisticsReadResponse = z.infer<typeof StatisticsReadResponseSchema>;
