import Link from "next/link";
import { redirect } from "next/navigation";
import { signupAndCreateBuildingAction } from "@/actions/signup";
import { TopNav } from "@/components/TopNav";
import { Card, Input, PageShell } from "@/components/ui";
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
  const splUrl =
    locale === "en"
      ? "https://splonline.com.sa/en/national-address-1/"
      : "https://splonline.com.sa/ar/national-address-1/";

  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell className="max-w-2xl">
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
            <p className="text-sm text-muted">{t.choiceCreateDesc}</p>
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
                <label className="mb-1 block text-xs text-muted">{tr.email}</label>
                <Input name="email" type="email" required dir="ltr" className="text-left" autoComplete="email" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">{tr.phone}</label>
                <Input name="phone" dir="ltr" className="text-left" />
              </div>
              <div>
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
            <p className="mb-4 text-xs leading-relaxed text-muted">
              {td.splHintBefore}
              <a
                href={splUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline text-accent"
              >
                {td.splLink}
              </a>
              {td.splHintAfter}
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted">{td.name}</label>
                <Input name="buildingName" required placeholder={td.namePh} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted">{td.region}</label>
                  <Input name="region" required placeholder={td.regionPh} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">{td.city}</label>
                  <Input name="city" required placeholder={td.cityPh} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted">{td.district}</label>
                  <Input name="district" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">{td.streetName}</label>
                  <Input name="streetName" required />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted">{td.buildingNumber}</label>
                  <Input name="buildingNumber" required dir="ltr" className="text-left" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">{td.additionalNumber}</label>
                  <Input name="additionalNumber" dir="ltr" className="text-left" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted">{td.postalCode}</label>
                  <Input name="postalCode" required maxLength={5} minLength={5} dir="ltr" className="text-left" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">{td.shortAddressCode}</label>
                  <Input name="shortAddressCode" maxLength={8} minLength={8} dir="ltr" className="text-left" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-muted">{td.geoHint}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted">{td.latitude}</label>
                    <Input name="latitude" dir="ltr" className="text-left" placeholder="24.7136" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">{td.longitude}</label>
                    <Input name="longitude" dir="ltr" className="text-left" placeholder="46.6753" />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">{td.unitLabel}</label>
                <Input name="unitLabel" required placeholder={td.unitPh} />
              </div>
            </div>
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
      </PageShell>
    </div>
  );
}
