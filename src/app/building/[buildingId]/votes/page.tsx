import { notFound, redirect } from "next/navigation";
import { closeVoteAndApplySupervisorAction } from "@/actions/governance";
import { castVoteAction } from "@/actions/votes";
import { loadBuildingContext } from "@/components/BuildingNav";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { pickDateLocale, ui } from "@/lib/ui-strings";
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
  const locale = await getLocale();
  const v = ui(locale).votes;
  const df = pickDateLocale(locale);
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
      <Card title={v.title}>
        <ul className="space-y-6">
          {votes.map((vote) => {
            const mine = vote.ballots.find((b) => b.userId === user.id);
            const counts = new Map<string, number>();
            for (const o of vote.options) counts.set(o.id, 0);
            for (const b of vote.ballots) {
              counts.set(b.optionId, (counts.get(b.optionId) ?? 0) + 1);
            }
            const typeLabel =
              vote.type === "SUPERVISOR" ? v.typeSupervisor : v.typeLegacyPoll;
            return (
              <li
                key={vote.id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{vote.title}</p>
                    <p className="text-xs text-slate-500">
                      {typeLabel} —{" "}
                      {vote.status === "OPEN" ? v.open : v.closed} — {v.ends}{" "}
                      {vote.endsAt.toLocaleString(df)}
                    </p>
                    {vote.description ? (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{vote.description}</p>
                    ) : null}
                  </div>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {vote.options.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {o.label}{" "}
                        <span className="text-xs text-slate-500">
                          ({counts.get(o.id) ?? 0} {v.votes})
                        </span>
                      </span>
                      {vote.status === "OPEN" && vote.endsAt > new Date() ? (
                        <form action={castVoteAction}>
                          <input type="hidden" name="voteId" value={vote.id} />
                          <input type="hidden" name="optionId" value={o.id} />
                          <Button type="submit" className="!py-1 !text-xs">
                            {mine?.optionId === o.id ? v.yourVote : v.vote}
                          </Button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {(membership.isSupervisor || building.creatorId === user.id) && vote.status === "OPEN" ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {vote.type === "SUPERVISOR" ? (
                      <form action={closeVoteAndApplySupervisorAction}>
                        <input type="hidden" name="voteId" value={vote.id} />
                        <Button type="submit" variant="ghost" className="!py-1 !text-xs">
                          {v.closeSupervisor}
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
          <p className="text-sm text-slate-600 dark:text-slate-300">{v.none}</p>
        ) : null}
      </Card>
    </div>
  );
}
