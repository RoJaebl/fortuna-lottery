import type { Pick } from "../model/Pick.model.js";

/** 픽 저장소 포트 — MVP: InMemory / 후속: Supabase(Postgres) 어댑터로 교체 */
export interface PickRepositoryPort {
  save: (pick: Pick) => Promise<void>;
  findAllByUser: (userId: string) => Promise<Pick[]>;
  /** 삭제 성공 여부 반환 (소유자 불일치·미존재 시 false) */
  deleteById: (userId: string, pickId: string) => Promise<boolean>;
}

export const PICK_REPOSITORY = Symbol("PickRepositoryPort");
