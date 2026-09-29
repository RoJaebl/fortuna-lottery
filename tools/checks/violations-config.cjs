// 위반 표본 확인 전용 설정 — 정규 설정에서 이관 제외 목록만 뺀 것이다.
// 표본 중 apps/web/src/modules/** 꼴은 옛 구역 경로와 겹치므로, 제외 목록이 있으면 검사기가 보지 못한다.
const config = require('../../.dependency-cruiser.cjs')
const { exclude, ...options } = config.options
module.exports = { ...config, options }
