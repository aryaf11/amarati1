import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createBuildingAction,
  joinBuildingPublicCodeAction,
} from "@/actions/building";
import { listMyBuildings } from "@/lib/access";
import { getCurrentUser } from "@/lib/current-user";
import { TopNav } from "@/components/TopNav";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Button, Card, Input, PageShell } from "@/components/ui";
import { BuildingIcon, HomeIcon } from "@/components/LandingIcons";

const accent = "var(--accent)";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [locale, items, sp] = await Promise.all([
    getLocale(),
    listMyBuildings(user.id),
    searchParams,
  ]);
  const t = ui(locale).dashboard;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const splUrl =
    locale === "en"
      ? "https://splonline.com.sa/en/national-address-1/"
      : "https://splonline.com.sa/ar/national-address-1/";
  const hasBuildings = items.length > 0;
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell>
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: accent }}>
            {hasBuildings ? t.titleMy : t.title}
          </h1>
          <p className="text-sm text-muted">
            {hasBuildings ? t.subtitleMy : t.subtitle}
          </p>
        </header>
        {err ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {err}
          </p>
        ) : null}

        {hasBuildings ? (
          <Card title={t.buildingsCard}>
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/building/${m.unit.building.id}`}
                    aria-label={`${t.openBuildingAria} ${m.unit.building.name}`}
                    className="group flex h-full cursor-pointer flex-col gap-3 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    style={{
                      borderColor: "var(--card-border)",
                      backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition group-hover:scale-105"
                        style={{ backgroundColor: "var(--accent-soft)", color: accent }}
                        aria-hidden
                      >
                        <BuildingIcon />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="truncate text-base font-bold leading-tight"
                          style={{ color: accent }}
                        >
                          {m.unit.building.name}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {t.unit} <span className="font-medium">{m.unit.label}</span>
                          {" · "}
                          {m.kind === "OWNER" ? t.owner : t.tenant}
                          {m.isSupervisor ? ` · ${t.supervisor}` : ""}
                        </p>
                        {m.unit.building.city ? (
                          <p className="mt-1 truncate text-xs text-muted">
                            {m.unit.building.city}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className="mt-auto inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition group-hover:brightness-105"
                      style={{
                        backgroundColor: "var(--accent)",
                        color: "var(--accent-foreground)",
                      }}
                    >
                      <HomeIcon className="size-4" />
                      <span>{t.openBuilding}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title={t.createBuilding}>
              <p className="mb-3 rounded-xl border px-3 py-2 text-xs leading-relaxed text-muted" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--accent-soft)" }}>
                {t.firstTimeHint}
              </p>
              <p className="mb-4 text-xs leading-relaxed text-muted">
                {t.splHintBefore}
                <a
                  href={splUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                  style={{ color: accent }}
                >
                  {t.splLink}
                </a>
                {t.splHintAfter}
              </p>
              <form action={createBuildingAction} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">{t.name}</label>
                  <Input name="name" required placeholder={t.namePh} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted">{t.region}</label>
                    <Input name="region" required placeholder={t.regionPh} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">{t.city}</label>
                    <Input name="city" required placeholder={t.cityPh} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted">{t.district}</label>
                    <Input name="district" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">{t.streetName}</label>
                    <Input name="streetName" required />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted">{t.buildingNumber}</label>
                    <Input name="buildingNumber" required dir="ltr" className="text-left" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">{t.additionalNumber}</label>
                    <Input name="additionalNumber" dir="ltr" className="text-left" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted">{t.postalCode}</label>
                    <Input name="postalCode" required maxLength={5} minLength={5} dir="ltr" className="text-left" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">{t.shortAddressCode}</label>
                    <Input name="shortAddressCode" maxLength={8} minLength={8} dir="ltr" className="text-left" />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-muted">{t.geoHint}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted">{t.latitude}</label>
                      <Input name="latitude" dir="ltr" className="text-left" placeholder="24.7136" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted">{t.longitude}</label>
                      <Input name="longitude" dir="ltr" className="text-left" placeholder="46.6753" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">{t.unitLabel}</label>
                  <Input name="unitLabel" placeholder={t.unitPh} required />
                </div>
                <Button type="submit" className="w-full">
                  {t.createSubmit}
                </Button>
              </form>
            </Card>
            <Card title={t.joinCard}>
              <p className="mb-3 text-sm text-muted">{t.joinHint}</p>
              <form action={joinBuildingPublicCodeAction} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">{t.inviteCode}</label>
                  <Input name="inviteCode" dir="ltr" className="text-left uppercase" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">{t.unitNumber}</label>
                  <Input name="unitLabel" required />
                </div>
                <Button type="submit" className="w-full" variant="ghost">
                  {t.joinSubmit}
                </Button>
              </form>
            </Card>
          </div>
        )}
      </PageShell>
    </div>
  );
}
