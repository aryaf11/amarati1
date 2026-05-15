import Link from "next/link";
import { redirect } from "next/navigation";
import { signupAndJoinBuildingAction } from "@/actions/signup";
import { TopNav } from "@/components/TopNav";
import { Card, Input, PageShell } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { KeyIcon } from "@/components/LandingIcons";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

export default async function SignupJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const locale = await getLocale();
  const t = ui(locale).signup;
  const tr = ui(locale).register;
  const td = ui(locale).dashboard;
  const tl = ui(locale).login;
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;

  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell className="max-w-xl">
        <header className="flex items-center gap-3">
          <span
            className="inline-flex size-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
            aria-hidden
          >
            <KeyIcon className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-accent">{t.headerJoin}</h1>
            <p className="text-sm text-muted">{t.choiceJoinDesc}</p>
          </div>
        </header>

        {err ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {err}
          </p>
        ) : null}

        <form action={signupAndJoinBuildingAction} className="space-y-6">
          <Card title={t.yourInfoTitle}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted">{tr.name}</label>
                <Input name="name" required minLength={2} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">{tr.phone}</label>
                <Input name="phone" required minLength={8} dir="ltr" className="text-left" autoComplete="tel" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">{tr.email}</label>
                <Input name="email" type="email" dir="ltr" className="text-left" autoComplete="email" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-muted">{tr.password}</label>
                <PasswordInput
                  name="password"
                  required
                  minLength={6}
                  dir="ltr"
                  className="text-left"
                  autoComplete="new-password"
                  showLabel={tl.showPassword}
                  hideLabel={tl.hidePassword}
                />
              </div>
            </div>
          </Card>

          <Card title={t.joinInfoTitle}>
            <p className="mb-3 text-sm text-muted">{td.joinHint}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted">{td.inviteCode}</label>
                <Input name="inviteCode" dir="ltr" className="text-left uppercase" required />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">{td.unitNumber}</label>
                <Input name="unitLabel" required />
              </div>
            </div>
          </Card>

          <SubmitButton className="w-full" pendingLabel={t.submitPending}>
            {t.submitJoin}
          </SubmitButton>
        </form>

        <p className="text-center text-sm text-muted">
          {t.haveAccount}{" "}
          <Link href="/login" className="font-semibold underline text-accent">
            {t.backLogin}
          </Link>
        </p>
      </PageShell>
    </div>
  );
}
