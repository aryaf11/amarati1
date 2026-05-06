import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createBuildingAction,
  joinBuildingPublicCodeAction,
} from "@/actions/building";
import { listMyBuildings } from "@/lib/access";
import { getCurrentUser } from "@/lib/current-user";
import { TopNav } from "@/components/TopNav";
import { getLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Button, Card, Input, PageShell } from "@/components/ui";
import { HomeIcon } from "@/components/LandingIcons";

const accent = "#157083";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const locale = await getLocale();
  const t = ui(locale).dashboard;
  const items = await listMyBuildings(user.id);
  const sp = await searchParams;
  const err = sp.error ? decodeURIComponent(sp.error) : null;
  const splUrl =
    locale === "en"
      ? "https://splonline.com.sa/en/national-address-1/"
      : "https://splonline.com.sa/ar/national-address-1/";
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: accent }}>
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.subtitle}</p>
        </div>
        {err ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {err}
          </p>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title={t.createBuilding}>
            <p className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {t.splHintBefore}
              <a
                href={splUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
                style={{ color: accent }}
              >
                {t.splLink}
              </a>
              {t.splHintAfter}
            </p>
            <form action={createBuildingAction} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.name}</label>
                <Input name="name" required placeholder={t.namePh} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">{t.region}</label>
                  <Input name="region" required placeholder={t.regionPh} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">{t.city}</label>
                  <Input name="city" required placeholder={t.cityPh} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">{t.district}</label>
                  <Input name="district" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">{t.streetName}</label>
                  <Input name="streetName" required />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">{t.buildingNumber}</label>
                  <Input name="buildingNumber" required dir="ltr" className="text-left" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">{t.additionalNumber}</label>
                  <Input name="additionalNumber" dir="ltr" className="text-left" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">{t.postalCode}</label>
                  <Input name="postalCode" required maxLength={5} minLength={5} dir="ltr" className="text-left" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">{t.shortAddressCode}</label>
                  <Input name="shortAddressCode" maxLength={8} minLength={8} dir="ltr" className="text-left" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-slate-500">{t.geoHint}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">{t.latitude}</label>
                    <Input name="latitude" dir="ltr" className="text-left" placeholder="24.7136" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">{t.longitude}</label>
                    <Input name="longitude" dir="ltr" className="text-left" placeholder="46.6753" />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.unitLabel}</label>
                <Input name="unitLabel" placeholder={t.unitPh} required />
              </div>
              <Button type="submit" className="w-full">
                {t.createSubmit}
              </Button>
            </form>
          </Card>
          <Card title={t.joinCard}>
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{t.joinHint}</p>
            <form action={joinBuildingPublicCodeAction} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.inviteCode}</label>
                <Input name="inviteCode" dir="ltr" className="text-left uppercase" required />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.unitNumber}</label>
                <Input name="unitLabel" required />
              </div>
              <Button type="submit" className="w-full" variant="ghost">
                {t.joinSubmit}
              </Button>
            </form>
          </Card>
        </div>
        <Card>
          {items.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">{t.noBuildings}</p>
          ) : (
            <ul className="space-y-3">
              {items.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#157083]/15 bg-white/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex size-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "rgba(21,112,131,0.1)", color: accent }}
                      aria-hidden
                    >
                      <HomeIcon />
                    </span>
                    <div>
                      <p className="font-semibold" style={{ color: accent }}>
                        {m.unit.building.name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t.unit} {m.unit.label} — {m.kind === "OWNER" ? t.owner : t.tenant}
                        {m.isSupervisor ? ` — ${t.supervisor}` : ""}
                      </p>
                    </div>
                  </div>
                  <Link href={`/building/${m.unit.building.id}`}>
                    <Button className="!px-4 !py-1.5 !text-xs">{t.open}</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </PageShell>
    </div>
  );
}
