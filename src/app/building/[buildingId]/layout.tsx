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
              {building.region ? `${building.region} — ` : null}
              {building.city}
              {building.postalCode ? ` — الرمز البريدي ${building.postalCode}` : null}
              {" — "}
              رمز الدعوة:{" "}
              <span dir="ltr" className="font-mono font-semibold text-teal-700 dark:text-teal-400">
                {building.inviteCode}
              </span>
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {building.address}
            </p>
            {building.latitude != null && building.longitude != null ? (
              <p className="mt-2 text-sm">
                <a
                  href={`https://www.google.com/maps?q=${building.latitude},${building.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 underline dark:text-teal-400"
                >
                  فتح الموقع على الخريطة
                </a>
              </p>
            ) : null}
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
