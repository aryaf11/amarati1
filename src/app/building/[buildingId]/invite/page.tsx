import { notFound, redirect } from "next/navigation";
import { canAddTenants } from "@/lib/access";
import { loadBuildingContext } from "@/components/BuildingNav";
import { InvitePanel } from "@/components/InvitePanel";
import { getCurrentUser } from "@/lib/current-user";
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
  const addOk = canAddTenants(membership.kind, membership.isSupervisor);
  return (
    <div className="space-y-6">
      <Card title="رمز المبنى العام">
        <p className="text-sm">
          شارك الرمز مع الجيران لينضموا برقم شقتهم:{" "}
          <span dir="ltr" className="font-mono text-lg font-bold text-teal-700 dark:text-teal-400">
            {building.inviteCode}
          </span>
        </p>
      </Card>
      {addOk ? (
        <InvitePanel
          buildingId={buildingId}
          canInviteTenant
          canInviteOwner={membership.kind === "OWNER" || membership.isSupervisor}
        />
      ) : (
        <Card title="دعوات المستأجرين">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            حسابك مستأجر — يمكنك مشاركة رمز المبنى العام أو رابط أنشأه المالك. لا يمكنك إنشاء
            دعوة مستأجر جديد وفق الصلاحيات.
          </p>
        </Card>
      )}
    </div>
  );
}
