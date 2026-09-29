// 표본: 뷰 폴더 밖에서 그 폴더의 안쪽 소유물을 짚는다 — fractal-view-promotion §6·§7 이 뚫려 있다고 적은 자리다.
// 실제 사례 — 이 저장소에는 아직 뷰 폴더가 없다. 모듈을 옮기며 폴더로 승격하는 Task 4~ 에서 처음 걸릴 자리다.
import { listRequest } from "./ListView/mapper/list.mapper";

export const request = listRequest;
