import { notFound, redirect } from "next/navigation";
import { createMaintenanceAction } from "@/actions/maintenance";
import { loadBuildingContext } from "@/components/BuildingNav";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { prisma } from "@/lib/prisma";
import { Button, Card, Input, TextArea } from "@/components/ui";

export default async function MaintenancePage({
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
  const m = ui(locale).maintenance;
  const rows = await prisma.maintenanceRequest.findMany({
    where: { buildingId },
    orderBy: { createdAt: "desc" },
    include: { unit: true },
  });
  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <Card title={m.newRequest}>
        <form action={createMaintenanceAction} className="space-y-3">
          <input type="hidden" name="buildingId" value={buildingId} />
          <div>
            <label className="mb-1 block text-xs text-slate-500">{m.type}</label>
            <select
              name="scope"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="PERSONAL">{m.scopePersonal}</option>
              <option value="COMMUNITY">{m.scopeCommunity}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">{m.title}</label>
            <Input name="title" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">{m.problem}</label>
            <TextArea name="description" rows={4} required />
          </div>
          <Button type="submit" className="w-full">
            {m.submitAi}
          </Button>
        </form>
      </Card>
      <Card title={m.requests}>
        <ul className="space-y-4">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-xs text-slate-500">
                    {r.scope === "PERSONAL"
                      ? `${m.personalUnit} ${r.unit?.label ?? "-"}`
                      : m.community}{" "}
                    — {m.status}: {r.status}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-slate-700 dark:text-slate-200">{r.description}</p>
              {r.aiSummary ? (
                <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50/50 p-3 text-xs dark:border-teal-900/40 dark:bg-teal-950/30">
                  <p className="font-medium text-teal-900 dark:text-teal-200">{m.analysis}</p>
                  <p className="mt-1 whitespace-pre-line text-slate-700 dark:text-slate-200">
                    {r.aiSummary}
                  </p>
                  {r.aiSuggestions ? (
                    <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-200">
                      <span className="font-medium">{m.suggestions}</span>
                      {"\n"}
                      {r.aiSuggestions}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
