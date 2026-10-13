// 허용 표본: JSX 를 담은 조정자(*.presenter.tsx)는 화면이 아니므로 useState 를 부를 수 있다.
import { useState } from "react";

export function useAPresenter() {
  const [tab, setTab] = useState("a");
  return { tab, node: <button onClick={() => setTab("b")}>{tab}</button> };
}
