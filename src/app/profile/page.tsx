import { redirect } from "next/navigation";
import { logoutAction, updateProfileAction } from "@/actions/auth";
import { TopNav } from "@/components/TopNav";
import { ProfileSettings } from "@/components/ProfileSettings";
import { SubmitButton } from "@/components/SubmitButton";
import { Button, Card, Input, PageShell } from "@/components/ui";
import { UserCircleIcon } from "@/components/LandingIcons";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { isEmailVerificationRequired } from "@/lib/send-verification-email";
import { ui, pickDateLocale } from "@/lib/ui-strings";

const accent = "#157083";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  const locale = await getLocale();
  const t = ui(locale).profile;
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const saved = sp.saved === "1";
  const verifyOn = isEmailVerificationRequired();
  const verified = !verifyOn || Boolean(user.emailVerifiedAt);
  const dateFmt = new Intl.DateTimeFormat(pickDateLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell className="max-w-3xl">
        <header className="flex items-center gap-4">
          <span
            className="inline-flex size-14 items-center justify-center rounded-2xl shadow-sm"
            style={{ backgroundColor: "rgba(21,112,131,0.12)", color: accent }}
            aria-hidden
          >
            <UserCircleIcon className="size-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: accent }}>
              {t.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">{t.subtitle}</p>
          </div>
        </header>

        {saved ? (
          <p className="rounded-2xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm text-teal-900 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-100">
            {t.saved}
          </p>
        ) : null}
        {err ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {err}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title={t.accountTitle}>
            <form action={updateProfileAction} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.name}</label>
                <Input name="name" defaultValue={user.name} required minLength={2} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.email}</label>
                <Input value={user.email} disabled readOnly dir="ltr" className="text-left opacity-70" />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200">
                      ● {t.emailVerifiedYes}
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                        ● {t.emailVerifiedNo}
                      </span>
                      <a
                        href="/register/check-email"
                        className="font-medium underline"
                        style={{ color: accent }}
                      >
                        {t.resendVerification}
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.phone}</label>
                <Input
                  name="phone"
                  defaultValue={user.phone ?? ""}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                {t.memberSince}{" "}
                <span dir="ltr">{dateFmt.format(user.createdAt)}</span>
              </p>
              <SubmitButton className="w-full" pendingLabel={t.saving}>
                {t.save}
              </SubmitButton>
            </form>
          </Card>

          <div className="space-y-6">
            <Card title={t.settingsTitle}>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-300">{t.settingsHint}</p>
              <ProfileSettings
                locale={locale}
                t={{
                  themeLabel: t.themeLabel,
                  themeLight: t.themeLight,
                  themeDark: t.themeDark,
                  themeSystem: t.themeSystem,
                  languageLabel: t.languageLabel,
                  notificationsLabel: t.notificationsLabel,
                  notificationsOn: t.notificationsOn,
                  notificationsOff: t.notificationsOff,
                  notificationsHint: t.notificationsHint,
                }}
              />
            </Card>

            <Card title={t.sessionTitle}>
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-300">{t.sessionHint}</p>
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" className="w-full">
                  {t.logout}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
