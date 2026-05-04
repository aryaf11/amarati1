import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { logoutAction } from "@/actions/auth";
import { NavToolbar } from "@/components/NavToolbar";
import { Button } from "@/components/ui";
import { getLocale } from "@/lib/locale";
import { navT } from "@/lib/nav-dict";

export async function TopNav() {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const t = navT(locale);
  const logoAlt = locale === "en" ? "Amarati logo" : "شعار عَمارتي";
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 text-lg font-bold text-teal-700 dark:text-teal-400"
        >
          <Image src="/logo.svg" alt={logoAlt} width={36} height={36} className="size-9 shrink-0" priority />
          <span>{t.brand}</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link className="rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-900" href="/chatbot">
            {t.chatbot}
          </Link>
          <NavToolbar locale={locale} />
          {user ? (
            <>
              <span className="text-slate-500">{user.name}</span>
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" className="!py-1 !text-xs">
                  {t.logout}
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="!py-1 !text-xs">
                  {t.login}
                </Button>
              </Link>
              <Link href="/register">
                <Button className="!py-1 !text-xs">{t.register}</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
