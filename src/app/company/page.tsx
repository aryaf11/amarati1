import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/ui";

export default async function CompanyHubPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.accountKind === "COMPANY" && user.companyProfile) {
    redirect("/company/dashboard");
  }
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto max-w-3xl flex-1 space-y-6 px-4 py-10">
        <Card title="شركات الصيانة">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            قدّم طلب انضمام للمراجعة. بعد الموافقة يُنشأ لك حساب شركة وكلمة مرور مؤقتة تظهر
            في ملاحظات المراجع داخل لوحة الإدارة (يُنصح بتغييرها لاحقاً عند إضافة تدفق
            استعادة كلمة المرور).
          </p>
          <Link
            href="/company/apply"
            className="mt-4 inline-block text-teal-700 underline dark:text-teal-400"
          >
            تقديم طلب انضمام
          </Link>
        </Card>
      </main>
    </div>
  );
}
