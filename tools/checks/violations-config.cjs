// 위반 표본 확인 전용 설정 — 정규 설정에서 exclude 만 뺀 것이다.
// exclude 가 다시 생겨도 표본을 보게 하는 방어다.
// 정규 설정의 screenModules() 는 작업 디렉터리 기준으로 app/ 을 훑으므로, 표본 폴더 안에서 부르면 표본의 라우트 폴더마다 규칙이 선다.
const config = require('../../.dependency-cruiser.cjs')
const { exclude, ...options } = config.options
module.exports = { ...config, options }
