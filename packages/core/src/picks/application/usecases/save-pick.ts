import { ok, type Result } from "../../../shared/result";
import type { PickEntity } from "../../domain/pick.entity";
import type { PicksItem, PicksSaveRequest } from "@fortuna-lottery/contract/picks";
import type { PickRepositoryPort } from "../ports/pick-repository.port";
import { createPickVO } from "../vo/pick.vo";

interface SavePickDeps {
  repository: PickRepositoryPort;
  idGenerator?: () => string;
  clock?: () => Date;
}

/** 기본 ID 생성 — 런타임 의존성 없는 시각+난수 조합 (충돌 확률 무시 가능한 MVP 수준) */
const defaultIdGenerator = () =>
  `pick_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

/** 픽 저장 유스케이스 — VO 검증 → Entity 저장 → 응답 DTO */
export const makeSavePick =
  ({ repository, idGenerator = defaultIdGenerator, clock = () => new Date() }: SavePickDeps) =>
  async (userId: string, request: PicksSaveRequest): Promise<Result<PicksItem>> => {
    const vo = createPickVO(userId, request.numbers);
    if (!vo.ok) return vo;

    const entity: PickEntity = {
      id: idGenerator(),
      userId: vo.value.userId,
      numbers: vo.value.combination,
      createdAt: clock().toISOString(),
    };
    await repository.save(entity);
    return ok({ id: entity.id, numbers: [...entity.numbers], createdAt: entity.createdAt });
  };
