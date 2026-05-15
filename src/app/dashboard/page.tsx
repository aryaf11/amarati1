import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createBuildingAction,
  joinBuildingPublicCodeAction,
} from "@/actions/building";
import { BuildingQuickWidgets } from "@/components/BuildingQuickWidgets";
import { listMyBuildings } from "@/lib/access";
import { getCurrentUser } from "@/lib/current-user";
import { TopNav } from "@/components/TopNav";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Button, Card, Input, PageShell } from "@/components/ui";

const accent = "var(--accent)";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; open?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [locale, items, sp] = await Promise.all([
    getLocale(),
    listMyBuildings(user.id),
    searchParams,
  ]);
  const t = ui(locale).dashboard;
  const th = ui(locale).buildingHome;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const memberIds = new Set(items.map((m) => m.unit.building.id));
  const openRaw = typeof sp.open === "string" ? sp.open.trim() : "";
  const focusBuildingId =
    openRaw && memberIds.has(openRaw) ? openRaw : items[0]?.unit.building.id ?? null;
  const focusBuilding = focusBuildingId
    ? items.find((m) => m.unit.building.id === focusBuildingId)?.unit.building
    : null;
  const hasBuildings = items.length > 0;

  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell>
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: accent }}>
              {hasBuildings && focusBuilding
                ? focusBuilding.name
                : hasBuildings
                  ? th.overviewSection
                  : t.title}
            </h1>
            {hasBuildings ? (
              <Link
                href="/dashboard/new"
                className="shrink-0 text-sm font-semibold underline underline-offset-2 transition hover:opacity-90"
                style={{ color: accent }}
              >
                {t.createAnotherBuilding}
              </Link>
            ) : null}
          </div>
          {hasBuildings ? null : (
            <p className="text-sm text-muted">{t.subtitle}</p>
          )}
        </header>
        {err ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {err}
          </p>
        ) : null}

        {hasBuildings ? (
          focusBuildingId ? (
            <BuildingQuickWidgets
              buildingId={focusBuildingId}
              userId={user.id}
              locale={locale}
            />
          ) : null
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title={t.createBuilding}>
              <p className="mb-3 rounded-xl border px-3 py-2 text-xs leading-relaxed text-muted" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--accent-soft)" }}>
                {t.firstTimeHint}
              </p>
              <p className="mb-4 text-xs leading-relaxed text-muted">{t.addressHelp}</p>
              <form action={createBuildingAction} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">{t.name}</label>
                  <Input name="name" required placeholder={t.namePh} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">{t.city}</label>
                  <Input name="city" required placeholder={t.cityPh} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">{t.addressLine}</label>
                  <Input name="address" required placeholder={t.addressLinePh} />
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
