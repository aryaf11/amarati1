import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createBuildingAction,
  joinBuildingPublicCodeAction,
} from "@/actions/building";
import { listMyBuildings } from "@/lib/access";
import { getCurrentUser, isPlatformAdmin } from "@/lib/current-user";
import { TopNav } from "@/components/TopNav";
import { Button, Card, Input } from "@/components/ui";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.accountKind === "COMPANY") redirect("/company/dashboard");
  const items = await listMyBuildings(user.id);
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-slate-600 dark:text-slate-300">
            مبانيك وشققك المرتبطة بحسابك.
          </p>
        </div>
        {err ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {err}
          </p>
        ) : null}
        {isPlatformAdmin(user.email) ? (
          <Card title="إدارة المنصة">
            <Link
              href="/platform/applications"
              className="text-teal-700 underline dark:text-teal-400"
            >
              مراجعة طلبات انضمام شركات الصيانة
            </Link>
          </Card>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="إنشاء مبنى جديد">
            <p className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              أدخل بيانات العنوان الوطني وفق معايير البريد السعودي (
              <a
                href="https://splonline.com.sa/ar/national-address-1/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 underline dark:text-teal-400"
              >
                العنوان الوطني
              </a>
              ). الرمز البريدي خمسة أرقام؛ الرقم المختصر 8 خانات عند توفره.
            </p>
            <form action={createBuildingAction} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">اسم العمارة</label>
                <Input name="name" required placeholder="مثال: عمارة النور" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">المنطقة</label>
                  <Input name="region" required placeholder="مثال: منطقة الرياض" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">المدينة</label>
                  <Input name="city" required placeholder="مثال: الرياض" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">الحي</label>
                  <Input name="district" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">اسم الشارع</label>
                  <Input name="streetName" required />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">رقم المبنى</label>
                  <Input name="buildingNumber" required dir="ltr" className="text-left" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">الرقم الإضافي (اختياري)</label>
                  <Input name="additionalNumber" dir="ltr" className="text-left" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">الرمز البريدي (5 أرقام)</label>
                  <Input name="postalCode" required maxLength={5} minLength={5} dir="ltr" className="text-left" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">الرمز المختصر (8 خانات، اختياري)</label>
                  <Input name="shortAddressCode" maxLength={8} minLength={8} dir="ltr" className="text-left" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-slate-500">
                  تحديد الموقع (اختياري): الصق خط العرض وخط الطول من خرائط Google أو أي تطبيق خرائط.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">خط العرض</label>
                    <Input name="latitude" dir="ltr" className="text-left" placeholder="24.7136" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">خط الطول</label>
                    <Input name="longitude" dir="ltr" className="text-left" placeholder="46.6753" />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">رقم شقتك</label>
                <Input name="unitLabel" placeholder="مثال: 303" required />
              </div>
              <Button type="submit" className="w-full">
                إنشاء المبنى وربط شقتك
              </Button>
            </form>
          </Card>
          <Card title="الانضمام برمز المبنى">
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
              أي ساكن يشارك رمز المبنى العام معك — أدخل رقم شقتك أو أنشئ وحدة جديدة.
            </p>
            <form action={joinBuildingPublicCodeAction} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">رمز المبنى</label>
                <Input name="inviteCode" dir="ltr" className="text-left uppercase" required />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">رقم الشقة</label>
                <Input name="unitLabel" required />
              </div>
              <Button type="submit" className="w-full" variant="ghost">
                انضمام
              </Button>
            </form>
          </Card>
        </div>
        <Card title="مبانيك">
          {items.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              لا توجد مبانٍ بعد. أنشئ مبنى أو انضم برمز.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div>
                    <p className="font-medium">{m.unit.building.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      شقة {m.unit.label} — {m.kind === "OWNER" ? "مالك" : "مستأجر"}
                      {m.isSupervisor ? " — مشرف" : ""}
                    </p>
                  </div>
                  <Link href={`/building/${m.unit.building.id}`}>
                    <Button className="!py-1 !text-xs">فتح</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}
