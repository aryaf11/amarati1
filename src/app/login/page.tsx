import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { getCurrentUser } from "@/lib/current-user";
import { TopNav } from "@/components/TopNav";
import { getLocale } from "@/lib/locale";
import { isEmailVerificationRequired } from "@/lib/send-verification-email";
import { ui } from "@/lib/ui-strings";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthPageShell, Card, Input } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import { LoginDoorIcon, PlusIcon } from "@/components/LandingIcons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    next?: string;
    verified?: string;
    noAccount?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const locale = await getLocale();
  const t = ui(locale).login;
  const tLanding = ui(locale).landing;
  const verifyOn = isEmailVerificationRequired();
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const ok = sp.verified === "1";
  const noAccount = sp.noAccount === "1";
  const logoAlt = tLanding.logoAlt;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <AuthPageShell>
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.svg"
            alt={logoAlt}
            width={84}
            height={84}
            className="size-20 rounded-2xl shadow-md sm:size-24"
            priority
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-accent">
            {tLanding.nameAr}
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            AMARATI
          </p>
          <p className="mt-3 text-sm text-muted">{tLanding.tagline}</p>
        </div>

        <Card title={t.title}>
          {t.subtitle.trim() ? (
            <p className="mb-4 text-xs leading-relaxed text-muted">{t.subtitle}</p>
          ) : null}
          {ok && verifyOn ? (
            <p className="mb-3 rounded-xl border px-3 py-2 text-sm border-accent-soft bg-accent-soft text-accent-strong">
              {t.emailVerified}
            </p>
          ) : null}
          {err ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              <p>{err}</p>
              {noAccount ? (
                <p className="mt-2">
                  <Link
                    href="/signup"
                    className="font-semibold underline text-accent"
                  >
                    {t.signUp}
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}
          <form action={loginAction} className="space-y-3">
            <input type="hidden" name="next" value={sp.next ?? ""} />
            <div>
              <label className="mb-1 block text-xs text-muted">{t.identifier}</label>
              <Input
                name="identifier"
                type="text"
                required
                dir="ltr"
                className="text-left"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">{t.password}</label>
              <PasswordInput
                name="password"
                required
                minLength={1}
                dir="ltr"
                className="text-left"
                autoComplete="current-password"
                showLabel={t.showPassword}
                hideLabel={t.hidePassword}
              />
            </div>
            <SubmitButton className="w-full" pendingLabel={t.submitPending}>
              <LoginDoorIcon className="size-4" />
              {t.submit}
            </SubmitButton>
          </form>

          {verifyOn ? (
            <p className="mt-3 text-center text-xs text-muted">
              {t.resendVerifyHint}{" "}
              <Link href="/register/check-email" className="font-medium underline text-accent">
                {t.resendVerifyLink}
              </Link>
            </p>
          ) : null}
        </Card>

        <div className="rounded-2xl border p-4 text-center text-sm border-accent-soft" style={{ backgroundColor: "color-mix(in srgb, var(--card) 70%, transparent)" }}>
          <p className="text-muted">{t.noAccount}</p>
          <Link
            href="/signup/join"
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold border-2 border-accent text-accent transition hover:bg-[var(--accent-soft)]"
          >
            <PlusIcon className="size-4" />
            {t.signUp}
          </Link>
        </div>
      </AuthPageShell>
    </div>
  );
}
