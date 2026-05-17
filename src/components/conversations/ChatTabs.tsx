import Link from "next/link";

export type ChatTabId = "residents" | "announcements" | "group";

export function ChatTabs({
  buildingId,
  active,
  labels,
}: {
  buildingId: string;
  active: ChatTabId;
  labels: { residents: string; announcements: string; group: string };
}) {
  const items: { id: ChatTabId; label: string }[] = [
    { id: "residents", label: labels.residents },
    { id: "announcements", label: labels.announcements },
    { id: "group", label: labels.group },
  ];

  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="تبويبات المحادثة"
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <Link
            key={item.id}
            href={`/building/${buildingId}/chat?tab=${item.id}`}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              isActive ? "shadow-sm" : "border"
            }`}
            style={
              isActive
                ? {
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-foreground)",
                  }
                : {
                    backgroundColor: "var(--card)",
                    borderColor: "var(--card-border)",
                    color: "var(--foreground)",
                  }
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
