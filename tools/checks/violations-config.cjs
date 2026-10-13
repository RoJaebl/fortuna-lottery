// 위반 표본 확인 전용 설정 — 정규 설정에서 exclude 만 뺀 것이다.
// exclude 가 다시 생겨도 표본을 보게 하는 방어다.
const config = require('../../.dependency-cruiser.cjs')
const { exclude, ...options } = config.options
module.exports = { ...config, options }
