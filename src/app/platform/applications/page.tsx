import { redirect } from "next/navigation";
import { reviewCompanyApplicationAction } from "@/actions/platform";
import { getCurrentUser, isPlatformAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import { Button, Card, TextArea } from "@/components/ui";

export default async function PlatformApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !isPlatformAdmin(user.email)) {
    redirect("/dashboard");
  }
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const rows = await prisma.companyApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-8">
        <h1 className="text-2xl font-bold">مراجعة طلبات الشركات</h1>
        {err ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {err}
          </p>
        ) : null}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          عيّن بريد المشرف في المتغير <span dir="ltr">PLATFORM_ADMIN_EMAILS</span> (افصل بين
          عدة بريدات بفاصلة).
        </p>
        <ul className="space-y-4">
          {rows.map((a) => (
            <li key={a.id}>
              <Card title={a.businessName}>
                <p className="text-sm">{a.email}</p>
                <p className="text-xs text-slate-500">الحالة: {a.status}</p>
                {a.reviewerNote ? (
                  <p className="mt-2 whitespace-pre-line text-xs text-slate-600 dark:text-slate-300">
                    {a.reviewerNote}
                  </p>
                ) : null}
                {a.status === "PENDING" ? (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <form action={reviewCompanyApplicationAction} className="space-y-2">
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="decision" value="APPROVE" />
                      <TextArea name="reviewerNote" rows={2} placeholder="ملاحظة قبول..." />
                      <Button type="submit" className="w-full">
                        قبول وإنشاء حساب شركة
                      </Button>
                    </form>
                    <form action={reviewCompanyApplicationAction} className="space-y-2">
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="decision" value="REJECT" />
                      <TextArea name="reviewerNote" rows={2} placeholder="سبب الرفض..." />
                      <Button type="submit" variant="ghost" className="w-full">
                        رفض
                      </Button>
                    </form>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
