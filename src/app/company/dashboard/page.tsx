import { notFound, redirect } from "next/navigation";
import { companyUpdateRequestStatusAction } from "@/actions/maintenance";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import { Button, Card } from "@/components/ui";

export default async function CompanyDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.accountKind !== "COMPANY" || !user.companyProfile) notFound();
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const cid = user.companyProfile.id;
  const requests = await prisma.maintenanceRequest.findMany({
    where: { companyId: cid },
    orderBy: { updatedAt: "desc" },
    include: { building: true, unit: true },
  });
  const payments = await prisma.payment.findMany({
    where: { maintenanceRequest: { companyId: cid } },
    orderBy: { createdAt: "desc" },
    include: { user: true, maintenanceRequest: true },
  });
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8">
        <div>
          {err ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              {err}
            </p>
          ) : null}
          <h1 className="text-2xl font-bold">{user.companyProfile.name}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">لوحة شركة الصيانة</p>
        </div>
        <Card title="طلبات مرتبطة بكم">
          <ul className="space-y-3 text-sm">
            {requests.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <p className="font-semibold">{r.title}</p>
                <p className="text-xs text-slate-500">
                  {r.building.name} — {r.scope}{" "}
                  {r.unit ? `— شقة ${r.unit.label}` : ""} — {r.status}
                </p>
                <form action={companyUpdateRequestStatusAction} className="mt-2 flex flex-wrap gap-2">
                  <input type="hidden" name="requestId" value={r.id} />
                  <Button type="submit" name="status" value="IN_PROGRESS" className="!py-1 !text-xs">
                    قيد التنفيذ
                  </Button>
                  <Button type="submit" name="status" value="DONE" variant="ghost" className="!py-1 !text-xs">
                    إتمام
                  </Button>
                </form>
              </li>
            ))}
          </ul>
          {requests.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">لا طلبات بعد.</p>
          ) : null}
        </Card>
        <Card title="المدفوعات المرتبطة بطلباتكم">
          <ul className="space-y-2 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2">
                <span>{p.user.name}</span>
                <span dir="ltr" className="font-mono">
                  {(p.amountCents / 100).toFixed(2)} {p.currency}
                </span>
              </li>
            ))}
          </ul>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">لا مدفوعات بعد.</p>
          ) : null}
        </Card>
      </main>
    </div>
  );
}
