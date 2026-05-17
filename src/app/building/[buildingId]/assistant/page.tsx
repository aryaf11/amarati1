import { notFound, redirect } from "next/navigation";
import { AssistantClient } from "@/components/assistant/AssistantClient";
import { loadBuildingContext } from "@/lib/building-context";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

export default async function BuildingAssistantPage({
  params,
}: {
  params: Promise<{ buildingId: string }>;
}) {
  const { buildingId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { building, membership } = await loadBuildingContext(buildingId, user.id);
  if (!building || !membership) notFound();
  const locale = await getLocale();
  const a = ui(locale).assistant;
  const c = ui(locale).chat;

  return (
    <AssistantClient
      buildingId={buildingId}
      strings={{
        title: a.title,
        back: c.back,
        welcomeMessage: a.welcomeMessage,
        quickStatus: a.quickStatus,
        quickMaintenance: a.quickMaintenance,
        quickNextVisit: a.quickNextVisit,
        placeholder: a.placeholder,
        demoReply: a.demoReply,
      }}
    />
  );
}
