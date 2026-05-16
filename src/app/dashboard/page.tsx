import { redirect } from "next/navigation";
import { joinBuildingPublicCodeAction } from "@/actions/building";
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
  const locale = await getLocale();
  const sp = await searchParams;
  let items: Awaited<ReturnType<typeof listMyBuildings>> = [];
  let loadError: string | null = null;
  try {
    items = await listMyBuildings(user.id);
  } catch (e) {
    loadError =
      e instanceof Error
        ? e.message
        : locale === "ar"
          ? "تعذّر تحميل بيانات المباني. جرّب إعادة التحميل لاحقاً."
          : "Could not load your buildings. Try again later.";
  }
  const t = ui(locale).dashboard;
  const th = ui(locale).buildingHome;
  const err =
    loadError ?? (sp.error ? decodeURIComponent(sp.error) : null);
  const memberIds = new Set(items.map((m) => m.unit.building.id));
  const openRaw = typeof sp.open === "string" ? sp.open.trim() : "";
  const focusBuildingId =
    openRaw && memberIds.has(openRaw) ? openRaw : items[0]?.unit.building.id ?? null;
  const focusBuilding = focusBuildingId
    ? items.find((m) => m.unit.building.id === focusBuildingId)?.unit.building
    : null;
  const hasBuildings = items.length > 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <PageShell>
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: accent }}>
            {hasBuildings && focusBuilding
              ? focusBuilding.name
              : hasBuildings
                ? th.overviewSection
                : t.title}
          </h1>
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
          <Card title={t.joinCard} className="mx-auto max-w-lg">
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
              <Button type="submit" className="w-full">
                {t.joinSubmit}
              </Button>
            </form>
          </Card>
        )}
      </PageShell>
    </div>
  );
}
