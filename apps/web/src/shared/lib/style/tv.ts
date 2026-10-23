import { createTV } from "tailwind-variants";
import { twMergeConfig } from "./cn";

// tv 안의 합치기도 cn 과 같은 토큰 설정을 받는다.
export const tv = createTV({ twMergeConfig });
