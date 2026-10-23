import { Logger } from "@nestjs/common";
import type { LoggerPort } from "../port/LoggerPort.js";

/** 수집 로그를 Nest 로거의 LotterietusIngest 문맥으로 낸다 */
export const nestIngestLogger: LoggerPort = (message) => Logger.log(message, "LotterietusIngest");
