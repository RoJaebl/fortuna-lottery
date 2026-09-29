/** 현재 요청의 사용자 — 필요한 것은 식별자뿐이다. 누가 주는지는 모른다(조립 루트가 identity 의 facade 를 꽂는다) */
export interface CurrentUser {
  readonly id: string;
}

export interface CurrentUserPort {
  currentUser: () => Promise<CurrentUser>;
}

export const CURRENT_USER = Symbol("CurrentUserPort");
