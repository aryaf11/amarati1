import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction, sendPhoneOtpAction, updateProfileAction } from "@/actions/auth";
import { TopNav } from "@/components/TopNav";
import { ProfileSettings } from "@/components/ProfileSettings";
import { SubmitButton } from "@/components/SubmitButton";
import { Button, Card, Input, PageShell } from "@/components/ui";
import { PassportIcon, UserCircleIcon } from "@/components/LandingIcons";
import { listMyBuildings } from "@/lib/access";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { isEmailVerificationRequired } from "@/lib/send-verification-email";
import { ui, pickDateLocale } from "@/lib/ui-strings";
import { userMeetsVerificationRequirement } from "@/lib/verification-gate";

const accent = "var(--accent)";

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
  const fullyVerified = !verifyOn || userMeetsVerificationRequirement(user);
  const emailOk = Boolean(user.emailVerifiedAt);
  const phoneOk = Boolean(user.phoneVerifiedAt);
  const dateFmt = new Intl.DateTimeFormat(pickDateLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const eventDateFmt = new Intl.DateTimeFormat(pickDateLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const memberships = await listMyBuildings(user.id);
  const unitIds = memberships.map((m) => m.unitId);
  const recentEvents = unitIds.length
    ? await prisma.apartmentHistoryEvent.findMany({
        where: { unitId: { in: unitIds } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const eventsByUnit = new Map<
    string,
    { id: string; title: string; detail: string | null; createdAt: Date }[]
  >();
  for (const e of recentEvents) {
    const list = eventsByUnit.get(e.unitId) ?? [];
    if (list.length < 4) {
      list.push({
        id: e.id,
        title: e.title,
        detail: e.detail,
        createdAt: e.createdAt,
      });
      eventsByUnit.set(e.unitId, list);
    }
  }

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
            {t.subtitle.trim() ? (
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t.subtitle}
              </p>
            ) : null}
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

        <Card title={t.accountTitle}>
          <form action={updateProfileAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">{t.name}</label>
              <Input name="name" defaultValue={user.name} required minLength={2} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">{t.email}</label>
              {user.email ? (
                <Input value={user.email} disabled readOnly dir="ltr" className="text-left opacity-70" />
              ) : (
                <Input
                  name="newEmail"
                  type="email"
                  dir="ltr"
                  className="text-left"
                  placeholder={t.emailOptionalPlaceholder}
                  autoComplete="email"
                />
              )}
              {verifyOn ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {user.email ? (
                    <>
                      <span
                        className={
                          emailOk
                            ? "inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
                            : "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                        }
                      >
                        ● {emailOk ? t.emailVerifiedYes : t.emailVerifiedNo}
                      </span>
                      {!emailOk ? (
                        <a
                          href="/register/check-email"
                          className="font-medium underline"
                          style={{ color: accent }}
                        >
                          {t.resendVerification}
                        </a>
                      ) : null}
                    </>
                  ) : null}
                  <span
                    className={
                      phoneOk
                        ? "inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
                        : "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                    }
                  >
                    ● {phoneOk ? t.phoneVerifiedYes : t.phoneVerifiedNo}
                  </span>
                  {!phoneOk ? (
                    <Link
                      href="/register/verify-phone"
                      className="font-medium underline"
                      style={{ color: accent }}
                    >
                      {locale === "ar" ? "إدخال رمز الجوال" : "Enter phone code"}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">{t.phone}</label>
              <Input
                name="phone"
                defaultValue={user.phone}
                required
                minLength={8}
                dir="ltr"
                className="text-left"
                autoComplete="tel"
              />
              {verifyOn && !phoneOk ? (
                <SubmitButton
                  formAction={sendPhoneOtpAction}
                  className="mt-2 !py-2 !text-xs"
                  pendingLabel="…"
                  variant="ghost"
                >
                  {t.sendPhoneOtp}
                </SubmitButton>
              ) : null}
            </div>
            {verifyOn && !fullyVerified ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                {t.emailVerifiedNo} / {t.phoneVerifiedNo} —{" "}
                {locale === "ar" ? "أكمل أحدهما للدخول." : "Complete one to sign in."}
              </p>
            ) : null}
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {t.memberSince}{" "}
              <span dir="ltr">{dateFmt.format(user.createdAt)}</span>
            </p>
            <SubmitButton className="w-full" pendingLabel={t.saving}>
              {t.save}
            </SubmitButton>
          </form>
        </Card>

        <Card title={t.passportTitle}>
          {t.passportHint.trim() ? (
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-300">
              {t.passportHint}
            </p>
          ) : null}
          {memberships.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">{t.passportNoUnits}</p>
          ) : (
            <ul className="space-y-4">
              {memberships.map((m) => {
                const events = eventsByUnit.get(m.unitId) ?? [];
                const b = m.unit.building;
                return (
                  <li
                    key={m.id}
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: "var(--card-border)",
                      backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-2xl"
                          style={{
                            backgroundColor: "var(--accent-soft)",
                            color: accent,
                          }}
                          aria-hidden
                        >
                          <PassportIcon />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold" style={{ color: accent }}>
                            {b.name}
                          </p>
                          <p className="text-xs text-muted">
                            {ui(locale).buildingHome.unitPrefix} {m.unit.label}
                            {b.city ? ` · ${b.city}` : ""}
                          </p>
                          <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted">
                            {b.address}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/building/${b.id}/passport`}
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:shadow"
                        style={{
                          borderColor: "var(--accent)",
                          color: accent,
                          backgroundColor: "var(--card)",
                        }}
                      >
                        {t.passportOpen}
                      </Link>
                    </div>
                    {events.length === 0 ? (
                      <p className="mt-3 text-xs text-muted">{t.passportNoEvents}</p>
                    ) : (
                      <ul className="mt-3 space-y-2 text-sm">
                        {events.map((e) => (
                          <li
                            key={e.id}
                            className="rounded-xl border p-2.5"
                            style={{
                              borderColor: "var(--card-border)",
                              backgroundColor: "var(--card)",
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{e.title}</p>
                              <span dir="ltr" className="text-[11px] text-muted">
                                {eventDateFmt.format(e.createdAt)}
                              </span>
                            </div>
                            {e.detail ? (
                              <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-muted">
                                {e.detail}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={t.settingsTitle}>
          <ProfileSettings
            locale={locale}
            t={{
              themeLabel: t.themeLabel,
              themeLight: t.themeLight,
              themeDark: t.themeDark,
              notificationsLabel: t.notificationsLabel,
              notificationsOn: t.notificationsOn,
              notificationsOff: t.notificationsOff,
              notificationsHint: t.notificationsHint,
            }}
          />
        </Card>

        <form action={logoutAction}>
          <Button type="submit" variant="ghost" className="w-full">
            {t.logout}
          </Button>
        </form>
      </PageShell>
    </div>
  );
}
