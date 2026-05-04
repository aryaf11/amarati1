import Link from "next/link";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";

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
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
          <Card title={t.invalidTitle}>
            <p className="text-sm text-slate-600 dark:text-slate-300">{t.invalidBody}</p>
            <p className="mt-3 text-sm">
              <Link href="/login" className="text-teal-700 underline dark:text-teal-400">
                {t.goLogin}
              </Link>
            </p>
          </Card>
        </main>
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
