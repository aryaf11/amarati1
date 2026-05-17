import type { ChatLine } from "@/lib/chat-demo";
import { ChatBubbleList } from "./ChatBubbleList";
import { ChatComposer } from "./ChatComposer";
import { ChatTabs, type ChatTabId } from "./ChatTabs";
import { ConversationHeader } from "./ConversationHeader";

const screenBg = "#F3F3F3";

export function ConversationsScreen({
  buildingId,
  tab,
  welcomeLine,
  roleLine,
  screenTitle,
  tabLabels,
  lines,
  pinnedText,
  inputPlaceholder,
  composerDisabled,
  error,
}: {
  buildingId: string;
  tab: ChatTabId;
  welcomeLine: string;
  roleLine: string;
  screenTitle: string;
  tabLabels: { residents: string; announcements: string; group: string };
  lines: ChatLine[];
  pinnedText?: string | null;
  inputPlaceholder: string;
  composerDisabled?: boolean;
  error?: string | null;
}) {
  return (
    <div
      className="-mx-4 flex min-h-[min(720px,calc(100dvh-10rem))] flex-col sm:-mx-6"
      style={{ backgroundColor: screenBg }}
    >
      {error ? (
        <p className="mx-4 mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <ConversationHeader
        backHref={`/building/${buildingId}`}
        welcomeLine={welcomeLine}
        roleLine={roleLine}
        screenTitle={screenTitle}
      />
      <ChatTabs buildingId={buildingId} active={tab} labels={tabLabels} />
      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <ChatBubbleList lines={lines} pinnedText={pinnedText} />
        <ChatComposer
          buildingId={buildingId}
          tab={tab}
          placeholder={inputPlaceholder}
          disabled={composerDisabled}
        />
      </div>
    </div>
  );
}
