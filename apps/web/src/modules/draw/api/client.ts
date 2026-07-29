import type { DrawResponse } from "@lotto-lab/core/draw/dto";
import { apiGet } from "@/shared/lib/fetcher";
import { assembleDraw } from "../transport/assembler/draw.assembler";
import type { DrawModel } from "../model/draw.model";

export async function fetchRecentDraws(count: number): Promise<DrawModel[]> {
  const dtos = await apiGet<DrawResponse[]>(`/api/draws?count=${count}`);
  return dtos.map(assembleDraw);
}
