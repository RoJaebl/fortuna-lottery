import type { Container } from "@lib/di";
import { DOMAIN_EVENTS } from "@infrastructure/events";
import { LIST_PICKS, PICKS_REMOVED, PICKS_SAVED } from "@app/(home)";

/** 무엇이 무엇을 갱신하는가, 전부 여기 (frontend-app-layers §6 전파 규칙 파일) */
export function registerPropagation(c: Container): void {
  const events = c.resolve(DOMAIN_EVENTS);
  events.on(PICKS_SAVED, /* 출처: 이 탭 */ () => c.resolve(LIST_PICKS).invalidate());
  events.on(PICKS_REMOVED, /* 출처: 이 탭 */ () => c.resolve(LIST_PICKS).invalidate());
  // 픽 저장·삭제는 CHECK_RESULTS 를 무효화하지 않는다 — 결과 확인은 사람이 「당첨 대조」를 눌러 받는 값이다
}
