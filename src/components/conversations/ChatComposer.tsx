import { postChatAction } from "@/actions/social";
import { MessageInputBar } from "@/components/messaging/MessageInputBar";

export function ChatComposer({
  buildingId,
  tab,
  placeholder,
}: {
  buildingId: string;
  tab: string;
  placeholder: string;
}) {
  return (
    <form
      action={postChatAction}
      className="mt-4 border-t pt-4"
      style={{ borderColor: "var(--card-border)" }}
    >
      <input type="hidden" name="buildingId" value={buildingId} />
      <input type="hidden" name="tab" value={tab} />
      <MessageInputBar name="body" placeholder={placeholder} />
    </form>
  );
}
