import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  assignSupervisorAction,
  openSupervisorVoteAction,
} from "@/actions/governance";
import { loadBuildingContext } from "@/components/BuildingNav";
import { getCurrentUser } from "@/lib/current-user";
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
  const supervisors = await prisma.membership.findMany({
    where: { unit: { buildingId }, isSupervisor: true },
    include: { user: true, unit: true },
  });
  const members = await prisma.membership.findMany({
    where: { unit: { buildingId } },
    include: { user: true, unit: true },
  });
  const isCreator = building.creatorId === user.id;
  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <Card title="حالتك في هذا المبنى">
        <p className="text-sm">
          شقة <strong>{membership.unit.label}</strong> —{" "}
          {membership.kind === "OWNER" ? "مالك" : "مستأجر"}
          {membership.isSupervisor ? " — أنت المشرف" : ""}
        </p>
      </Card>
      <Card title="المشرف الحالي">
        {supervisors.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            لا يوجد مشرف محدد. يمكن لمنشئ المبنى التعيين أو فتح تصويت من قسم التصويت.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {supervisors.map((s) => (
              <li key={s.id}>
                {s.user.name} (شقة {s.unit.label})
              </li>
            ))}
          </ul>
        )}
        {isCreator ? (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-xs text-slate-500">تعيين مشرف (صلاحية منشئ المبنى)</p>
            <form action={assignSupervisorAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="buildingId" value={buildingId} />
              <select
                name="targetUserId"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                required
              >
                <option value="">اختر عضواً</option>
                {members.map((x) => (
                  <option key={x.userId} value={x.userId}>
                    {x.user.name} — {x.unit.label}
                  </option>
                ))}
              </select>
              <Button type="submit" className="!py-2 !text-xs">
                تعيين كن مشرف
              </Button>
            </form>
            <form action={openSupervisorVoteAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="buildingId" value={buildingId} />
              <Button type="submit" variant="ghost" className="!py-2 !text-xs">
                بدء تصويت لاختيار مشرف
              </Button>
              <span className="text-xs text-slate-500">يتطلب مالكين فأكثر</span>
            </form>
          </div>
        ) : null}
      </Card>
      <Card title="اختصار">
        <div className="flex flex-wrap gap-2 text-sm">
          <Link className="underline text-teal-700 dark:text-teal-400" href={`/building/${buildingId}/maintenance`}>
            تقديم طلب صيانة
          </Link>
          <span className="text-slate-300">|</span>
          <Link className="underline text-teal-700 dark:text-teal-400" href={`/building/${buildingId}/votes`}>
            التصويتات
          </Link>
          <span className="text-slate-300">|</span>
          <Link className="underline text-teal-700 dark:text-teal-400" href={`/building/${buildingId}/invite`}>
            دعوة مستأجر برابط
          </Link>
        </div>
      </Card>
    </div>
  );
}
