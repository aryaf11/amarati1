import Link from "next/link";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Card, PageShell } from "@/components/ui";
import { prisma } from "@/lib/prisma";

const accent = "var(--accent)";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const locale = await getLocale();
  const t = ui(locale).verifyEmail;
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token.trim() : "";
  if (!token) {
    return (
      <div className="flex min-h-full flex-col">
        <TopNav />
        <PageShell className="max-w-md">
          <Card title={t.invalidTitle}>
            <p className="text-sm text-slate-600 dark:text-slate-300">{t.invalidBody}</p>
            <p className="mt-3 text-sm">
              <Link href="/login" className="font-medium underline" style={{ color: accent }}>
                {t.goLogin}
              </Link>
            </p>
          </Card>
        </PageShell>
      </div>
    );
  }
  const user = await prisma.user.findUnique({
    where: { emailVerifyToken: token },
  });
  if (!user?.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
    redirect("/login?error=" + encodeURIComponent(t.linkExpired));
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });
  redirect("/login?verified=1");
}
