// 표본: 화면이 useState 를 부른다.
// 실제 사례 — statistics/view/statistics-panel.tsx 가 activeStatView 를 useState 로 쥐었다(상호작용 상태가 화면에 샜다).
import { useState } from "react";

export function ListView() {
  const [tab, setTab] = useState("a");
  return <button onClick={() => setTab("b")}>{tab}</button>;
}
