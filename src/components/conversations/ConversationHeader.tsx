import Link from "next/link";

export function ConversationHeader({
  backHref,
  welcomeLine,
  roleLine,
  screenTitle,
}: {
  backHref: string;
  welcomeLine: string;
  roleLine: string;
  screenTitle: string;
}) {
  return (
    <header className="flex items-start gap-1 px-2 pb-3 pt-2">
      <Link
        href={backHref}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl text-foreground/80 transition hover:bg-black/5"
        aria-label="رجوع"
      >
        ‹
      </Link>
      <div className="min-w-0 flex-1 text-end">
        <p className="text-base font-bold leading-snug">{welcomeLine}</p>
        <p className="text-xs text-foreground/60">{roleLine}</p>
        <h1 className="mt-1 text-xl font-bold">{screenTitle}</h1>
      </div>
    </header>
  );
}
