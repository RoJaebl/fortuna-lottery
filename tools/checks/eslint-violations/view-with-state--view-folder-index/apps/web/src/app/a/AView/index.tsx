// 표본: 뷰 폴더의 index.tsx 도 화면이다 — useState 를 부르면 걸린다.
import { useState } from "react";

export function AView() {
  const [tab, setTab] = useState("a");
  return <button onClick={() => setTab("b")}>{tab}</button>;
}
