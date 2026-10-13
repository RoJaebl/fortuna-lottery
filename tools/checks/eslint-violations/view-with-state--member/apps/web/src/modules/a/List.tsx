// 표본: React.useState 처럼 멤버 호출로 우회해도 걸린다.
import * as React from "react";

export function List() {
  const [tab, setTab] = React.useState("a");
  return <button onClick={() => setTab("b")}>{tab}</button>;
}
