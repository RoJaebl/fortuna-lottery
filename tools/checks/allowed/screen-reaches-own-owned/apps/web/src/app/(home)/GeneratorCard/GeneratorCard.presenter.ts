// 사례: 같은 화면 모듈 안의 자식 뷰가 모듈의 소유물(../_model/)을 상대 경로로 가져온다 — 라우트 그룹 이름의 괄호도 글자 그대로 읽는다.
import { combination } from '../_model/Combination.model'
export const useGeneratorCardPresenter = () => combination
