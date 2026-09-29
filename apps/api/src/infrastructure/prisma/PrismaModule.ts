import { Module } from "@nestjs/common";
import { PrismaService } from "./PrismaService.js";

@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
