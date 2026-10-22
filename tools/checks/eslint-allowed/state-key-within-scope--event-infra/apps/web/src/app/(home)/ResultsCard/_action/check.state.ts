// 허용 표본: 정의가 ctx 로 형제 뷰 폴더의 event 와 바깥 도구를 꺼낸다 — event 는 범위 밖에서도, infra 는 어디서나 닿는다.
import { createStore } from "@fortuna-lottery/store";
createStore("api.home.ResultsCard.check", (_set, _get, ctx) => ({
  client: () => ctx("infra.http").client,
  changed: () => ctx("event.home.PicksCard.changed"),
}));
