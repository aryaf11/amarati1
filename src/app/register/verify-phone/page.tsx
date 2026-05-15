import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { verifyPhoneOtpAction } from "@/actions/auth";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Card, Input, PageShell } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

const accent = "var(--accent)";

export default async function RegisterVerifyPhonePage({
  searchParams,
}: {
  searchParams: Promise<{ identifier?: string; email?: string; error?: string }>;
}) {
  const locale = await getLocale();
  const tv = ui(locale).verifyPhone;
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const identifierDefault =
    (typeof sp.identifier === "string" ? sp.identifier.trim() : "") ||
    (typeof sp.email === "string" ? sp.email.trim() : "");

  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell className="max-w-md">
        <Card title={tv.title}>
          <p className="mb-4 text-sm text-muted">{tv.subtitle}</p>
          {err ? (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </p>
          ) : null}
          <form action={verifyPhoneOtpAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted">{tv.identifierLabel}</label>
              <Input
                name="identifier"
                type="text"
                required
                dir="ltr"
                className="text-left"
                defaultValue={identifierDefault}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">{tv.codeLabel}</label>
              <Input
                name="code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                minLength={6}
                required
                dir="ltr"
                className="text-left font-mono tracking-widest"
                placeholder="000000"
                autoComplete="one-time-code"
              />
            </div>
            <SubmitButton className="w-full" pendingLabel={tv.submitPending}>
              {tv.submit}
            </SubmitButton>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link href="/register/check-email" className="font-medium underline" style={{ color: accent }}>
              {locale === "ar" ? "التحقق بالبريد بدلاً من ذلك" : "Use email verification instead"}
            </Link>
          </p>
        </Card>
      </PageShell>
    </div>
  );
}
