# 디자인 시스템 — 컬러 토큰 (라이트 테마)

이 저장소(FortunaLottery)의 유일한 컬러 토큰 SSOT. 코드에서 색상 관련 작업(신규 컴포넌트,
기존 컴포넌트 수정)을 하기 전에 이 표를 먼저 확인하고, 여기 없는 색상 값을 임의로 새로 만들지
않는다.

## 시맨틱 토큰

| 시맨틱 토큰 | Tailwind 클래스 | 용도 |
|---|---|---|
| `background` | `bg-white` | 페이지 배경 |
| `surface` | `bg-white border border-slate-200 shadow-sm` | 카드/패널 배경 (`shared/ui/card.tsx`) |
| `surface-border` | `border-slate-200` / `border-slate-300` | 카드·구분선 테두리 |
| `surface-muted` | `bg-slate-100` | 토글 미선택 상태, 값 없는 진행 바 트랙 |
| `text-primary` | `text-slate-900` | 제목, 본문 강조 |
| `text-secondary` | `text-slate-700` | 본문 보조 |
| `text-muted` | `text-slate-500` | 캡션, 라벨, 보조 설명 |
| `accent-info` | `sky-600` | 정보성 강조 (다음 추첨 카운트다운 등) |
| `accent-success` | `emerald-600` | 긍정 신호 (당첨 일치 등) |
| `accent-warning` (텍스트) | `text-amber-600` | 희귀도 배지, 정직성 각주 강조 |
| `accent-warning` (배경 칩) | `bg-amber-50 border border-amber-200` | 희귀 패턴 강조 칩 |
| `accent-special` | `violet-600` | 특수 강조 (생성기 등) |
| `accent-danger` | `text-red-600` | 에러/불일치 강조 |
| `accent-ring` | `ring-slate-900` | `Ball`의 일치 번호 강조 링 |
| 로또 공 색상 | 변경 없음 (hex 고정) | `ballColor()` — 도메인 규칙, 절대 손대지 않음 |

## 원칙

- 배경·글자색을 함께 지정해 그 자체로 대비가 완결되는 버튼(예: `bg-emerald-600 text-white`)은
  페이지/카드 배경과 무관하게 항상 그대로 둔다 — 토큰 치환 대상이 아니다.
- 다크 모드는 없다 — 라이트 단일 테마다. 다크 모드 토글이나 `dark:` variant를 추가하지 않는다.
- 로또 공 색상은 실제 로또 공 색(노랑·파랑·빨강·회색·초록) 규칙이며 어떤 이유로도 바꾸지 않는다.
