import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAST ONE",
  description: "같은 자리에 모여 각자 폰으로 하는 추리 게임",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        {/* 모바일 기준 (CLAUDE.md §2): 데스크톱에서도 가운데 최대 430px 그대로 */}
        <div className="mx-auto min-h-dvh max-w-[430px]">{children}</div>
      </body>
    </html>
  );
}
