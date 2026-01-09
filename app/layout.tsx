import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "校园寻物招领平台",
    template: "%s | 校园寻物招领平台"
  },
  description: "帮助大学生快速找回丢失物品，轻松发布招领信息",
  keywords: ["失物招领", "校园", "寻物", "捡到物品", "大学生"],
  authors: [{ name: "校园寻物招领平台" }],
  creator: "校园寻物招领平台",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://your-domain.com",
    title: "校园寻物招领平台",
    description: "帮助大学生快速找回丢失物品，轻松发布招领信息",
    siteName: "校园寻物招领平台",
  },
  twitter: {
    card: "summary_large_image",
    title: "校园寻物招领平台",
    description: "帮助大学生快速找回丢失物品，轻松发布招领信息",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
