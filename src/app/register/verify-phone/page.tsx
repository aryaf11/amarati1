import Image from "next/image";
import { redirect } from "next/navigation";
import {
  resendPhoneOtpAction,
  verifyPhoneOtpAction,
} from "@/actions/auth";
import { getCurrentUser } from "@/lib/current-user";
import { TopNav } from "@/components/TopNav";
import { getLocale } from "@/lib/locale";
import { isTwilioVerifyConfigured } from "@/lib/twilio-verify";
import { ui } from "@/lib/ui-strings";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthPageShell, Card, Input } from "@/components/ui";

function normalizePhoneDigits(raw: string) {
  return raw.replace(/\s+/g, "");
}

function validateNext(raw: string | undefined) {
  if (raw?.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

/**
 * OTP بعد التسجيل أو تسجيل الدخول (جوال غير موثَّق الجلسة).
 */
export default async function RegisterVerifyPhonePage({
  searchParams,
}: {
  searchParams: Promise<{
    phone?: string;
    next?: string;
    error?: string;
    sent?: string;
    throttled?: string;
  }>;
}) {
  const locale = await getLocale();
  const tv = ui(locale).verifyPhone;
  const tLanding = ui(locale).landing;
  const sp = await searchParams;

  const user = await getCurrentUser();

  const fromQuery = normalizePhoneDigits(
    sp.phone ? decodeURIComponent(sp.phone) : "",
  );
  const profilePhone =
    normalizePhoneDigits(user?.phone?.trim() ?? "") || "";

  /** رقم المحاولة الوحيد الموثَّق؛ يفضَّل المتطابق للحساب المسجَّل الدخول. */
  let phoneEffective = fromQuery;
  if (
    user &&
    profilePhone &&
    fromQuery &&
    fromQuery !== profilePhone
  ) {
    redirect(
      `/register/verify-phone?${new URLSearchParams({
        phone: profilePhone,
        ...(sp.next?.startsWith("/") && !sp.next.startsWith("//")
          ? { next: validateNext(sp.next) }
          : {}),
      })}`,
    );
  }
  if (!phoneEffective && profilePhone) {
    phoneEffective = profilePhone;
  }

  if (!phoneEffective.trim()) {
    redirect("/login");
  }

  const safeNext = validateNext(sp.next ? decodeURIComponent(sp.next) : undefined);

  if (user?.phoneVerifiedAt) {
    redirect(safeNext);
  }

  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const sentAck = sp.sent === "1";
  const throttled = sp.throttled === "1";
  const showDevOtpNotice = !isTwilioVerifyConfigured();

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <AuthPageShell>
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.svg"
            alt={tLanding.logoAlt}
            width={84}
            height={84}
            className="size-20 rounded-2xl shadow-md sm:size-24"
            priority
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-accent">
            {tLanding.nameAr}
          </h1>
          <p className="mt-3 text-sm text-muted">{tv.subtitle}</p>
        </div>

        <Card title={tv.title}>
          {err ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              <p>{err}</p>
            </div>
          ) : null}
          {sentAck ? (
            <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/35 dark:text-emerald-100">
              {tv.codeSent}
            </p>
          ) : null}
          {throttled ? (
            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/35 dark:text-amber-100">
              {tv.resendTooSoon}
            </p>
          ) : null}
          {showDevOtpNotice ? (
            <p className="mb-3 text-xs leading-relaxed text-muted">
              {tv.devCodeNotice}
            </p>
          ) : null}

          <form action={verifyPhoneOtpAction} className="space-y-3">
            <input type="hidden" name="next" value={safeNext} />
            <div>
              <label className="mb-1 block text-xs text-muted">
                {tv.phoneLabel}
              </label>
              <Input
                name="phone"
                type="text"
                required
                dir="ltr"
                className="text-left"
                autoComplete="tel"
                defaultValue={phoneEffective}
                readOnly={Boolean(fromQuery)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                {tv.codeLabel}
              </label>
              <Input
                name="code"
                type="text"
                inputMode="numeric"
                pattern="\\d{6}"
                required
                minLength={6}
                maxLength={6}
                dir="ltr"
                className="text-left"
                placeholder="______"
              />
            </div>
            <SubmitButton className="w-full" pendingLabel={tv.submitPending}>
              {tv.submit}
            </SubmitButton>
          </form>

          <form action={resendPhoneOtpAction} className="mt-4">
            <input type="hidden" name="next" value={safeNext} />
            <input type="hidden" name="phone" value={phoneEffective} />
            <SubmitButton
              variant="ghost"
              className="w-full"
              pendingLabel={tv.sendCodePending}
            >
              {tv.resendCode}
            </SubmitButton>
          </form>
        </Card>
      </AuthPageShell>
    </div>
  );
}
