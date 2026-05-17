import type { ResidentRow } from "@/lib/chat-types";

export function ResidentsList({
  residents,
  emptyText,
}: {
  residents: ResidentRow[];
  emptyText: string;
}) {
  if (residents.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">{emptyText}</p>;
  }

  return (
    <ul className="divide-y rounded-2xl border" style={{ borderColor: "var(--card-border)" }}>
      {residents.map((r) => (
        <li
          key={`${r.name}-${r.unitLabel}`}
          className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
        >
          <span className="font-medium">{r.name}</span>
          <span className="text-muted">
            {r.unitLabel} · {r.roleLabel}
          </span>
        </li>
      ))}
    </ul>
  );
}
