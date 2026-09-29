import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { type ApiConfig, CONFIG } from "./config.js";
import { configureApp } from "./configureApp.js";

const app = configureApp(await NestFactory.create(AppModule));
app.enableShutdownHooks();
await app.listen(app.get<ApiConfig>(CONFIG).port);
