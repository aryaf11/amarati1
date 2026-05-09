import { notFound, redirect } from "next/navigation";
import { loadBuildingContext } from "@/lib/building-context";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Card } from "@/components/ui";

export default async function InvitePage({
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
  const t = ui(locale).invitePage;
  return (
    <div className="space-y-6">
      <Card title={t.publicCode}>
        <p className="text-sm">
          {t.shareHintBefore}{" "}
          <span dir="ltr" className="font-mono text-lg font-bold text-accent">
            {building.inviteCode}
          </span>
        </p>
      </Card>
    </div>
  );
}
