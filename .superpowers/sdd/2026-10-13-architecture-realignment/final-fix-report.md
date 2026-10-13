# 최종 검토 수정 보고

1. 선택 상태: page.tsx 머리글 `text-accent`, GeneratorCard 토글·번호 선택 `bg-accent text-on-strong`. design-system.md 규칙을 「채운 초록(strong)=실행 단추, accent=고른 것·활성, 탭은 무채색」으로 고침.
2. info: 카운트다운 `text-text`; TopPairsList `bg-accent`, PatternDistribution `bg-accent/70`, SumDistributionChart `var(--ui-accent)`. 남은 `info` 사용: tsx/ts 에 없음(globals.css 의 토큰 정의와 `--color-info` 매핑만).
3. launch.mjs restartApi: `stop(api)` 를 FORCE_AFTER_MS 와 Promise.race 로 한정, SIGKILL 은 try/catch(ESRCH).
4. apiProxy: `path.map(encodeURIComponent).join("/")` + 시험(`a/b?c` -> `a%2Fb%3Fc`).
5. `gap-[3px]` -> `gap-1`(4px), `rounded-[1px]` -> `rounded-none`(0px, 가장 가까운 토큰). `-[` 임의값 grep 결과 0.
6. globals.css 주석: 브랜드 초록을 strong 자리에 둔다고 고침.
7. 문서: CLAUDE.md·vault-feedback 의 가짜 저장소 문구, "5 번 시도(약 4 초)"(CLAUDE.md, launcher-ports.md), vitest.config 주석, CLAUDE.md 스케줄러 두 항목을 하나로 병합.

## 검증
- apiProxy.test.ts 5 passed; node --test tools/launch/*.test.mjs 6 pass
- pnpm check 통과 (kernel 12, contract 38, web 81, api 108 + 2 skipped)
- run-violations.sh 종료 0; web build 성공
