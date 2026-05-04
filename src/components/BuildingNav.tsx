import Link from "next/link";
import { getMembership } from "@/lib/access";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { prisma } from "@/lib/prisma";

export async function BuildingNav({
  buildingId,
}: {
  buildingId: string;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const m = await getMembership(user.id, buildingId);
  if (!m) return null;
  const locale = await getLocale();
  const t = ui(locale);
  const base = `/building/${buildingId}`;
  const links: { href: string; label: string }[] = [
    { href: base, label: t.buildingNav.overview },
    { href: `${base}/maintenance`, label: t.buildingNav.maintenance },
    { href: `${base}/votes`, label: t.buildingNav.votes },
    { href: `${base}/payments`, label: t.buildingNav.payments },
    { href: `${base}/announcements`, label: t.buildingNav.announcements },
    { href: `${base}/chat`, label: t.buildingNav.chat },
    { href: `${base}/passport`, label: t.buildingNav.passport },
    { href: `${base}/invite`, label: t.buildingNav.invite },
  ];
  if (m.isSupervisor) {
    links.push({ href: `${base}/supervisor`, label: t.buildingNav.supervisor });
  }
  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-sm dark:border-slate-800">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-full bg-slate-100 px-3 py-1 hover:bg-teal-100 dark:bg-slate-900 dark:hover:bg-teal-950/60"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export async function loadBuildingContext(buildingId: string, userId: string) {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    include: {
      creator: true,
      units: { include: { memberships: { include: { user: true } } } },
    },
  });
  const m = await getMembership(userId, buildingId);
  return { building, membership: m };
}
