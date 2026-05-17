import type { ChatLine } from "@/lib/chat-types";

export function ChatBubbleList({
  lines,
  emptyText,
}: {
  lines: ChatLine[];
  emptyText?: string | null;
}) {
  if (lines.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        {emptyText ?? "—"}
      </p>
    );
  }

  return (
    <div className="max-h-[min(52vh,28rem)] space-y-4 overflow-y-auto pe-1">
      {lines.map((line, i) => (
        <div
          key={`${line.senderLabel}-${i}`}
          className={`flex flex-col gap-1 ${line.isOwn ? "items-end" : "items-start"}`}
        >
          <span className="text-xs font-medium text-muted">{line.senderLabel}</span>
          <div
            className="max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
            style={
              line.isOwn
                ? {
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-foreground)",
                  }
                : {
                    backgroundColor: "var(--accent-soft)",
                    color: "var(--foreground)",
                    border: "1px solid var(--card-border)",
                  }
            }
          >
            <p className="whitespace-pre-wrap text-end">{line.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
