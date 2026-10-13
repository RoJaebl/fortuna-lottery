import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { type ApiConfig, CONFIG, loadEnvFile } from "./config.js";
import { configureApp } from "./configureApp.js";
import { listenOnPort } from "./listen.js";

// 설정과 Prisma 는 앱을 만들 때 환경을 읽으므로 그 전에 .env 를 싣는다
loadEnvFile();
const app = configureApp(await NestFactory.create(AppModule));
app.enableShutdownHooks();
const { port, strictPort } = app.get<ApiConfig>(CONFIG);
// 받은 포트에 서고 옮기지 않는다 — strict 이면 쥔 쪽이 풀리기를 5 초 기다린다
await listenOnPort(async (p) => void (await app.listen(p)), port, { strict: strictPort, attempts: 5, delayMs: 1000 });
// PORT=0 이면 OS 가 준 포트이므로 실제로 선 주소를 적는다
const bound = (app.getHttpServer().address() as { port: number }).port;
console.log(`서버 http://127.0.0.1:${bound}/api`);
