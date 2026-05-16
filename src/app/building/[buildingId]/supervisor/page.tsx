import { notFound, redirect } from "next/navigation";
import { supervisorRefreshInsightsAction } from "@/actions/platform";
import { MonthlyScoreLog } from "@/components/MonthlyScoreLog";
import { loadBuildingContext } from "@/lib/building-context";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { prisma } from "@/lib/prisma";
import { Button, Card } from "@/components/ui";

export default async function SupervisorPage({
  params,
  searchParams,
}: {
  params: Promise<{ buildingId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { buildingId } = await params;
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { building, membership } = await loadBuildingContext(buildingId, user.id);
  if (!building || !membership) notFound();
  const locale = await getLocale();
  const s = ui(locale).supervisor;
  if (!membership.isSupervisor) {
    return (
      <Card title={s.panelTitle}>
        <p className="text-sm text-slate-600 dark:text-slate-300">{s.only}</p>
      </Card>
    );
  }
  const scores = await prisma.buildingHealthScore.findMany({
    where: { buildingId },
    orderBy: { month: "desc" },
    take: 6,
  });
  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <Card title={s.refreshTitle}>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{s.refreshP1}</p>
        <form action={supervisorRefreshInsightsAction}>
          <input type="hidden" name="buildingId" value={buildingId} />
          <Button type="submit">{s.refreshBtn}</Button>
        </form>
      </Card>
      <Card title={s.scoreTitle}>
        <MonthlyScoreLog scores={scores} locale={locale} />
      </Card>
    </div>
  );
}
