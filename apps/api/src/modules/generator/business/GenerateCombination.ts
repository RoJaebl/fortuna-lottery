import { Inject, Injectable } from "@nestjs/common";
import type { GeneratorGenerateRequest } from "@fortuna-lottery/contract/generator";
import type { Combination, Result } from "@fortuna-lottery/kernel";
import { RNG, type RandomPort } from "../domain/port/RandomPort.js";
import { generate } from "./generate.js";

/** 조합 생성 유스케이스 — 난수 포트 주입 (프로덕션: Math.random / 테스트: 시드 고정) */
@Injectable()
export class GenerateCombination {
  constructor(@Inject(RNG) private readonly random: RandomPort) {}

  execute(request: GeneratorGenerateRequest): Result<Combination> {
    return generate(this.random, request.fixedNumbers ?? [], request.excludedNumbers ?? []);
  }
}
