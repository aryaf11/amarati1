import { notFound, redirect } from "next/navigation";
import { postChatAction } from "@/actions/social";
import { loadBuildingContext } from "@/components/BuildingNav";
import { getCurrentUser } from "@/lib/current-user";
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
      <Card title="محادثة السكان (اختيارية)">
        <p className="mb-3 text-xs text-slate-500">
          دردشة بسيطة داخل المبنى — يمكن تعطيلها لاحقاً أو استبدالها بخدمة متخصصة.
        </p>
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
          <TextArea name="body" rows={2} placeholder="رسالة..." required />
          <Button type="submit">إرسال</Button>
        </form>
      </Card>
    </div>
  );
}
