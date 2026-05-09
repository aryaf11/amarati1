import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supervisorRefreshInsightsAction } from "@/actions/platform";
import { ChatbotClient } from "@/components/ChatbotClient";
import {
  AlertTriangleIcon,
  ChatBubbleIcon,
  GaugeIcon,
  MegaphoneIcon,
} from "@/components/LandingIcons";
import { loadBuildingContext } from "@/lib/building-context";
import { getCurrentUser } from "@/lib/current-user";
import type { AppLocale } from "@/lib/locale";
import { getLocale } from "@/lib/locale";
import { pickDateLocale, ui } from "@/lib/ui-strings";
import { prisma } from "@/lib/prisma";
import { Button, Card } from "@/components/ui";

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

  const errorBanner = err ? (
    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
      {err}
    </p>
  ) : null;

  if (membership.isSupervisor) {
    return (
      <SupervisorOverview
        buildingId={buildingId}
        locale={locale}
        errorBanner={errorBanner}
      />
    );
  }

  const t = ui(locale);
  const th = t.buildingHome;
  const td = t.dashboard;

  const [announcements, chatMessages] = await Promise.all([
    prisma.announcement.findMany({
      where: { buildingId },
      orderBy: { createdAt: "desc" },
      include: { user: true },
      take: 3,
    }),
    prisma.chatMessage.findMany({
      where: { buildingId },
      orderBy: { createdAt: "desc" },
      include: { user: true },
      take: 3,
    }),
  ]);

  const kindLabel = membership.kind === "OWNER" ? td.owner : td.tenant;
  const df = pickDateLocale(locale);

  return (
    <div className="space-y-6">
      {errorBanner}

      <Card title={th.overviewSection}>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {th.yourStatus}
            </p>
            <p className="mt-1 text-sm">
              {th.unitPrefix} <strong>{membership.unit.label}</strong> — {kindLabel}
              {membership.isSupervisor ? ` — ${th.youSupervisor}` : ""}
            </p>
          </div>
          <div
            className="border-t pt-4"
            style={{ borderColor: "var(--card-border)" }}
          >
            <Link
              href={`/building/${buildingId}/invite`}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition hover:shadow"
              style={{
                borderColor: "var(--accent)",
                color: "var(--accent)",
                backgroundColor: "var(--card)",
              }}
            >
              {th.openInvite}
            </Link>
          </div>
        </div>
      </Card>

      <Card title={th.aiAssistantSection}>
        <ChatbotClient locale={locale} embedded />
      </Card>

      <Card title={th.socialSection}>
        <div className="grid gap-5 lg:grid-cols-2">
          <section>
            <header className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-accent">
                <ChatBubbleIcon />
                {th.chatTitle}
              </h3>
              <Link
                href={`/building/${buildingId}/chat`}
                className="text-xs font-medium underline underline-offset-2"
                style={{ color: "var(--accent)" }}
              >
                {th.openChat}
              </Link>
            </header>
            {chatMessages.length === 0 ? (
              <p className="text-sm text-muted">{th.noChatYet}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {[...chatMessages].reverse().map((m) => (
                  <li
                    key={m.id}
                    className="rounded-xl border p-2.5"
                    style={{
                      borderColor: "var(--card-border)",
                      backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
                    }}
                  >
                    <p className="text-xs font-semibold text-accent">{m.user.name}</p>
                    <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap">{m.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <header className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-accent">
                <MegaphoneIcon />
                {th.announcementsTitle}
              </h3>
              <Link
                href={`/building/${buildingId}/announcements`}
                className="text-xs font-medium underline underline-offset-2"
                style={{ color: "var(--accent)" }}
              >
                {th.openAnnouncements}
              </Link>
            </header>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted">{th.noAnnouncementsYet}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {announcements.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border p-2.5"
                    style={{
                      borderColor: "var(--card-border)",
                      backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
                    }}
                  >
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-xs text-muted">
                      {a.user.name} — {a.createdAt.toLocaleString(df)}
                    </p>
                    <p className="mt-1 line-clamp-2 whitespace-pre-line">{a.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Card>
    </div>
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
  const t = ui(locale);
  const s = t.supervisor;
  const th = t.buildingHome;
  const [scores, alerts] = await Promise.all([
    prisma.buildingHealthScore.findMany({
      where: { buildingId },
      orderBy: { month: "desc" },
      take: 6,
    }),
    prisma.predictiveMaintenanceAlert.findMany({
      where: { buildingId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const latest = scores[0];
  return (
    <div className="space-y-6">
      {errorBanner}

      <Card title={th.supervisorOverviewTitle}>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          {th.supervisorOverviewHint}
        </p>
        <form action={supervisorRefreshInsightsAction}>
          <input type="hidden" name="buildingId" value={buildingId} />
          <Button type="submit" className="!py-2 !text-xs">
            {s.refreshBtn}
          </Button>
        </form>
      </Card>

      <Card title={s.scoreTitle}>
        {latest ? (
          <div
            className="mb-4 flex items-center gap-3 rounded-2xl border p-4"
            style={{
              borderColor: "var(--card-border)",
              backgroundColor: "var(--accent-soft)",
            }}
          >
            <span
              className="inline-flex size-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-foreground)",
              }}
              aria-hidden
            >
              <GaugeIcon />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {latest.month}
              </p>
              <p className="font-mono text-2xl font-bold text-accent">
                {latest.score}
              </p>
            </div>
          </div>
        ) : null}
        {scores.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{s.scoreEmpty}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {scores.map((sc) => (
              <li
                key={sc.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                style={{ borderColor: "var(--card-border)" }}
              >
                <span className="text-muted">{sc.month}</span>
                <span className="font-mono font-semibold">{sc.score}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={s.alertsTitle}>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{s.scoreEmpty}</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-xl border p-3"
                style={{ borderColor: "var(--card-border)" }}
              >
                <span
                  className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: "var(--accent-soft)",
                    color: "var(--accent)",
                  }}
                  aria-hidden
                >
                  <AlertTriangleIcon />
                </span>
                <div className="flex-1">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted">{a.severity}</p>
                  <p className="mt-1">{a.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
