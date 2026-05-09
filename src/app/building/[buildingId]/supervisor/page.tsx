import { notFound, redirect } from "next/navigation";
import { supervisorRefreshInsightsAction } from "@/actions/platform";
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
  const m = ui(locale).maintenance;
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
  const alerts = await prisma.predictiveMaintenanceAlert.findMany({
    where: { buildingId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const reportRows = await prisma.maintenanceRequest.findMany({
    where: { buildingId },
    orderBy: { createdAt: "desc" },
    take: 15,
    include: { unit: true },
  });
  const scopeCell = (scope: string) =>
    scope === "PERSONAL" ? m.scopeLabelPersonal : m.scopeLabelCommunity;
  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <Card title={s.refreshTitle}>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{s.refreshP1}</p>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{s.refreshP2}</p>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{s.refreshP3}</p>
        <form action={supervisorRefreshInsightsAction}>
          <input type="hidden" name="buildingId" value={buildingId} />
          <Button type="submit">{s.refreshBtn}</Button>
        </form>
      </Card>
      <Card title={s.scoreTitle}>
        <ul className="space-y-2 text-sm">
          {scores.map((sc) => (
            <li key={sc.id} className="flex justify-between gap-2">
              <span>{sc.month}</span>
              <span className="font-mono font-semibold">{sc.score}</span>
            </li>
          ))}
        </ul>
        {scores.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{s.scoreEmpty}</p>
        ) : null}
      </Card>
      <Card title={s.alertsTitle}>
        <ul className="space-y-2 text-sm">
          {alerts.map((a) => (
            <li key={a.id} className="rounded-lg border border-slate-100 p-2 dark:border-slate-800">
              <p className="font-medium">{a.title}</p>
              <p className="text-xs text-slate-500">{a.severity}</p>
              <p className="mt-1">{a.detail}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={s.reportTitle}>
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{s.reportHint}</p>
        <div className="overflow-x-auto text-xs">
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="p-2">{s.thTitle}</th>
                <th className="p-2">{s.thScope}</th>
                <th className="p-2">{s.thStatus}</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-900">
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{scopeCell(r.scope)}</td>
                  <td className="p-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
