import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { BuildingNav, loadBuildingContext } from "@/components/BuildingNav";
import { HomeIcon } from "@/components/LandingIcons";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { PageShell } from "@/components/ui";
import { navT } from "@/lib/nav-dict";

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
  const { building, membership } = await loadBuildingContext(buildingId, user.id);
  if (!building || !membership) notFound();
  const locale = await getLocale();
  const tl = ui(locale).buildingLayout;
  const tn = navT(locale);
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">{tl.building}</p>
            <h1 className="text-2xl font-bold" style={{ color: accent }}>
              {building.name}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
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
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {building.address}
            </p>
            {building.latitude != null && building.longitude != null ? (
              <p className="mt-2 text-sm">
                <a
                  href={`https://www.google.com/maps?q=${building.latitude},${building.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                  style={{ color: accent }}
                >
                  {tl.mapLink}
                </a>
              </p>
            ) : null}
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-[#157083]/25 bg-white/80 p-2.5 text-[#157083] shadow-sm backdrop-blur transition hover:bg-white hover:shadow dark:border-teal-700/40 dark:bg-slate-900/70 dark:text-teal-200 dark:hover:bg-slate-900"
            title={tn.backHome}
            aria-label={tn.backHome}
          >
            <HomeIcon />
          </Link>
        </div>
        <BuildingNav buildingId={buildingId} />
        {children}
      </PageShell>
    </div>
  );
}
