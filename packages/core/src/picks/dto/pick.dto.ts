export interface SavePickRequest {
  numbers: number[];
}

export interface PickResponse {
  id: string;
  numbers: number[];
  createdAt: string;
}
