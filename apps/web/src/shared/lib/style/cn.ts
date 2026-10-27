import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge 에 이 저장소의 토큰 이름을 알린다. 이름은 `app/globals.css` 의 `@theme inline` 그대로다 —
 * 거기에 토큰을 더하면 여기에도 더한다.
 *
 * 기본 설정은 글자 크기와 모서리 토큰을 모른다(실측). 알리지 않고 돌렸을 때 어긋난 것은 이렇다.
 * - `cn("text-small", "text-muted")` 이 `"text-muted"` 를 냈다. `text-small` 을 색으로 읽어, 글자 크기가
 *   색에 먹혔다. (`cn("text-small", "text-micro")` 가 통과한 것은 둘 다 색으로 읽은 우연이다.)
 * - `cn("rounded-card", "rounded-box")` 이 `"rounded-card rounded-box"` 를 냈다. 토큰을 모서리로 읽지 못해
 *   뒤엣것이 이겨야 할 자리에서 둘 다 남았다.
 * - `tv` 안의 합치기도 같은 어긋남을 보였다(base 의 `text-small` 이 사라지고, `rounded-card` 가 남았다).
 * 색(`bg-*`·`border-*`·`ring-*`·`text-*` 색)은 기본 설정이 이미 색으로 읽어 같은 갈래끼리 합쳐지고
 * 두께와 색이 함께 남았으므로 알리지 않는다.
 *
 * `cn` 을 쓰는 자리는 좁다. 부모가 내린 `className` 과 자기 기본값을 합칠 때, 그리고 두 정의의 결과를
 * 겹쳐 쌓을 때다. 서식 정의는 `tv` 가 맡는다.
 */
export const twMergeConfig = {
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "head", "sub", "read", "body", "small", "micro", "nano", "pico"] }],
      rounded: [{ rounded: ["panel", "card", "box", "button", "pill"] }],
    },
  },
};

const twMerge = extendTailwindMerge(twMergeConfig);

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
