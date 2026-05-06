import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { getCurrentUser } from "@/lib/current-user";
import { TopNav } from "@/components/TopNav";
import { getLocale } from "@/lib/locale";
import { isEmailVerificationRequired } from "@/lib/send-verification-email";
import { ui } from "@/lib/ui-strings";
import { SubmitButton } from "@/components/SubmitButton";
import { Card, Input, PageShell } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    next?: string;
    verified?: string;
    create?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const locale = await getLocale();
  const t = ui(locale).login;
  const verifyOn = isEmailVerificationRequired();
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const ok = sp.verified === "1";
  const isCreateFlow = sp.create === "1";

  const heading = isCreateFlow
    ? locale === "en"
      ? "Create your building"
      : "إنشاء مبناك"
    : t.title;
  const subtitle = isCreateFlow
    ? locale === "en"
      ? "Enter your email and a new password (6+ characters) — we’ll create your account, then you can register your building."
      : "أدخل بريدك وكلمة مرور جديدة (٦ أحرف فأكثر) — ننشئ حسابك مباشرة، ثم تسجّل مبناك."
    : t.subtitle;

  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell className="max-w-md">
        <Card title={heading}>
          <p className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {subtitle}
          </p>
          {ok && verifyOn ? (
            <p className="mb-3 rounded-xl border border-teal-200 bg-teal-50/80 px-3 py-2 text-sm text-teal-900 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-100">
              {t.emailVerified}
            </p>
          ) : null}
          {err ? (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
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
              <Input name="password" type="password" required minLength={1} dir="ltr" className="text-left" />
            </div>
            <SubmitButton className="w-full" pendingLabel={t.submitPending}>
              {t.submit}
            </SubmitButton>
          </form>
          {verifyOn ? (
            <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
              {t.resendVerifyHint}{" "}
              <Link
                href="/register/check-email"
                className="font-medium underline"
                style={{ color: "#157083" }}
              >
                {t.resendVerifyLink}
              </Link>
            </p>
          ) : null}
        </Card>
      </PageShell>
    </div>
  );
}
