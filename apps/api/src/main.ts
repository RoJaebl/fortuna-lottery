import { NestFactory } from "@nestjs/core";
import { AppModule, GLOBAL_PREFIX } from "./app.module.js";
import { loadConfig } from "./config.js";

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix(GLOBAL_PREFIX);
app.enableShutdownHooks();
await app.listen(loadConfig().port);
