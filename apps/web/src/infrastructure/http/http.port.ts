export interface HttpClient {
  get<T>(path: string): Promise<T>;
  send<T>(path: string, init: RequestInit): Promise<T>;
}
