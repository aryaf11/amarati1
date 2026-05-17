import { notFound, redirect } from "next/navigation";
import { ConversationsScreen } from "@/components/conversations/ConversationsScreen";
import type { ChatTabId } from "@/components/conversations/ChatTabs";
import type { ChatLine, ResidentRow } from "@/lib/chat-types";
import { loadBuildingContext } from "@/lib/building-context";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { prisma } from "@/lib/prisma";

function parseTab(raw: string | undefined): ChatTabId {
  if (raw === "residents" || raw === "announcements" || raw === "group") return raw;
  return "group";
}

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ buildingId: string }>;
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const { buildingId } = await params;
  const sp = await searchParams;
  const tab = parseTab(sp.tab);
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { building, membership } = await loadBuildingContext(buildingId, user.id);
  if (!building || !membership) notFound();
  const locale = await getLocale();
  const c = ui(locale).chat;
  const td = ui(locale).dashboard;

  const [rows, announcements, memberships] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { buildingId },
      orderBy: { createdAt: "asc" },
      take: 80,
      include: { user: true },
    }),
    prisma.announcement.findMany({
      where: { buildingId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: true },
    }),
    prisma.membership.findMany({
      where: { unit: { buildingId } },
      include: { unit: true, user: true },
      orderBy: { unit: { label: "asc" } },
    }),
  ]);

  const unitLabel = new Map(memberships.map((m) => [m.userId, m.unit.label]));

  function senderLabel(userId: string, name: string) {
    const unit = unitLabel.get(userId);
    return unit ? `${name} — ${unit}` : name;
  }

  const residents: ResidentRow[] = memberships.map((m) => ({
    name: m.user.name,
    unitLabel: m.unit.label,
    roleLabel: m.kind === "OWNER" ? td.owner : td.tenant,
  }));

  const groupLines: ChatLine[] = rows.map((m) => ({
    senderLabel: senderLabel(m.userId, m.user.name),
    body: m.body,
    isOwn: m.userId === user.id,
  }));

  const announcementLines: ChatLine[] = announcements.map((a) => ({
    senderLabel: a.user.name,
    body: a.title ? `${a.title}\n\n${a.body}` : a.body,
  }));

  let lines: ChatLine[] = [];
  let emptyText: string = c.emptyGroup;
  let panelTitle: string = c.tabGroup;
  let composerDisabled = false;

  switch (tab) {
    case "residents":
      emptyText = c.emptyResidents;
      panelTitle = c.tabResidents;
      composerDisabled = true;
      break;
    case "announcements":
      lines = announcementLines;
      emptyText = c.emptyAnnouncements;
      panelTitle = c.tabAnnouncements;
      composerDisabled = true;
      break;
    case "group":
    default:
      lines = groupLines;
      emptyText = c.emptyGroup;
      panelTitle = c.tabGroup;
      composerDisabled = false;
      break;
  }

  return (
    <ConversationsScreen
      buildingId={buildingId}
      tab={tab}
      title={c.conversationsTitle}
      hint={c.hint}
      backLabel={c.back}
      tabLabels={{
        residents: c.tabResidents,
        announcements: c.tabAnnouncements,
        group: c.tabGroup,
      }}
      lines={lines}
      residents={residents}
      emptyText={emptyText}
      inputPlaceholder={c.placeholder}
      composerDisabled={composerDisabled}
      announcementsHref={`/building/${buildingId}/announcements`}
      announcementsLinkLabel={c.openAnnouncements}
      panelTitle={panelTitle}
      error={err}
    />
  );
}
