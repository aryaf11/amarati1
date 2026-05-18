import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { resendPhoneOtpAction, verifyPhoneOtpAction } from "@/actions/auth";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { isTwilioSmsConfigured } from "@/lib/twilio-sms";
import { isTwilioVerifyConfigured } from "@/lib/twilio-verify";
import { isWhatsappOtpConfigured } from "@/lib/whatsapp-otp";
import { ui } from "@/lib/ui-strings";
import { Card, Input, PageShell } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

const accent = "var(--accent)";

/** نظهر الرمز في الواجهة فقط للتطوير وعند عدم تهيئة أي مزوّد إرسال، حتى يمكن اختبار التدفّق محلياً. */
async function devOtpCodeFor(identifier: string): Promise<string | null> {
  if (process.env.NODE_ENV === "production") return null;
  // مع Twilio Verify لا نملك الرمز محلياً — Twilio يديره. لا تعرض شيئاً في هذه الحالة.
  if (isTwilioVerifyConfigured()) return null;
  if (isTwilioSmsConfigured() || isWhatsappOtpConfigured()) return null;
  const trimmed = identifier.trim();
  if (trimmed.length < 3) return null;
  const where = trimmed.includes("@")
    ? { email: trimmed.toLowerCase() }
    : { phone: trimmed.replace(/\s+/g, "") };
  try {
    const user = await prisma.user.findUnique({
      where,
      select: { phoneOtpCode: true, phoneOtpExpires: true },
    });
    if (!user?.phoneOtpCode || !user.phoneOtpExpires) return null;
    if (user.phoneOtpExpires.getTime() <= Date.now()) return null;
    return user.phoneOtpCode;
  } catch {
    return null;
  }
}

export default async function RegisterVerifyPhonePage({
  searchParams,
}: {
  searchParams: Promise<{
    identifier?: string;
    email?: string;
    error?: string;
    sent?: string;
  }>;
}) {
  const locale = await getLocale();
  const tv = ui(locale).verifyPhone;
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const sent = sp.sent === "1";
  const identifierDefault =
    (typeof sp.identifier === "string" ? sp.identifier.trim() : "") ||
    (typeof sp.email === "string" ? sp.email.trim() : "");
  const devCode = sent ? await devOtpCodeFor(identifierDefault) : null;

  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell className="max-w-md">
        <Card title={tv.title}>
          <p className="mb-4 text-sm text-muted">{tv.subtitle}</p>
          {sent ? (
            <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
              {tv.codeSent}
            </p>
          ) : null}
          {err ? (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </p>
          ) : null}
          {devCode ? (
            <p
              dir="ltr"
              className="mb-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
            >
              <span className="block text-xs opacity-80">{tv.devCodeNotice}</span>
              <span className="font-mono text-base tracking-widest">{devCode}</span>
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
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="block text-xs text-muted">{tv.codeLabel}</label>
                <SubmitButton
                  formAction={resendPhoneOtpAction}
                  formNoValidate
                  variant="ghost"
                  className="!px-3 !py-1 !text-xs"
                  pendingLabel={tv.sendCodePending}
                >
                  {sent ? tv.resendCode : tv.sendCode}
                </SubmitButton>
              </div>
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
