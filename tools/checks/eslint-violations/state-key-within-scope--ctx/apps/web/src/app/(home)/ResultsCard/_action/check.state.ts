// 사례: 정의가 ctx 로 형제 뷰 폴더의 자원을 꺼낸다 — home.PicksCard 는 home.ResultsCard 의 앞부분이 아니다.
import { createStore } from "@fortuna-lottery/store";
createStore("api.home.ResultsCard.check", (_set, _get, ctx) => ({
  count: () => ctx("api.home.PicksCard.picks").items.length,
}));
