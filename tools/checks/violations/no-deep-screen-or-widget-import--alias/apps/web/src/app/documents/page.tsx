// 사례: 화면 모듈이 위젯의 안쪽 모델을 별칭으로 짚는다 — 밖에서는 위젯의 배럴만 본다.
import { item } from '@widgets/list/model/ListItem.model'
export default function Page() { return item }
