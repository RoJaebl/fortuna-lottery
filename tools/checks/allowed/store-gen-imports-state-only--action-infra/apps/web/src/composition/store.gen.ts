// 허용 표본: 생성 파일이 _action/ 의 정의 파일과 infrastructure/ 의 정의 파일을 싣고, 값의 타입을 적으려고 정의 파일 밖의 타입을 import("…") 로 짚는다.
export {};
import "../app/documents/DocumentList/_action/list.state";
import "../infrastructure/http/http.state";
export type Client = import("../infrastructure/http/http.port").HttpClient;
