import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { Button, PageShell } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

const accent = "var(--accent)";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const locale = await getLocale();
  const L = ui(locale).landing;
  const logoAlt = L.logoAlt;

  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell className="flex flex-1 flex-col items-center justify-center gap-8 py-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo.svg"
            alt={logoAlt}
            width={96}
            height={96}
            className="size-24 shrink-0"
            priority
          />
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: accent }}>
            {L.nameAr}
          </h1>
          <p className="max-w-md text-sm text-muted">{L.tagline}</p>
          <p className="max-w-lg text-sm leading-relaxed text-muted">{L.desc}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login">
            <Button type="button" className="min-w-[140px]">
              {L.login}
            </Button>
          </Link>
          <Link href="/signup/create">
            <Button type="button" variant="ghost" className="min-w-[140px]">
              {L.register}
            </Button>
          </Link>
        </div>
      </PageShell>
    </div>
  );
}
