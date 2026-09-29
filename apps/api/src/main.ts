import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { type ApiConfig, CONFIG, loadEnvFile } from "./config.js";
import { configureApp } from "./configureApp.js";

// 설정과 Prisma 는 앱을 만들 때 환경을 읽으므로 그 전에 .env 를 싣는다
loadEnvFile();
const app = configureApp(await NestFactory.create(AppModule));
app.enableShutdownHooks();
await app.listen(app.get<ApiConfig>(CONFIG).port);
