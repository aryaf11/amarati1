import { notFound, redirect } from "next/navigation";
import { ConversationsScreen } from "@/components/conversations/ConversationsScreen";
import type { ChatTabId } from "@/components/conversations/ChatTabs";
import {
  demoAnnouncementsChat,
  demoGroupChat,
  demoResidentsChat,
  type ChatLine,
} from "@/lib/chat-demo";
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

  const [rows, announcements, unitByUser] = await Promise.all([
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
      include: { unit: true },
    }),
  ]);

  const unitLabel = new Map(unitByUser.map((m) => [m.userId, m.unit.label]));

  function senderLabel(userId: string, name: string) {
    const unit = unitLabel.get(userId);
    return unit ? `${name} - ${unit}` : name;
  }

  const groupFromDb: ChatLine[] = rows.map((m) => ({
    senderLabel: senderLabel(m.userId, m.user.name),
    body: m.body,
  }));

  const announcementLines: ChatLine[] =
    announcements.length > 0
      ? announcements.map((a) => ({
          senderLabel: c.buildingAdmin,
          body: a.title ? `${a.title}\n${a.body}` : a.body,
        }))
      : demoAnnouncementsChat;

  let lines: ChatLine[];
  let pinnedText: string | null = null;
  let composerDisabled = false;

  switch (tab) {
    case "residents":
      lines = demoResidentsChat;
      composerDisabled = true;
      break;
    case "announcements":
      lines = announcementLines;
      composerDisabled = true;
      break;
    case "group":
    default:
      lines = groupFromDb.length > 0 ? groupFromDb : demoGroupChat;
      pinnedText = c.groupPinned;
      composerDisabled = false;
      break;
  }

  const welcomeLine = c.welcomeUser.replace("{name}", user.name);
  const roleLine = membership.kind === "OWNER" ? c.roleOwner : c.roleTenant;

  return (
    <ConversationsScreen
      buildingId={buildingId}
      tab={tab}
      welcomeLine={welcomeLine}
      roleLine={roleLine}
      screenTitle={c.conversationsTitle}
      tabLabels={{
        residents: c.tabResidents,
        announcements: c.tabAnnouncements,
        group: c.tabGroup,
      }}
      lines={lines}
      pinnedText={pinnedText}
      inputPlaceholder={c.placeholder}
      composerDisabled={composerDisabled}
      error={err}
    />
  );
}
