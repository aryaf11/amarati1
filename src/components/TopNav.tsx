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

const accent = "var(--accent)";

export async function TopNav() {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const t = navT(locale);
  const logoAlt = locale === "en" ? "Amarati logo" : "شعار عَمارتي";

  const ghostBtn =
    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition hover:shadow";
  const ghostBtnStyle = {
    backgroundColor: "color-mix(in srgb, var(--card) 80%, transparent)",
    borderColor: "var(--card-border)",
    color: "var(--accent)",
  } as const;
  const primaryBtn =
    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-md transition hover:brightness-105 active:brightness-95";
  const primaryBtnStyle = {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
  } as const;

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-md"
      style={{
        backgroundColor: "color-mix(in srgb, var(--card) 70%, transparent)",
        borderColor: "var(--card-border)",
      }}
    >
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
            <Link
              href="/chatbot"
              className={ghostBtn}
              style={ghostBtnStyle}
              title={t.chatbot}
              aria-label={t.chatbot}
            >
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
                style={ghostBtnStyle}
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
                  style={ghostBtnStyle}
                  title={t.logout}
                  aria-label={t.logout}
                >
                  <LogoutIcon />
                  <span className="hidden sm:inline">{t.logout}</span>
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className={primaryBtn} style={primaryBtnStyle}>
              <LoginDoorIcon className="size-4" />
              <span>{t.login}</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
