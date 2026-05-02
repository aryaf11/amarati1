import { notFound, redirect } from "next/navigation";
import { applyCompanyWinnerAction } from "@/actions/maintenance";
import { closeVoteAndApplySupervisorAction } from "@/actions/governance";
import { castVoteAction } from "@/actions/votes";
import { loadBuildingContext } from "@/components/BuildingNav";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Button, Card } from "@/components/ui";

export default async function VotesPage({
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
  const votes = await prisma.vote.findMany({
    where: { buildingId },
    orderBy: { createdAt: "desc" },
    include: { options: true, ballots: true, maintenanceRequest: true },
  });
  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <Card title="التصويتات">
        <ul className="space-y-6">
          {votes.map((v) => {
            const mine = v.ballots.find((b) => b.userId === user.id);
            const counts = new Map<string, number>();
            for (const o of v.options) counts.set(o.id, 0);
            for (const b of v.ballots) {
              counts.set(b.optionId, (counts.get(b.optionId) ?? 0) + 1);
            }
            return (
              <li
                key={v.id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{v.title}</p>
                    <p className="text-xs text-slate-500">
                      {v.type === "SUPERVISOR" ? "مشرف" : "شركة صيانة"} —{" "}
                      {v.status === "OPEN" ? "مفتوح" : "مغلق"} — ينتهي {v.endsAt.toLocaleString("ar-SA")}
                    </p>
                    {v.description ? (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {v.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {v.options.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {o.label}{" "}
                        <span className="text-xs text-slate-500">
                          ({counts.get(o.id) ?? 0} صوت)
                        </span>
                      </span>
                      {v.status === "OPEN" && v.endsAt > new Date() ? (
                        <form action={castVoteAction}>
                          <input type="hidden" name="voteId" value={v.id} />
                          <input type="hidden" name="optionId" value={o.id} />
                          <Button type="submit" className="!py-1 !text-xs">
                            {mine?.optionId === o.id ? "صوتك هنا" : "صوّت"}
                          </Button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {(membership.isSupervisor || building.creatorId === user.id) &&
                v.status === "OPEN" ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {v.type === "SUPERVISOR" ? (
                      <form action={closeVoteAndApplySupervisorAction}>
                        <input type="hidden" name="voteId" value={v.id} />
                        <Button type="submit" variant="ghost" className="!py-1 !text-xs">
                          إغلاق وتعيين المشرف الفائز
                        </Button>
                      </form>
                    ) : null}
                    {v.type === "MAINTENANCE_COMPANY" && membership.isSupervisor ? (
                      <form action={applyCompanyWinnerAction}>
                        <input type="hidden" name="voteId" value={v.id} />
                        <Button type="submit" variant="ghost" className="!py-1 !text-xs">
                          إغلاق وتعيين شركة الفائزة للطلب
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        {votes.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">لا تصويتات بعد.</p>
        ) : null}
      </Card>
    </div>
  );
}
