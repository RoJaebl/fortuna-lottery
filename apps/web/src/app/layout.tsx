import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "로또랩 — 사기 전에, 데이터로 확인하세요",
  description:
    "과거 회차 데이터 기반의 정직한 통계로 로또 번호 선택을 돕는 의사결정 도우미. 과거 통계는 미래 당첨 확률을 높이지 않습니다.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
