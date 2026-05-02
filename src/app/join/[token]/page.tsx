import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/ui";
import { JoinAcceptButton } from "@/components/JoinAcceptButton";

export default async function JoinTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(`/join/${token}`);
    redirect(`/login?next=${next}`);
  }
  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: { building: true, unit: true },
  });
  if (!invite || invite.expiresAt < new Date()) {
    return (
      <div className="flex min-h-full flex-col">
        <TopNav />
        <main className="mx-auto max-w-lg flex-1 px-4 py-12">
          <Card title="رابط غير صالح">
            <p className="text-sm">قد يكون منتهي الصلاحية.</p>
            <Link href="/dashboard" className="mt-3 inline-block text-teal-700 underline dark:text-teal-400">
              العودة للوحة التحكم
            </Link>
          </Card>
        </main>
      </div>
    );
  }
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto max-w-lg flex-1 px-4 py-12">
        <Card title="دعوة للانضمام">
          <p className="text-sm">
            المبنى: <strong>{invite.building.name}</strong>
          </p>
          <p className="mt-2 text-sm">
            الشقة: <strong>{invite.unit.label}</strong> — النوع:{" "}
            {invite.kind === "OWNER" ? "مالك" : "مستأجر"}
          </p>
          <div className="mt-4">
            <JoinAcceptButton token={token} />
          </div>
        </Card>
      </main>
    </div>
  );
}
