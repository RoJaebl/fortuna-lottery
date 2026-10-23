# 디자인 시스템 — standard-light

이 저장소(FortunaLottery)의 디자인 토큰 문서. 색·간격·글자·모서리 작업을 하기 전에 먼저 확인하고,
여기 없는 값을 임의로 새로 만들지 않는다.

## 케이스

vault 골조의 디자인 케이스 **standard-light**(밝은 종이 바닥, 표면 넷이 같은 흰색이고 선과 그림자가
층을 만든다)를 쓴다. `<html data-ground="paper">` 로 종이 바닥을 켠다. 라이트 단일 테마다 — 다크 모드와
`dark:` variant 는 만들지 않는다.

## 값의 SSOT

모든 값은 `apps/web/src/app/globals.css` 의 `:root` 가 소유한다. 이 문서에는 값을 옮겨 적지 않는다.
`@theme inline` 이 토큰을 Tailwind 유틸리티로 잇는다.

| 토큰 | 유틸리티 |
|---|---|
| `--ui-{bg,panel,raised,said,inset,selected,line,text,muted,strong,on-strong,accent,ok,warn,danger,info,busy}` | `bg-*` `text-*` `border-*` (`bg-strong`, `text-on-strong`, `text-muted`, `border-line` …) |
| `--text-{display,head,sub,read,body,small,micro,nano}` (+ `--lh-*`) | `text-head`, `text-nano` … (글자 크기와 줄 높이가 함께 걸린다) |
| `--r-{panel,card,box,button,pill}` | `rounded-panel`, `rounded-card` … |
| `--ui-font-sans` | `font-sans` |

`:root` 의 글자 크기 변수와 `@theme` 의 이름이 같아 `--text-x: var(--text-x)` 로 자기를 가리키는 줄이
테마 층에 생기지만, 층 밖(`:root`)의 선언이 이기므로 값은 정상이다. `:root` 의 이름을 바꾸지 않는다.

## 브랜딩 자리 넷과 고른 값

| 자리 | 값 | 작업면(`#edeff3`) 위 대비 | 종이(`#ffffff`) 위 대비 |
|---|---|---|---|
| `--ui-strong` | `#047857` (emerald-700) | 4.76 | 5.48 (`--ui-on-strong` `#ffffff` 글자 대비 5.48) |
| `--ui-on-strong` | `#ffffff` | — | — |
| `--ui-accent` | `#065f46` (emerald-800) | 6.67 | 7.68 |
| `--ui-info` | `#0f766e` (teal-700) | 4.75 | 5.47 |
| `--ui-font-sans` 맨 앞 | 바꾸지 않았다(시스템 글꼴) | | |

emerald-600(`#059669`)은 흰 글자 대비 3.77 로 4.5 에 못 미쳐 한 단 어둡게 잡았다. 새 색은 작업면 위에서
먼저 재고, 4.5 이상일 때만 들인다.

## 규칙

- **채운 초록(strong)은 실행 단추다.** 주 단추(`bg-strong text-on-strong`)만 strong 으로 채운다. accent 는
  고른 것·활성(선택된 토글·번호, 머리글 강조)에 쓴다(`bg-accent text-on-strong`, `text-accent`). 탭·내비게이션은
  무채색(`text-text` 와 선·`bg-selected`)으로 표현하고, "지금 보고 있는 화면"에 초록을 쓰지 않는다.
- 표면과 선은 케이스 값을 바꾸지 않는다.
- 신호색(`ok`·`warn`·`danger`·`info`·`busy`)은 의미에 맞는 자리에만 쓴다. 점·뱃지 전용인 것은 큰
  글자 본문에 쓰지 않는다.
- **도메인 예외: 로또 공 색.** `ballColor()`(`lotto-colors.ts`)의 노랑·파랑·빨강·회색·초록은 실제 공 색
  규칙이며 토큰으로 바꾸지 않고 어떤 이유로도 바꾸지 않는다.
- **조건으로 갈리는 서식은 뷰 폴더 안의 `<폴더>.styles.ts` 에 `tv`(`@lib/style/tv`)로 정의한다.** 부모가 내린 `className` 을 합칠 때만 `cn`(`@lib/style/cn`)을 쓴다.
- **공용 서식 부품은 두 번째 화면이 같은 서식을 쓸 때 공통 조상으로 올린다.** 화면 모듈을 넘으면 `shared/ui` 다. `shared/ui` 부품도 뷰와 같이 폴더다 — `<Name>/index.tsx` · `<Name>.styles.ts` · `<Name>.styles.test.ts` 이고, 화면 시험은 `<폴더>.test.tsx` 다(예: `Card/Card.test.tsx`, `index.test.tsx` 가 아니다). 서식 파일은 같은 폴더의 `index.tsx` 와 `.styles.test.ts` 만 가져오고, `X.styles.ts` 는 폴더 `X` 안에만 선다(`styles-owned-by-its-screen`).
- **`@theme inline` 에 글자 크기·모서리 토큰을 더하면 `shared/lib/style/cn.ts` 의 `twMergeConfig` 에도 더한다.** 안 그러면 글자 크기가 같은 자리의 글자 색에 지워지고, 모서리는 둘 다 남는다.
