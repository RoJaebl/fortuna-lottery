// 사례: 자원 key 가 소유 폴더를 건너뛴다 — 이 파일의 key 는 api.documents.DocumentList.<이름> 이다.
import { createStore } from "@fortuna-lottery/store";
createStore("api.documents.list", () => ({ items: [] as string[] }));
