import { createStore } from "supa-store";
import { createEvent } from "supa-store/query";

/** 픽을 저장하거나 지웠다 — 내 픽을 읽는 다른 자원이 듣는다 */
createStore("event.home.PicksCard.changed", () => createEvent<{ kind: "saved" | "removed" }>());
