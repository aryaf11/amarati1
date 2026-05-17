import type { ReactNode } from "react";
import Link from "next/link";
import {
  ChatBubbleIcon,
  GaugeIcon,
  KeyIcon,
  MegaphoneIcon,
  PassportIcon,
  SparklesIcon,
  VoteIcon,
  WrenchIcon,
} from "@/components/LandingIcons";
import { loadBuildingContext } from "@/lib/building-context";
import type { AppLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Card } from "@/components/ui";

/** معاينة المبنى على `/dashboard` — ترتيب الاختصارات مطابق لتطبيق الجوال. */
export async function BuildingQuickWidgets({
  buildingId,
  userId,
  locale,
}: {
  buildingId: string;
  userId: string;
  locale: AppLocale;
}) {
  try {
    return await BuildingQuickWidgetsInner({ buildingId, userId, locale });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
        {msg}
      </p>
    );
  }
}

async function BuildingQuickWidgetsInner({
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
  const bn = t.buildingNav;

  const kindLabel = membership.kind === "OWNER" ? td.owner : td.tenant;

  const shortcuts: {
    href: string;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      href: `/building/${buildingId}/maintenance`,
      label: bn.maintenance,
      icon: <WrenchIcon className="size-5" />,
    },
    {
      href: `/building/${buildingId}/votes`,
      label: bn.votes,
      icon: <VoteIcon className="size-5" />,
    },
    {
      href: `/building/${buildingId}/chat`,
      label: th.openChat,
      icon: <ChatBubbleIcon className="size-5" />,
    },
    {
      href: `/building/${buildingId}/announcements`,
      label: bn.announcements,
      icon: <MegaphoneIcon className="size-5" />,
    },
    {
      href: `/building/${buildingId}/assistant`,
      label: th.openAssistant,
      icon: <SparklesIcon className="size-5" />,
    },
    {
      href: `/building/${buildingId}/invite`,
      label: th.linkInvite,
      icon: <KeyIcon className="size-5" />,
    },
    {
      href: `/building/${buildingId}/passport`,
      label: th.linkPassport,
      icon: <PassportIcon className="size-5" />,
    },
  ];

  if (membership.isSupervisor) {
    shortcuts.push({
      href: `/building/${buildingId}/supervisor`,
      label: bn.supervisor,
      icon: <GaugeIcon className="size-5" />,
    });
  }

  const shortcutTile =
    "flex flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center text-xs font-semibold shadow-sm transition hover:shadow-md";
  const shortcutStyle = {
    borderColor: "var(--card-border)",
    color: "var(--accent)",
    backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
  } as const;

  return (
    <div className="space-y-6">
      <Card title={th.overviewSection}>
        <div>
            <p className="text-base font-semibold" style={{ color: "var(--accent)" }}>
              {building.name}
            </p>
            <p className="mt-1 text-sm">
              {th.unitPrefix} <strong>{membership.unit.label}</strong>
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {kindLabel}
              {membership.isSupervisor ? ` · ${th.youSupervisor}` : ""}
            </p>
        </div>
      </Card>

      <Card title={th.shortcuts}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {shortcuts.map((s) => (
            <Link key={s.href} href={s.href} className={shortcutTile} style={shortcutStyle}>
              {s.icon}
              <span className="leading-snug">{s.label}</span>
            </Link>
          ))}
        </div>
      </Card>

    </div>
  );
}
