import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { resendVerificationEmailAction } from "@/actions/auth";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Button, Card, Input, PageShell } from "@/components/ui";

const accent = "var(--accent)";

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
      <PageShell className="max-w-md">
        <Card title={t.title}>
          {resent ? (
            <p className="mb-3 rounded-xl border border-teal-200 bg-teal-50/80 px-3 py-2 text-sm text-teal-900 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-100">
              {t.resentOk}
            </p>
          ) : null}
          {err ? (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </p>
          ) : null}
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t.bodyBefore}{" "}
            <Link href="/login" className="font-semibold underline" style={{ color: accent }}>
              {t.loginLink}
            </Link>
            {t.bodyAfter}
          </p>
          <div className="mt-6 border-t border-[#157083]/15 pt-6 dark:border-slate-800">
            <h2 className="mb-2 text-sm font-semibold" style={{ color: accent }}>
              {t.resendTitle}
            </h2>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-300">{t.resendHint}</p>
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
      </PageShell>
    </div>
  );
}
