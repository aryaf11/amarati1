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
            عَمارتي — إدارة مباني سكنية بالعنوان الوطني
          </p>
          <h1 className="text-3xl font-bold leading-snug md:text-4xl">
            تواصل سكان العمارة: صيانة ذكية، تصويت، مدفوعات، وإعلانات — في مكان واحد.
          </h1>
          <p className="max-w-2xl text-slate-600 dark:text-slate-300">
            سجّل مبناك وفق العنوان الوطني السعودي، وادعُ الجيران برمز المبنى، وصوّت لاختيار مشرف أو شركة
            صيانة للأعطال المجتمعية، وتابع «جواز» شقتك الرقمي.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/register">
              <Button>إضافة مبنى</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">دخول</Button>
            </Link>
          </div>
          <p className="max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            «إضافة مبنى» تبدأ بإنشاء حساب مجاناً، ثم تسجيل بيانات العمارة والعنوان الوطني من لوحة التحكم.
            يمكنك تثبيت الموقع كتطبيق على الجوال («إضافة إلى الشاشة الرئيسية») لتجربة أقرب لتطبيق أصلي.
          </p>
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
