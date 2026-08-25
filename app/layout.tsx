import type { Metadata, Viewport } from "next";
import { Gowun_Batang, Gowun_Dodum } from "next/font/google";
import "./globals.css";

const display = Gowun_Batang({
  variable: "--font-display",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const body = Gowun_Dodum({
  variable: "--font-body",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "독서록",
  description: "학급 온라인 독서록",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "독서록",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f4b3c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${display.variable} ${body.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
