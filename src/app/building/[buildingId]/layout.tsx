import { notFound, redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { getCurrentUser } from "@/lib/current-user";
import { loadBuildingContext } from "@/lib/building-context";
import { PageShell } from "@/components/ui";

/**
 * تخطيط صفحات المبنى: يتحقق من الجلسة والعضوية فقط.
 * تفاصيل العنوان ورمز الدعوة تُعرض في الملف الشخصي (مواصفات المبنى) وليس هنا.
 */
export default async function BuildingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ buildingId: string }>;
}) {
  const { buildingId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { building, membership } = await loadBuildingContext(buildingId, user.id);
  if (!building || !membership) notFound();
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell>{children}</PageShell>
    </div>
  );
}
