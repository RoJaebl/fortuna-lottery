// 표본: 뷰 폴더 밖에서 그 폴더의 안쪽 소유물을 짚는다 — fractal-view-promotion §6·§7 이 뚫려 있다고 적은 자리다.
// 실제 사례 — `PicksCard/` 같은 뷰 폴더 밖에서 그 안의 mapper 를 직접 가져오면 걸린다.
import { listRequest } from "./ListView/_mapper/list.mapper";

export const request = listRequest;
