// 표본: 표시 모델을 얕은 전개로 복제한다 — 프로토타입 getter 가 떨어져 나간다.
// 실제 사례 — 이 저장소에는 아직 없다. 표시 모델 class(Task 4~)가 생기면 처음 걸릴 자리다.
// 이 규칙은 boundary-enforcement §4 가 정한 것을 그대로 켠 것이다.
declare const itemViewModel: { label: string };

export const next = { ...itemViewModel, label: "b" };
