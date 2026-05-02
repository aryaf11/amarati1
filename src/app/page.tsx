import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { TopNav } from "@/components/TopNav";
import { Button, Card } from "@/components/ui";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12">
        <div className="space-y-4">
          <p className="text-sm font-medium text-teal-700 dark:text-teal-400">
            إدارة مباني سكنية — أقرب لروح «اتحاد الملاك»
          </p>
          <h1 className="text-3xl font-bold leading-snug md:text-4xl">
            تواصل سكان العمارة: صيانة ذكية، تصويت، مدفوعات، وإعلانات — في مكان واحد.
          </h1>
          <p className="max-w-2xl text-slate-600 dark:text-slate-300">
            أنشئ مبنى، ادعُ الجيران برابط أو رمز، صوّت لاختيار مشرف أو شركة صيانة
            للأعطال المجتمعية، وتابع «جواز» شقتك الرقمي لكل الإصلاحات.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register">
              <Button>ابدأ مجاناً</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">لدي حساب</Button>
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="صيانة">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              شخصية للشقة أو مجتمعية للمصعد والمناطق المشتركة — مع تحليل وتوصيات شركات.
            </p>
          </Card>
          <Card title="تصويت وحوكمة">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              انتخاب مشرف أو اختيار شركة بعد طلب مجتمعي، بشفافية داخل المبنى.
            </p>
          </Card>
          <Card title="مدفوعات وإعلانات">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              سجل مدفوعاتك وتجربة دفع تجريبية، بالإضافة لإعلانات السكان ومحادثة اختيارية.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
