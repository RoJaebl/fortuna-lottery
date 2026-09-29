import { type ArgumentsHost, BadRequestException, Catch, type ExceptionFilter } from "@nestjs/common";

interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

export const MALFORMED_REQUEST = "잘못된 요청 형식입니다";

/** 요청이 거절됐다 — 도메인 규칙(facade)이나 요청 스키마(parseRequest)가 올린다. 전송을 모른다 */
export class RequestRejected extends Error {}

/**
 * 거절을 400 { error } 로 옮긴다 — 옛 Next 처리기가 내던 본문 모양 그대로다.
 * BadRequestException 은 이 앱에서 Express 어댑터가 깨진 JSON 본문(SyntaxError)·경로 인코딩(URIError)을
 * 옮긴 것뿐이라 같은 「잘못된 요청 형식」으로 낸다. 응답 스키마 검사 실패(ZodError)는 잡지 않아 500 이 된다.
 */
@Catch(RequestRejected, BadRequestException)
export class RequestRejectedFilter implements ExceptionFilter {
  catch(exception: RequestRejected | BadRequestException, host: ArgumentsHost): void {
    const error = exception instanceof RequestRejected ? exception.message : MALFORMED_REQUEST;
    host.switchToHttp().getResponse<JsonResponse>().status(400).json({ error });
  }
}
