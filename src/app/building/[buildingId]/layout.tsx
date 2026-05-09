import { notFound, redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { loadBuildingContext } from "@/lib/building-context";
import { ui } from "@/lib/ui-strings";
import { PageShell } from "@/components/ui";

const accent = "var(--accent)";

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
  const [{ building, membership }, locale] = await Promise.all([
    loadBuildingContext(buildingId, user.id),
    getLocale(),
  ]);
  if (!building || !membership) notFound();
  const tl = ui(locale).buildingLayout;
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell>
        <div>
          <p className="text-xs text-muted">{tl.building}</p>
          <h1 className="text-2xl font-bold" style={{ color: accent }}>
            {building.name}
          </h1>
          <p className="text-sm text-muted">
            {building.region ? `${building.region} — ` : null}
            {building.city}
            {building.postalCode ? ` — ${tl.postal} ${building.postalCode}` : null}
            {" — "}
            {tl.inviteCode}{" "}
            <span
              dir="ltr"
              className="font-mono font-semibold"
              style={{ color: accent }}
            >
              {building.inviteCode}
            </span>
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            {building.address}
          </p>
        </div>
        {children}
      </PageShell>
    </div>
  );
}
