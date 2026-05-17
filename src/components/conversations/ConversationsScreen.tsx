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
  tabLabels,
  lines,
  residents,
  emptyText,
  inputPlaceholder,
  panelTitle,
  error,
}: {
  buildingId: string;
  tab: ChatTabId;
  title: string;
  tabLabels: { residents: string; group: string };
  lines: ChatLine[];
  residents: ResidentRow[];
  emptyText: string;
  inputPlaceholder: string;
  panelTitle: string;
  error?: string | null;
}) {
  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>

      <ChatTabs buildingId={buildingId} active={tab} labels={tabLabels} />

      <Card title={panelTitle}>
        {tab === "residents" ? (
          <ResidentsList residents={residents} emptyText={emptyText} />
        ) : (
          <ChatBubbleList lines={lines} emptyText={emptyText} />
        )}
        {tab === "group" ? (
          <ChatComposer
            buildingId={buildingId}
            tab={tab}
            placeholder={inputPlaceholder}
          />
        ) : null}
      </Card>
    </div>
  );
}
