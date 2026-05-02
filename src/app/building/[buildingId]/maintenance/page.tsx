import { notFound, redirect } from "next/navigation";
import { createMaintenanceAction, openMaintenanceCompanyVoteAction } from "@/actions/maintenance";
import { loadBuildingContext } from "@/components/BuildingNav";
import { getCurrentUser } from "@/lib/current-user";
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
  const rows = await prisma.maintenanceRequest.findMany({
    where: { buildingId },
    orderBy: { createdAt: "desc" },
    include: { unit: true, company: true },
  });
  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <Card title="طلب صيانة جديد">
        <form action={createMaintenanceAction} className="space-y-3">
          <input type="hidden" name="buildingId" value={buildingId} />
          <div>
            <label className="mb-1 block text-xs text-slate-500">النوع</label>
            <select
              name="scope"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="PERSONAL">صيانة شخصية (شقتك)</option>
              <option value="COMMUNITY">صيانة مجتمعية (مشتركة)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">عنوان مختصر</label>
            <Input name="title" required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">وصف المشكلة</label>
            <TextArea name="description" rows={4} required />
          </div>
          <Button type="submit" className="w-full">
            إرسال مع تحليل وتوصيات
          </Button>
        </form>
      </Card>
      <Card title="الطلبات">
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
                      ? `شخصي — شقة ${r.unit?.label ?? "-"}`
                      : "مجتمعي"}{" "}
                    — الحالة: {r.status}
                  </p>
                </div>
                {r.company ? (
                  <span className="text-xs text-teal-700 dark:text-teal-400">
                    شركة: {r.company.name}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-slate-700 dark:text-slate-200">{r.description}</p>
              {r.aiSummary ? (
                <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50/50 p-3 text-xs dark:border-teal-900/40 dark:bg-teal-950/30">
                  <p className="font-medium text-teal-900 dark:text-teal-200">تحليل</p>
                  <p className="mt-1 whitespace-pre-line text-slate-700 dark:text-slate-200">
                    {r.aiSummary}
                  </p>
                  {r.aiSuggestions ? (
                    <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-200">
                      <span className="font-medium">توصيات شركات:</span>
                      {"\n"}
                      {r.aiSuggestions}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {membership.isSupervisor &&
              r.scope === "COMMUNITY" &&
              r.status === "OPEN" ? (
                <form action={openMaintenanceCompanyVoteAction} className="mt-3">
                  <input type="hidden" name="buildingId" value={buildingId} />
                  <input type="hidden" name="maintenanceRequestId" value={r.id} />
                  <Button type="submit" variant="ghost" className="!py-1 !text-xs">
                    فتح تصويت لاختيار شركة
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
