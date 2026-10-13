import type {
  HypothesisPopularityRequest,
  HypothesisPopularityResponse,
} from "@fortuna-lottery/contract/hypothesis";
import { PopularityViewModel } from "../model/Popularity.viewmodel";

export function hypothesisPopularityRequest(numbers: readonly number[]): HypothesisPopularityRequest {
  return { numbers: [...numbers] };
}

export function hypothesisPopularityResponse(res: HypothesisPopularityResponse): PopularityViewModel {
  return PopularityViewModel.from(res.patterns);
}
