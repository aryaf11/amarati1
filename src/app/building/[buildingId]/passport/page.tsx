import { notFound, redirect } from "next/navigation";
import { loadBuildingContext } from "@/components/BuildingNav";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";

export default async function PassportPage({
  params,
}: {
  params: Promise<{ buildingId: string }>;
}) {
  const { buildingId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { building, membership } = await loadBuildingContext(buildingId, user.id);
  if (!building || !membership) notFound();
  const events = await prisma.apartmentHistoryEvent.findMany({
    where: { unitId: membership.unitId },
    orderBy: { createdAt: "desc" },
    include: { maintenanceRequest: true },
  });
  return (
    <div className="space-y-6">
      <Card title={`جواز رقمي — شقة ${membership.unit.label}`}>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          سجل الإصلاحات والطلبات المرتبطة بهذه الوحدة.
        </p>
        <ul className="space-y-3 text-sm">
          {events.map((e) => (
            <li key={e.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
              <p className="font-medium">{e.title}</p>
              <p className="text-xs text-slate-500">{e.createdAt.toLocaleString("ar-SA")}</p>
              {e.detail ? <p className="mt-2 whitespace-pre-line">{e.detail}</p> : null}
            </li>
          ))}
        </ul>
        {events.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">لا أحداث بعد.</p>
        ) : null}
      </Card>
    </div>
  );
}
