import Link from "next/link";
import { redirect } from "next/navigation";
import { signupAndCreateBuildingAction } from "@/actions/signup";
import { TopNav } from "@/components/TopNav";
import { AuthPageShell, Card, Input } from "@/components/ui";
import { NationalAddressFields } from "@/components/NationalAddressFields";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { BuildingIcon } from "@/components/LandingIcons";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

export default async function SignupCreatePage({
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
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <AuthPageShell className="max-w-2xl">
        <header className="flex items-center gap-3">
          <span
            className="inline-flex size-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
            aria-hidden
          >
            <BuildingIcon className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-accent">{t.headerCreate}</h1>
          </div>
        </header>

        {err ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {err}
          </p>
        ) : null}

        <form action={signupAndCreateBuildingAction} className="space-y-6">
          <Card title={t.yourInfoTitle}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted">{tr.name}</label>
                <Input name="name" required minLength={2} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">{tr.phone}</label>
                <Input
                  name="phone"
                  required
                  minLength={8}
                  dir="ltr"
                  className="text-left"
                  autoComplete="tel"
                />
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

          <Card title={t.buildingInfoTitle}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted">{td.name}</label>
                <Input name="buildingName" required minLength={2} placeholder={td.namePh} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">{td.unitLabel}</label>
                <Input name="unitLabel" required placeholder={td.unitPh} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-muted">{td.addressLine}</label>
                <Input name="addressLine" required placeholder={td.addressLinePh} />
                <p className="mt-1 text-xs text-muted">{td.addressHelp}</p>
              </div>
            </div>
          </Card>

          <Card title={td.nationalAddressTitle}>
            <NationalAddressFields locale={locale} />
          </Card>

          <SubmitButton className="w-full" pendingLabel={t.submitPending}>
            {t.submitCreate}
          </SubmitButton>
        </form>

        <p className="text-center text-sm text-muted">
          {t.haveAccount}{" "}
          <Link href="/login" className="font-semibold underline text-accent">
            {t.backLogin}
          </Link>
        </p>
      </AuthPageShell>
    </div>
  );
}
