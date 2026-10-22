// 허용 표본: infrastructure/http/ 의 정의 파일이 폴더 이름 그대로의 key 를 등록한다.
import { createStore } from "@fortuna-lottery/store";
createStore("infra.http", () => ({ client: null }));
