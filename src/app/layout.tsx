import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "عَمارتي — تواصل سكان العمارة",
  description:
    "منصة للملاك والمستأجرين: تسجيل المبنى بالعنوان الوطني السعودي، صيانة، تصويت، مدفوعات، وإعلانات داخل المبنى.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "عَمارتي",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
