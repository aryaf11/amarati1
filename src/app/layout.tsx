import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { getLocale } from "@/lib/locale";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme-bootstrap";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const viewport: Viewport = {
  themeColor: "#157083",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const shared: Metadata = {
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: locale === "en" ? "Amarati" : "عَمارتي",
      statusBarStyle: "default",
    },
    icons: {
      icon: "/logo.svg",
      apple: "/logo.svg",
    },
  };
  if (locale === "en") {
    return {
      ...shared,
      title: "Amarati — Smart building community",
      description:
        "For owners and tenants: national address, maintenance, voting, payments, and building announcements.",
    };
  }
  return {
    ...shared,
    title: "عَمارتي — تواصل سكان العمارة",
    description:
      "منصة للملاك والمستأجرين: تسجيل المبنى بالعنوان الوطني السعودي، صيانة، تصويت، مدفوعات، وإعلانات داخل المبنى.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dir = locale === "en" ? "ltr" : "rtl";
  return (
    <html lang={locale} dir={dir} className={`${cairo.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
