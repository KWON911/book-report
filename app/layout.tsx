import type { Metadata } from "next";
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
