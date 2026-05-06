import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { logoutAction } from "@/actions/auth";
import { NavToolbar } from "@/components/NavToolbar";
import {
  ChatBubbleIcon,
  LoginDoorIcon,
  LogoutIcon,
  UserCircleIcon,
} from "@/components/LandingIcons";
import { getLocale } from "@/lib/locale";
import { navT } from "@/lib/nav-dict";

const accent = "#157083";

export async function TopNav() {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const t = navT(locale);
  const logoAlt = locale === "en" ? "Amarati logo" : "شعار عَمارتي";

  const ghostBtn =
    "inline-flex items-center gap-2 rounded-full border border-[#157083]/25 bg-white/80 px-3 py-1.5 text-xs font-medium text-[#157083] shadow-sm backdrop-blur transition hover:bg-white hover:shadow dark:border-teal-700/40 dark:bg-slate-900/70 dark:text-teal-200 dark:hover:bg-slate-900";
  const primaryBtn =
    "inline-flex items-center gap-2 rounded-full bg-[#157083] px-3 py-1.5 text-xs font-medium text-white shadow-md transition hover:brightness-105 active:brightness-95";

  return (
    <header className="sticky top-0 z-30 border-b border-[#157083]/10 bg-white/70 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 text-lg font-bold"
          style={{ color: accent }}
        >
          <Image src="/logo.svg" alt={logoAlt} width={36} height={36} className="size-9 shrink-0" priority />
          <span>{t.brand}</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1.5 text-sm">
          {user ? (
            <Link href="/chatbot" className={ghostBtn} title={t.chatbot} aria-label={t.chatbot}>
              <ChatBubbleIcon />
              <span className="hidden sm:inline">{t.chatbot}</span>
            </Link>
          ) : null}
          <NavToolbar locale={locale} loggedIn={Boolean(user)} />
          {user ? (
            <>
              <Link
                href="/profile"
                className={ghostBtn}
                title={user.name}
                aria-label={t.profile}
              >
                <UserCircleIcon />
                <span className="hidden max-w-[10rem] truncate sm:inline">{user.name}</span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={ghostBtn}
                  title={t.logout}
                  aria-label={t.logout}
                >
                  <LogoutIcon />
                  <span className="hidden sm:inline">{t.logout}</span>
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className={primaryBtn}>
              <LoginDoorIcon className="size-4" />
              <span>{t.login}</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
