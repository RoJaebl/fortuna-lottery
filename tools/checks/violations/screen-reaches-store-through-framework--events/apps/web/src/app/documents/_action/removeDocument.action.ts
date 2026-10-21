// 사례: action 이 사건 통로를 직접 쥔다 — 사건은 http 영역 콜백의 emit 으로 낸다.
import { EventChannel } from "@lib/events";
export const channel = new EventChannel();
