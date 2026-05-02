import Link from "next/link";
import { submitCompanyApplicationAction } from "@/actions/platform";
import { TopNav } from "@/components/TopNav";
import { Button, Card, Input, TextArea } from "@/components/ui";

export default async function CompanyApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; thanks?: string }>;
}) {
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const thanks = sp.thanks === "1";
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
        <Card title="طلب انضمام شركة صيانة">
          {thanks ? (
            <p className="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
              تم الإرسال. سيتم التواصل بعد المراجعة.
            </p>
          ) : null}
          {err ? (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </p>
          ) : null}
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
            يمكنك التقديم بريد الشركة حتى لو لم يكن لديك حساب بعد. إن كنت مسجلاً، نربط الطلب
            بحسابك.
          </p>
          <form action={submitCompanyApplicationAction} className="space-y-3">
            <Input name="businessName" placeholder="الاسم التجاري" required />
            <Input name="email" type="email" placeholder="بريد التواصل" required dir="ltr" className="text-left" />
            <Input name="phone" placeholder="جوال (اختياري)" dir="ltr" className="text-left" />
            <TextArea name="notes" rows={3} placeholder="تخصص، مدن العمل، ملاحظات..." />
            <Button type="submit" className="w-full">
              إرسال للمراجعة
            </Button>
          </form>
          <Link href="/company" className="mt-4 inline-block text-sm text-teal-700 underline dark:text-teal-400">
            رجوع
          </Link>
        </Card>
      </main>
    </div>
  );
}
