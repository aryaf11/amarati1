import { postChatAction } from "@/actions/social";
import { MessageInputBar } from "@/components/messaging/MessageInputBar";

export function ChatComposer({
  buildingId,
  tab,
  placeholder,
  disabled,
}: {
  buildingId: string;
  tab: string;
  placeholder: string;
  disabled?: boolean;
}) {
  if (disabled) return null;

  return (
    <form action={postChatAction} className="mt-4 border-t pt-4" style={{ borderColor: "var(--card-border)" }}>
      <input type="hidden" name="buildingId" value={buildingId} />
      <input type="hidden" name="tab" value={tab} />
      <MessageInputBar name="body" placeholder={placeholder} disabled={disabled} />
    </form>
  );
}
