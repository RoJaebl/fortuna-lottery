// 허용 표본: 셸의 클라이언트 경계는 컨테이너를 useState 로 한 번 짓는다.
import { useState, type ReactNode } from "react";

export function AppContainer({ children }: { children: ReactNode }) {
  const [container] = useState(() => ({}));
  return <div data-c={String(container)}>{children}</div>;
}
