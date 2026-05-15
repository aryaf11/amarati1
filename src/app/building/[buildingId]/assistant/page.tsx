import { notFound, redirect } from "next/navigation";
import { ChatbotClient } from "@/components/ChatbotClient";
import { loadBuildingContext } from "@/lib/building-context";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";

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
  const backHref = `/dashboard?open=${encodeURIComponent(buildingId)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <ChatbotClient locale={locale} backHref={backHref} />
    </div>
  );
}
