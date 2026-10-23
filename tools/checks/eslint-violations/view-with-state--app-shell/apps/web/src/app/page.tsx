// 표본: app/ 의 셸도 화면이다 — 상태는 Home.presenter 가 쥔다.
import { useState } from "react";

export default function Page() {
  const [tab, setTab] = useState("a");
  return <button onClick={() => setTab("b")}>{tab}</button>;
}
