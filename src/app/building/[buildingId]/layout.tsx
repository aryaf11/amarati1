import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { BuildingNav, loadBuildingContext } from "@/components/BuildingNav";
import { getCurrentUser } from "@/lib/current-user";

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
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">المبنى</p>
            <h1 className="text-2xl font-bold">{building.name}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {building.city} — رمز الدعوة العام:{" "}
              <span dir="ltr" className="font-mono font-semibold text-teal-700 dark:text-teal-400">
                {building.inviteCode}
              </span>
            </p>
          </div>
          <Link href="/dashboard">
            <span className="text-sm text-teal-700 underline dark:text-teal-400">
              كل المبانى
            </span>
          </Link>
        </div>
        <BuildingNav buildingId={buildingId} />
        {children}
      </main>
    </div>
  );
}
