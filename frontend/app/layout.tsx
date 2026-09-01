import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "홍성메이트 | 여행자와 홍성을 잇다",
  description: "홍성, 이어가유 구옥 스테이 참가자를 위한 근처 장소 발견과 Join 커뮤니티",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "HONGSEONG MATE",
    description: "홍성에서 함께할 순간을 담아요",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "홍성메이트 구옥 스테이 커뮤니티" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HONGSEONG MATE",
    description: "홍성에서 함께할 순간을 담아요",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}

