import Link from "next/link";

const accentMaroon = "#5C2E35";

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
      className="mx-3 grid grid-cols-3 gap-1 rounded-xl bg-black/[0.06] p-1"
      aria-label="تبويبات المحادثة"
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <Link
            key={item.id}
            href={`/building/${buildingId}/chat?tab=${item.id}`}
            className={`rounded-lg px-2 py-2.5 text-center text-[13px] font-semibold leading-tight transition ${
              isActive ? "text-white shadow-md" : "text-foreground/85"
            }`}
            style={isActive ? { backgroundColor: accentMaroon } : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
