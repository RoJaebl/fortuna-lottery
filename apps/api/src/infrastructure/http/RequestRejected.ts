import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import { ZodError } from "zod";

interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

/** 도메인 규칙이 요청을 거절했다 — facade 가 유스케이스의 실패를 이것으로 올린다. 전송을 모른다 */
export class RequestRejected extends Error {}

/**
 * 거절을 400 { error } 로 옮긴다 — 옛 Next 처리기가 내던 본문 모양 그대로다.
 * 계약 스키마 파싱 실패(ZodError)도 여기서 400 이 된다. 둘 다 없으면 Nest 가 500 을 낸다.
 * ponytail: 응답 스키마 검사가 실패해도(서버 쪽 결함) 400 이 된다 — 가려야 하면 컨트롤러가 요청 파싱 실패만 RequestRejected 로 올린다.
 */
@Catch(RequestRejected, ZodError)
export class RequestRejectedFilter implements ExceptionFilter {
  catch(exception: RequestRejected | ZodError, host: ArgumentsHost): void {
    const error = exception instanceof ZodError ? "잘못된 요청 형식입니다" : exception.message;
    host.switchToHttp().getResponse<JsonResponse>().status(400).json({ error });
  }
}
