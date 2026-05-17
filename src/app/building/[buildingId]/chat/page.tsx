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
  if (raw === "residents" || raw === "group") return raw;
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

  const [rows, memberships] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { buildingId },
      orderBy: { createdAt: "asc" },
      take: 80,
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

  const residents: ResidentRow[] = memberships
    .filter((m) => m.user.visibleInResidents !== false)
    .map((m) => ({
      name: m.user.name,
      unitLabel: m.unit.label,
      roleLabel: m.kind === "OWNER" ? td.owner : td.tenant,
    }));

  const groupLines: ChatLine[] = rows.map((m) => ({
    senderLabel: senderLabel(m.userId, m.user.name),
    body: m.body,
    isOwn: m.userId === user.id,
  }));

  const lines = tab === "group" ? groupLines : [];
  const emptyText = tab === "residents" ? c.emptyResidents : c.emptyGroup;
  const panelTitle = tab === "residents" ? c.tabResidents : c.tabGroup;

  return (
    <ConversationsScreen
      buildingId={buildingId}
      tab={tab}
      title={c.conversationsTitle}
      tabLabels={{
        residents: c.tabResidents,
        group: c.tabGroup,
      }}
      lines={lines}
      residents={residents}
      emptyText={emptyText}
      inputPlaceholder={c.placeholder}
      panelTitle={panelTitle}
      error={err}
    />
  );
}
