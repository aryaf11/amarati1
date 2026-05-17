import Link from "next/link";
import type { ChatLine, ResidentRow } from "@/lib/chat-types";
import { Card } from "@/components/ui";
import { ChatBubbleList } from "./ChatBubbleList";
import { ChatComposer } from "./ChatComposer";
import { ChatTabs, type ChatTabId } from "./ChatTabs";
import { ResidentsList } from "./ResidentsList";

export function ConversationsScreen({
  buildingId,
  tab,
  title,
  hint,
  backLabel,
  tabLabels,
  lines,
  residents,
  emptyText,
  inputPlaceholder,
  composerDisabled,
  announcementsHref,
  announcementsLinkLabel,
  panelTitle,
  error,
}: {
  buildingId: string;
  tab: ChatTabId;
  title: string;
  hint: string;
  backLabel: string;
  tabLabels: { residents: string; announcements: string; group: string };
  lines: ChatLine[];
  residents: ResidentRow[];
  emptyText: string;
  inputPlaceholder: string;
  composerDisabled?: boolean;
  announcementsHref: string;
  announcementsLinkLabel: string;
  panelTitle: string;
  error?: string | null;
}) {
  const backHref = `/dashboard?open=${encodeURIComponent(buildingId)}`;

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="text-sm font-medium text-accent underline-offset-2 hover:underline"
        >
          {backLabel}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">{hint}</p>
      </div>

      <ChatTabs buildingId={buildingId} active={tab} labels={tabLabels} />

      <Card title={panelTitle}>
        {tab === "residents" ? (
          <ResidentsList residents={residents} emptyText={emptyText} />
        ) : (
          <>
            <ChatBubbleList lines={lines} emptyText={emptyText} />
            {tab === "announcements" && lines.length === 0 ? (
              <p className="mt-4 text-center text-sm">
                <Link
                  href={announcementsHref}
                  className="font-medium text-accent underline-offset-2 hover:underline"
                >
                  {announcementsLinkLabel}
                </Link>
              </p>
            ) : null}
          </>
        )}
        <ChatComposer
          buildingId={buildingId}
          tab={tab}
          placeholder={inputPlaceholder}
          disabled={composerDisabled}
        />
      </Card>
    </div>
  );
}
