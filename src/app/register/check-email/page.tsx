import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { resendVerificationEmailAction } from "@/actions/auth";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Button, Card, Input } from "@/components/ui";

export default async function RegisterCheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; resent?: string }>;
}) {
  const locale = await getLocale();
  const t = ui(locale).registerCheckEmail;
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const resent = sp.resent === "1";
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <Card title={t.title}>
          {resent ? (
            <p className="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
              {t.resentOk}
            </p>
          ) : null}
          {err ? (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </p>
          ) : null}
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t.bodyBefore}{" "}
            <Link href="/login" className="font-medium text-teal-700 underline dark:text-teal-400">
              {t.loginLink}
            </Link>
            {t.bodyAfter}
          </p>
          <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
            <h2 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{t.resendTitle}</h2>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{t.resendHint}</p>
            <form action={resendVerificationEmailAction} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.resendEmailLabel}</label>
                <Input name="email" type="email" required dir="ltr" className="text-left" autoComplete="email" />
              </div>
              <Button type="submit" variant="ghost" className="w-full">
                {t.resendSubmit}
              </Button>
            </form>
          </div>
        </Card>
      </main>
    </div>
  );
}
