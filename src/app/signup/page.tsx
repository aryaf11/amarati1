import Link from "next/link";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { Card, PageShell } from "@/components/ui";
import { BuildingIcon, KeyIcon } from "@/components/LandingIcons";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

export default async function SignupChoicePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const locale = await getLocale();
  const t = ui(locale).signup;
  const tLogin = ui(locale).login;

  const choiceClass =
    "group flex h-full flex-col gap-3 rounded-2xl border-2 p-5 text-start transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--field-border-focus)]";

  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell className="max-w-3xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-accent">{t.chooseTitle}</h1>
          <p className="mt-2 text-sm text-muted">{t.chooseSubtitle}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/signup/join"
            className={choiceClass}
            style={{
              borderColor: "var(--accent)",
              backgroundColor: "color-mix(in srgb, var(--card) 88%, transparent)",
            }}
          >
            <span
              className="inline-flex size-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
              aria-hidden
            >
              <KeyIcon className="size-6" />
            </span>
            <h2 className="text-lg font-semibold text-accent">
              {t.choiceJoinTitle}
            </h2>
            <p className="text-sm text-muted">{t.choiceJoinDesc}</p>
          </Link>

          <Link
            href="/signup/create"
            className={choiceClass}
            style={{
              borderColor: "var(--card-border)",
              backgroundColor: "color-mix(in srgb, var(--card) 88%, transparent)",
            }}
          >
            <span
              className="inline-flex size-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
              aria-hidden
            >
              <BuildingIcon className="size-6" />
            </span>
            <h2 className="text-lg font-semibold text-accent">
              {t.choiceCreateTitle}
            </h2>
            <p className="text-sm text-muted">{t.choiceCreateDesc}</p>
          </Link>
        </div>

        <Card>
          <p className="text-sm text-muted">
            {t.haveAccount}{" "}
            <Link href="/login" className="font-semibold underline text-accent">
              {tLogin.title}
            </Link>
          </p>
        </Card>
      </PageShell>
    </div>
  );
}
