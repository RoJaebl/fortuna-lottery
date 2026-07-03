import type { PickResponse } from "@lotto-lab/core/picks/dto";
import { apiDelete, apiGet, apiPost } from "@/shared/lib/fetcher";
import { assemblePick } from "../transport/assembler/pick-response.assembler";
import { mapSavePickRequest } from "../transport/mapper/save-pick-request.mapper";
import type { PickModel } from "../model/pick.model";

export async function fetchPicks(): Promise<PickModel[]> {
  const dtos = await apiGet<PickResponse[]>("/api/picks");
  return dtos.map(assemblePick);
}

export async function savePick(numbers: number[]): Promise<PickModel> {
  return assemblePick(await apiPost<PickResponse>("/api/picks", mapSavePickRequest(numbers)));
}

export async function removePick(id: string): Promise<void> {
  await apiDelete<{ deleted: true }>(`/api/picks/${id}`);
}
