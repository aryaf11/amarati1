import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  assignSupervisorAction,
  openSupervisorVoteAction,
} from "@/actions/governance";
import { loadBuildingContext } from "@/components/BuildingNav";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { prisma } from "@/lib/prisma";
import { Button, Card } from "@/components/ui";

export default async function BuildingHomePage({
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
  const th = ui(locale).buildingHome;
  const td = ui(locale).dashboard;
  const supervisors = await prisma.membership.findMany({
    where: { unit: { buildingId }, isSupervisor: true },
    include: { user: true, unit: true },
  });
  const members = await prisma.membership.findMany({
    where: { unit: { buildingId } },
    include: { user: true, unit: true },
  });
  const isCreator = building.creatorId === user.id;
  const kindLabel = membership.kind === "OWNER" ? td.owner : td.tenant;
  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <Card title={th.yourStatus}>
        <p className="text-sm">
          {th.unitPrefix} <strong>{membership.unit.label}</strong> — {kindLabel}
          {membership.isSupervisor ? ` — ${th.youSupervisor}` : ""}
        </p>
      </Card>
      <Card title={th.currentSupervisor}>
        {supervisors.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{th.noSupervisor}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {supervisors.map((s) => (
              <li key={s.id}>
                {s.user.name} ({th.unitPrefix} {s.unit.label})
              </li>
            ))}
          </ul>
        )}
        {isCreator ? (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-xs text-slate-500">{th.assignHint}</p>
            <form action={assignSupervisorAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="buildingId" value={buildingId} />
              <select
                name="targetUserId"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                required
              >
                <option value="">{th.chooseMember}</option>
                {members.map((x) => (
                  <option key={x.userId} value={x.userId}>
                    {x.user.name} — {x.unit.label}
                  </option>
                ))}
              </select>
              <Button type="submit" className="!py-2 !text-xs">
                {th.assignSubmit}
              </Button>
            </form>
            <form action={openSupervisorVoteAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="buildingId" value={buildingId} />
              <Button type="submit" variant="ghost" className="!py-2 !text-xs">
                {th.startVote}
              </Button>
              <span className="text-xs text-slate-500">{th.ownersRequired}</span>
            </form>
          </div>
        ) : null}
      </Card>
      <Card title={th.shortcuts}>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="underline text-teal-700 dark:text-teal-400" href={`/building/${buildingId}/maintenance`}>
            {th.linkMaintenance}
          </Link>
          <span className="text-slate-300">|</span>
          <Link className="underline text-teal-700 dark:text-teal-400" href={`/building/${buildingId}/votes`}>
            {th.linkVotes}
          </Link>
          <span className="text-slate-300">|</span>
          <Link className="underline text-teal-700 dark:text-teal-400" href={`/building/${buildingId}/invite`}>
            {th.linkInvite}
          </Link>
        </div>
      </Card>
    </div>
  );
}
