// 표본: 위젯의 조정자가 router.push 에 주소 템플릿을 바로 넘긴다.
declare const router: { push(p: string): void };

export const open = (id: string) => router.push(`/documents/${id}`);
