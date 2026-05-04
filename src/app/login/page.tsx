import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { getCurrentUser } from "@/lib/current-user";
import { TopNav } from "@/components/TopNav";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Button, Card, Input } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; verified?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const locale = await getLocale();
  const t = ui(locale).login;
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const ok = sp.verified === "1";
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <Card title={t.title}>
          {ok ? (
            <p className="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
              {t.emailVerified}
            </p>
          ) : null}
          {err ? (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </p>
          ) : null}
          <form action={loginAction} className="space-y-3">
            <input type="hidden" name="next" value={sp.next ?? ""} />
            <div>
              <label className="mb-1 block text-xs text-slate-500">{t.email}</label>
              <Input name="email" type="email" required dir="ltr" className="text-left" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">{t.password}</label>
              <Input name="password" type="password" required dir="ltr" className="text-left" />
            </div>
            <Button type="submit" className="w-full">
              {t.submit}
            </Button>
          </form>
          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            {t.resendVerifyHint}{" "}
            <Link href="/register/check-email" className="text-teal-700 underline dark:text-teal-400">
              {t.resendVerifyLink}
            </Link>
          </p>
          <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
            {t.noAccount}{" "}
            <Link href="/register" className="text-teal-700 underline dark:text-teal-400">
              {t.signUp}
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
