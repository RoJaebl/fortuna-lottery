// 표본: 화면이 주소 문자열을 직접 쓴다 — 주소는 @app/routes 로 만든다.
declare function Link(p: { href: string; children: string }): null;

export default function Page() {
  return <Link href="/documents">문서</Link>;
}
