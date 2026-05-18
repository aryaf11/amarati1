import Link from "next/link";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { AuthPageShell, Card } from "@/components/ui";
import { BuildingIcon, KeyIcon } from "@/components/LandingIcons";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

/** نقطة دخول التسجيل — يختار المستخدم بين إنشاء مبنى جديد أو الانضمام لمبنى قائم. */
export default async function SignupChoicePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const locale = await getLocale();
  const t = ui(locale).signup;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <AuthPageShell className="max-w-2xl">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-accent">{t.chooseTitle}</h1>
          <p className="mt-1 text-sm text-muted">{t.chooseSubtitle}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/signup/create"
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-3xl"
          >
            <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:shadow-md">
              <div className="flex flex-col items-start gap-3">
                <span
                  className="inline-flex size-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
                  aria-hidden
                >
                  <BuildingIcon className="size-6" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-accent">
                    {t.choiceCreateTitle}
                  </h2>
                  <p className="mt-1 text-sm text-muted">{t.choiceCreateDesc}</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link
            href="/signup/join"
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-3xl"
          >
            <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:shadow-md">
              <div className="flex flex-col items-start gap-3">
                <span
                  className="inline-flex size-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
                  aria-hidden
                >
                  <KeyIcon className="size-6" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-accent">
                    {t.choiceJoinTitle}
                  </h2>
                  <p className="mt-1 text-sm text-muted">{t.choiceJoinDesc}</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <p className="text-center text-sm text-muted">
          {t.haveAccount}{" "}
          <Link href="/login" className="font-semibold underline text-accent">
            {t.backLogin}
          </Link>
        </p>
      </AuthPageShell>
    </div>
  );
}
