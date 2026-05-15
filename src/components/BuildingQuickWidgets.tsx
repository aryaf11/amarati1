import Link from "next/link";
import {
  ChatBubbleIcon,
  ChevronLeftIcon,
  MegaphoneIcon,
  SparklesIcon,
} from "@/components/LandingIcons";
import { loadBuildingContext } from "@/lib/building-context";
import type { AppLocale } from "@/lib/locale";
import { pickDateLocale, ui } from "@/lib/ui-strings";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";

/** معاينة سريعة للمبنى — تُعرض في `/dashboard` (الرئيسية) وليس داخل مسار المبنى. */
export async function BuildingQuickWidgets({
  buildingId,
  userId,
  locale,
}: {
  buildingId: string;
  userId: string;
  locale: AppLocale;
}) {
  const { building, membership } = await loadBuildingContext(buildingId, userId);
  if (!building || !membership) return null;

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
  const chevronFlip = locale === "ar" ? "rotate-180" : "";

  return (
    <div className="space-y-6">
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
            <p className="mt-1 text-xs text-muted">
              {building.name}
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
        <Link
          href={`/building/${buildingId}/assistant`}
          className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm transition hover:shadow-md"
          style={{
            borderColor: "var(--card-border)",
            color: "var(--foreground)",
            backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
          }}
        >
          <span className="inline-flex items-center gap-2">
            <SparklesIcon className="size-5 shrink-0" />
            {th.openAssistant}
          </span>
          <ChevronLeftIcon className={`size-5 shrink-0 opacity-80 ${chevronFlip}`} />
        </Link>
      </Card>

      <Card title={th.socialSection}>
        <div className="grid gap-5 lg:grid-cols-2">
          <section>
            <Link
              href={`/building/${buildingId}/chat`}
              className="mb-3 flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition hover:shadow"
              style={{ borderColor: "var(--card-border)", color: "var(--accent)" }}
            >
              <span className="inline-flex items-center gap-2">
                <ChatBubbleIcon />
                {th.chatTitle}
              </span>
              <ChevronLeftIcon className={`size-5 shrink-0 ${chevronFlip}`} />
            </Link>
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
            <Link
              href={`/building/${buildingId}/announcements`}
              className="mb-3 flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition hover:shadow"
              style={{ borderColor: "var(--card-border)", color: "var(--accent)" }}
            >
              <span className="inline-flex items-center gap-2">
                <MegaphoneIcon />
                {th.announcementsTitle}
              </span>
              <ChevronLeftIcon className={`size-5 shrink-0 ${chevronFlip}`} />
            </Link>
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
