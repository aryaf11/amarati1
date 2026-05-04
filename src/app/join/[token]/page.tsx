import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/TopNav";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Card } from "@/components/ui";
import { JoinAcceptButton } from "@/components/JoinAcceptButton";

export default async function JoinTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getLocale();
  const tj = ui(locale).join;
  const td = ui(locale).dashboard;
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
          <Card title={tj.invalidTitle}>
            <p className="text-sm">{tj.expired}</p>
            <Link href="/dashboard" className="mt-3 inline-block text-teal-700 underline dark:text-teal-400">
              {tj.backDashboard}
            </Link>
          </Card>
        </main>
      </div>
    );
  }
  const kindLabel = invite.kind === "OWNER" ? td.owner : td.tenant;
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto max-w-lg flex-1 px-4 py-12">
        <Card title={tj.inviteTitle}>
          <p className="text-sm">
            {tj.building}: <strong>{invite.building.name}</strong>
          </p>
          <p className="mt-2 text-sm">
            {tj.unit}: <strong>{invite.unit.label}</strong> — {tj.kind}: {kindLabel}
          </p>
          <div className="mt-4">
            <JoinAcceptButton token={token} locale={locale} />
          </div>
        </Card>
      </main>
    </div>
  );
}
