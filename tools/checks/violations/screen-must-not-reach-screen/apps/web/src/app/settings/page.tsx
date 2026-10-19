// 사례: 화면 모듈이 다른 화면 모듈의 공개 표면을 부른다 — 화면 모듈끼리는 index.ts 까지 보지 않는다.
import { documents } from '@app/documents'
export default function Page() { return documents }
