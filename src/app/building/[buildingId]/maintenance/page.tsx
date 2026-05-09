import { notFound, redirect } from "next/navigation";
import { openMaintenanceCompanyVoteAction } from "@/actions/governance";
import { createMaintenanceAction } from "@/actions/maintenance";
import { loadBuildingContext } from "@/lib/building-context";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import {
  predictFailure,
  recommendServices,
  textToFeatures,
} from "@/lib/maintenance-predictor";
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
    include: { unit: true, vote: true },
  });
  const canManage = membership.isSupervisor || building.creatorId === user.id;
  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <Card title={m.newRequest}>
        <p className="mb-3 rounded-lg border px-3 py-2 text-xs text-muted" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--accent-soft)" }}>
          {m.aiHint}
        </p>
        <form action={createMaintenanceAction} className="space-y-3">
          <input type="hidden" name="buildingId" value={buildingId} />
          <div>
            <label className="mb-1 block text-xs text-muted">{m.type}</label>
            <select
              name="scope"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--field-bg)",
                borderColor: "var(--field-border)",
                color: "var(--foreground)",
              }}
            >
              <option value="PERSONAL">{m.scopePersonal}</option>
              <option value="COMMUNITY">{m.scopeCommunity}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">{m.title}</label>
            <Input name="title" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">{m.problem}</label>
            <TextArea name="description" rows={4} required />
          </div>
          <Button type="submit" className="w-full">
            {m.submitAi}
          </Button>
        </form>
      </Card>
      <Card title={m.requests}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">{m.noneRequests}</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((r) => {
              const isCommunity = r.scope === "COMMUNITY";
              const features = textToFeatures(r.description, building.city);
              const issue = predictFailure(features);
              const recs = isCommunity ? recommendServices(issue, 3) : [];
              return (
                <li
                  key={r.id}
                  className="rounded-2xl border p-4 text-sm shadow-sm"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--card) 88%, transparent)",
                    borderColor: "var(--card-border)",
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold" style={{ color: "var(--accent)" }}>
                        {r.title}
                      </p>
                      <p className="text-xs text-muted">
                        {r.scope === "PERSONAL"
                          ? `${m.personalUnit} ${r.unit?.label ?? "-"}`
                          : m.community}{" "}
                        — {m.status}: {r.status}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: isCommunity
                          ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                          : "var(--accent-soft)",
                        color: "var(--accent)",
                      }}
                    >
                      {isCommunity ? m.scopeLabelCommunity : m.scopeLabelPersonal}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line">{r.description}</p>
                  {r.aiSummary ? (
                    <div
                      className="mt-3 rounded-xl border p-3 text-xs"
                      style={{
                        borderColor: "var(--card-border)",
                        backgroundColor: "var(--accent-soft)",
                      }}
                    >
                      <p className="font-semibold" style={{ color: "var(--accent)" }}>
                        {m.aiTag} · {m.analysis}
                      </p>
                      <p className="mt-1 whitespace-pre-line">{r.aiSummary}</p>
                      {r.aiSuggestions ? (
                        <p className="mt-2 whitespace-pre-line">
                          <span className="font-semibold">{m.suggestions}: </span>
                          {r.aiSuggestions}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {isCommunity && recs.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                        {m.aiCompanies}
                      </p>
                      <ul className="mt-2 grid gap-2 sm:grid-cols-3">
                        {recs.map((c) => (
                          <li
                            key={c.company}
                            className="rounded-xl border p-2.5 text-xs shadow-sm"
                            style={{
                              borderColor: "var(--card-border)",
                              backgroundColor: "var(--card)",
                            }}
                          >
                            <p className="font-semibold">{c.company}</p>
                            <p className="text-muted">⭐ {c.rating.toFixed(1)}</p>
                          </li>
                        ))}
                      </ul>
                      {canManage ? (
                        r.vote ? (
                          <p className="mt-3 text-xs font-medium" style={{ color: "var(--accent)" }}>
                            {m.companyVoteOpen}
                          </p>
                        ) : (
                          <form action={openMaintenanceCompanyVoteAction} className="mt-3">
                            <input type="hidden" name="buildingId" value={buildingId} />
                            <input type="hidden" name="requestId" value={r.id} />
                            <Button type="submit" variant="ghost" className="!py-1.5 !text-xs">
                              {m.startCompanyVote}
                            </Button>
                          </form>
                        )
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
