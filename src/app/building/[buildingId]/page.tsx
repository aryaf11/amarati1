import { notFound, redirect } from "next/navigation";
import { supervisorRefreshInsightsAction } from "@/actions/platform";
import { MonthlyScoreLog } from "@/components/MonthlyScoreLog";
import { loadBuildingContext } from "@/lib/building-context";
import { getCurrentUser } from "@/lib/current-user";
import type { AppLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { prisma } from "@/lib/prisma";
import { Button, Card } from "@/components/ui";

/**
 * جذر مسار المبنى: المشرف يرى لوحة الصحة هنا؛ الساكن يُوجَّه للرئيسية (`/dashboard`)
 * حيث تُعرض نظرة عامة / المساعد / المحادثات.
 */
export default async function BuildingHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ buildingId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { buildingId } = await params;
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [{ building, membership }, locale] = await Promise.all([
    loadBuildingContext(buildingId, user.id),
    getLocale(),
  ]);
  if (!building || !membership) notFound();

  if (!membership.isSupervisor) {
    const qs = new URLSearchParams();
    qs.set("open", buildingId);
    if (err) qs.set("error", err);
    redirect(`/dashboard?${qs.toString()}`);
  }

  const errorBanner = err ? (
    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
      {err}
    </p>
  ) : null;

  return (
    <SupervisorOverview
      buildingId={buildingId}
      locale={locale}
      errorBanner={errorBanner}
    />
  );
}

async function SupervisorOverview({
  buildingId,
  locale,
  errorBanner,
}: {
  buildingId: string;
  locale: AppLocale;
  errorBanner: React.ReactNode;
}) {
  const s = ui(locale).supervisor;
  const scores = await prisma.buildingHealthScore.findMany({
    where: { buildingId },
    orderBy: { month: "desc" },
    take: 6,
  });
  return (
    <div className="space-y-6">
      {errorBanner}

      <Card title={s.refreshTitle}>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{s.refreshP1}</p>
        <form action={supervisorRefreshInsightsAction}>
          <input type="hidden" name="buildingId" value={buildingId} />
          <Button type="submit" className="!py-2 !text-xs">
            {s.refreshBtn}
          </Button>
        </form>
      </Card>

      <Card title={s.scoreTitle}>
        <MonthlyScoreLog scores={scores} locale={locale} />
      </Card>
    </div>
  );
}
