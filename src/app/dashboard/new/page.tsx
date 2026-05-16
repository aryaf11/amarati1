import Link from "next/link";
import { redirect } from "next/navigation";
import { createBuildingAction } from "@/actions/building";
import { TopNav } from "@/components/TopNav";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { NationalAddressFields } from "@/components/NationalAddressFields";
import { Button, Card, Input, PageShell } from "@/components/ui";

const accent = "var(--accent)";

export default async function DashboardNewBuildingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/new");
  const [locale, sp] = await Promise.all([getLocale(), searchParams]);
  const t = ui(locale).dashboard;
  const err = sp.error ? decodeURIComponent(sp.error) : null;

  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell className="max-w-xl">
        <p>
          <Link
            href="/dashboard"
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: accent }}
          >
            ← {t.backToDashboard}
          </Link>
        </p>
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: accent }}>
            {t.createBuilding}
          </h1>
          <p className="text-sm text-muted">{t.nationalAddressHelp}</p>
        </header>
        {err ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {err}
          </p>
        ) : null}
        <Card>
          <p className="mb-3 rounded-xl border px-3 py-2 text-xs leading-relaxed text-muted" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--accent-soft)" }}>
            {t.firstTimeHint}
          </p>
          <form action={createBuildingAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted">{t.name}</label>
              <Input name="name" required placeholder={t.namePh} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">{t.unitLabel}</label>
              <Input name="unitLabel" placeholder={t.unitPh} required />
            </div>
            <NationalAddressFields locale={locale} />
            <Button type="submit" className="w-full">
              {t.createSubmit}
            </Button>
          </form>
        </Card>
      </PageShell>
    </div>
  );
}
