import { notFound, redirect } from "next/navigation";
import { postAnnouncementAction } from "@/actions/social";
import { loadBuildingContext } from "@/lib/building-context";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { pickDateLocale, ui } from "@/lib/ui-strings";
import { prisma } from "@/lib/prisma";
import { Button, Card, Input, TextArea } from "@/components/ui";

export default async function AnnouncementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ buildingId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { buildingId } = await params;
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { building, membership } = await loadBuildingContext(buildingId, user.id);
  if (!building || !membership) notFound();
  const locale = await getLocale();
  const a = ui(locale).announcements;
  const df = pickDateLocale(locale);
  const rows = await prisma.announcement.findMany({
    where: { buildingId },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <Card title={a.new}>
        <form action={postAnnouncementAction} className="space-y-3">
          <input type="hidden" name="buildingId" value={buildingId} />
          <Input name="title" placeholder={a.titlePh} required />
          <TextArea name="body" rows={4} placeholder={a.bodyPh} required />
          <Button type="submit" className="w-full">
            {a.publish}
          </Button>
        </form>
      </Card>
      <Card title={a.recent}>
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-slate-100 p-3 text-sm dark:border-slate-800">
              <p className="font-semibold">{row.title}</p>
              <p className="text-xs text-slate-500">
                {row.user.name} — {row.createdAt.toLocaleString(df)}
              </p>
              <p className="mt-2 whitespace-pre-line">{row.body}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
