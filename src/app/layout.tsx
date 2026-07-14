import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZEVORIK - Future of Investing",
  description: "Platform investasi saham terpercaya. Pantau portofolio, pergerakan saham, dan aktivitas profit Anda.",
  keywords: ["saham", "investasi", "portofolio", "IHSG", "ZEVORIK", "trading", "stock"],
  authors: [{ name: "ZEVORIK" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/zevorik-logo.png",
  },
  openGraph: {
    title: "ZEVORIK - Future of Investing",
    description: "Platform investasi saham terpercaya dengan profit harian dan portofolio cerdas.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
