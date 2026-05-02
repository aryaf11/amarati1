import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { getCurrentUser } from "@/lib/current-user";
import { TopNav } from "@/components/TopNav";
import { Button, Card, Input } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <Card title="تسجيل الدخول">
          {err ? (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </p>
          ) : null}
          <form action={loginAction} className="space-y-3">
            <input type="hidden" name="next" value={sp.next ?? ""} />
            <div>
              <label className="mb-1 block text-xs text-slate-500">البريد</label>
              <Input name="email" type="email" required dir="ltr" className="text-left" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">كلمة المرور</label>
              <Input name="password" type="password" required dir="ltr" className="text-left" />
            </div>
            <Button type="submit" className="w-full">
              دخول
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
            لا تملك حساباً؟{" "}
            <Link href="/register" className="text-teal-700 underline dark:text-teal-400">
              سجّل
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
