import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { postChatAction } from "@/actions/social";
import { loadBuildingContext } from "@/components/BuildingNav";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { prisma } from "@/lib/prisma";
import { Button, Card, TextArea } from "@/components/ui";

export default async function ChatPage({
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
  const c = ui(locale).chat;
  const rows = await prisma.chatMessage.findMany({
    where: { buildingId },
    orderBy: { createdAt: "asc" },
    take: 80,
    include: { user: true },
  });
  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <Card title={c.title}>
        <div className="mb-3 flex justify-end">
          <Link
            href={`/building/${buildingId}`}
            className="text-xs font-medium text-teal-700 underline underline-offset-2 hover:text-teal-900 dark:text-teal-400"
          >
            {c.back}
          </Link>
        </div>
        <p className="mb-3 text-xs text-slate-500">{c.hint}</p>
        <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-100 p-3 text-sm dark:border-slate-800">
          {rows.map((m) => (
            <div key={m.id}>
              <span className="font-medium">{m.user.name}:</span>{" "}
              <span className="whitespace-pre-wrap">{m.body}</span>
            </div>
          ))}
        </div>
        <form action={postChatAction} className="mt-3 space-y-2">
          <input type="hidden" name="buildingId" value={buildingId} />
          <TextArea name="body" rows={2} placeholder={c.placeholder} required />
          <Button type="submit">{c.send}</Button>
        </form>
      </Card>
    </div>
  );
}
