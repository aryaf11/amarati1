import { notFound, redirect } from "next/navigation";
import { mockPayAction } from "@/actions/social";
import { loadBuildingContext } from "@/components/BuildingNav";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Button, Card, Input } from "@/components/ui";

export default async function PaymentsPage({
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
  const payments = await prisma.payment.findMany({
    where: { userId: user.id, buildingId },
    orderBy: { createdAt: "desc" },
  });
  const reqs = await prisma.maintenanceRequest.findMany({
    where: { buildingId, createdById: user.id },
    select: { id: true, title: true },
  });
  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <Card title="سجل المدفوعات">
        <ul className="space-y-2 text-sm">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
            >
              <span>{p.description}</span>
              <span dir="ltr" className="font-mono">
                {(p.amountCents / 100).toFixed(2)} {p.currency} — {p.status}
              </span>
            </li>
          ))}
        </ul>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">لا مدفوعات مسجلة بعد.</p>
        ) : null}
      </Card>
      <Card title="دفع تجريبي عبر التطبيق">
        <p className="mb-3 text-xs text-slate-500">
          للتوضيح فقط — اربط لاحقاً بوابة دفع محلية (مدى، STC Pay، إلخ).
        </p>
        <form action={mockPayAction} className="space-y-3">
          <input type="hidden" name="buildingId" value={buildingId} />
          <div>
            <label className="mb-1 block text-xs text-slate-500">المبلغ (ريال)</label>
            <Input name="amount" type="number" step="0.01" min="1" required dir="ltr" className="text-left" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">البيان</label>
            <Input name="description" placeholder="اشتراك صيانة / سداد..." />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">ربط بطلب صيانة (اختياري)</label>
            <select
              name="maintenanceRequestId"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">—</option>
              {reqs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full">
            تسجيل دفع ناجح (تجريبي)
          </Button>
        </form>
      </Card>
    </div>
  );
}
