import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { loadConfig } from "./config.js";
import { configureApp } from "./configureApp.js";

const app = configureApp(await NestFactory.create(AppModule));
app.enableShutdownHooks();
await app.listen(loadConfig().port);
