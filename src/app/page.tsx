import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { LoginDoorIcon, PlusIcon } from "@/components/LandingIcons";
import { LandingLangSwitcher } from "@/components/LandingLangSwitcher";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

const accent = "#157083";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const locale = await getLocale();
  const t = ui(locale).landing;
  const nextLocale = locale === "ar" ? "en" : "ar";
  const btnFlex = locale === "ar" ? "flex-row-reverse" : "flex-row";

  return (
    <div
      className="relative min-h-dvh w-full bg-[#f5fcfb] text-[#157083]"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgb(224 247 244) 0%, rgb(240 253 250) 45%, white 100%)",
      }}
    >
      <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
        <LandingLangSwitcher label={t.langLabel} nextLocale={nextLocale} />
      </div>

      <main className="flex min-h-dvh flex-col items-center justify-center px-6 pb-28 pt-20 sm:px-8">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <div className="mb-6">
            <Image
              src="/logo.svg"
              alt={t.logoAlt}
              width={96}
              height={96}
              className="size-24 rounded-2xl shadow-md sm:size-28"
              priority
            />
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-[2.5rem]" style={{ color: accent }}>
            {t.nameAr}
          </h1>
          <p
            className="mt-1 text-sm font-semibold uppercase tracking-[0.35em] sm:text-base"
            style={{ color: accent }}
          >
            AMARATI
          </p>
          <p className="mt-4 text-lg font-semibold sm:text-xl" style={{ color: accent }}>
            {t.tagline}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed sm:text-base" style={{ color: "rgb(90 125 131)" }}>
            {t.desc}
          </p>

          <div className="mt-10 flex w-full max-w-sm flex-col gap-4">
            <Link
              href="/login"
              className={`inline-flex ${btnFlex} w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-semibold text-white shadow-md transition hover:brightness-105 active:brightness-95`}
              style={{ backgroundColor: accent }}
            >
              <LoginDoorIcon className="shrink-0" />
              <span>{t.login}</span>
            </Link>
            <Link
              href="/register"
              className={`inline-flex ${btnFlex} w-full items-center justify-center gap-3 rounded-2xl border-2 bg-white px-6 py-4 text-base font-semibold shadow-sm transition hover:bg-[#f0fffd] active:bg-[#e6faf7]`}
              style={{ borderColor: accent, color: accent }}
            >
              <PlusIcon className="shrink-0" />
              <span>{t.create}</span>
            </Link>
          </div>
        </div>

        <div
          className="fixed bottom-8 left-1/2 flex -translate-x-1/2 gap-2"
          role="presentation"
          aria-hidden
        >
          <span className="size-2 rounded-full bg-[#157083]/25" />
          <span className="size-2 rounded-full" style={{ backgroundColor: accent }} />
          <span className="size-2 rounded-full bg-[#157083]/25" />
        </div>
      </main>
    </div>
  );
}
