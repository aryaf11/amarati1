import type { ChatLine } from "@/lib/chat-demo";

const bubbleGreen = "#4B533C";
const accentMaroon = "#5C2E35";

export function ChatBubbleList({
  lines,
  pinnedText,
}: {
  lines: ChatLine[];
  pinnedText?: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-3">
      {lines.map((line, i) => (
        <div
          key={`${line.senderLabel}-${i}`}
          className="flex flex-col items-end gap-1.5"
        >
          <span className="text-xs font-semibold text-foreground/80">
            {line.senderLabel}
          </span>
          <div
            className="max-w-[88%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed text-white"
            style={{ backgroundColor: bubbleGreen }}
          >
            <p className="whitespace-pre-wrap text-end">{line.body}</p>
          </div>
        </div>
      ))}
      {lines.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">—</p>
      ) : null}
      {pinnedText ? (
        <div
          className="mt-2 w-full rounded-2xl px-4 py-3.5 text-center text-sm font-semibold text-white"
          style={{ backgroundColor: accentMaroon }}
        >
          {pinnedText}
        </div>
      ) : null}
    </div>
  );
}
