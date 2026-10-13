import type { z } from "zod";
import type {
  HypothesisEvaluateRequestSchema,
  HypothesisEvaluateResponseSchema,
  HypothesisGenerateRequestSchema,
  HypothesisGenerateResponseSchema,
  HypothesisPopularityRequestSchema,
  HypothesisPopularityResponseSchema,
} from "./schema.js";

export * from "./schema.js";

export type HypothesisEvaluateRequest = z.infer<typeof HypothesisEvaluateRequestSchema>;
export type HypothesisEvaluateResponse = z.infer<typeof HypothesisEvaluateResponseSchema>;
export type HypothesisGenerateRequest = z.infer<typeof HypothesisGenerateRequestSchema>;
export type HypothesisGenerateResponse = z.infer<typeof HypothesisGenerateResponseSchema>;
export type HypothesisPopularityRequest = z.infer<typeof HypothesisPopularityRequestSchema>;
export type HypothesisPopularityResponse = z.infer<typeof HypothesisPopularityResponseSchema>;
