// 위반 표본 — 이름공간으로 가져온 useStore 는 key 규칙(state-only-in-presenter 등)을 비켜 간다
import * as S from "supa-store/react";

export function DocumentList() {
  const { data } = S.useStore("api.documents.list" as never) as { data: string[] };
  return <ul>{data.map((d) => <li key={d}>{d}</li>)}</ul>;
}
