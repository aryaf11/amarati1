import type { AppLocale } from "@/lib/locale";
import { allScoreBands, getScoreBand } from "@/lib/building-score-band";
import { ui } from "@/lib/ui-strings";

type ScoreRow = { id: string; month: string; score: number };

export function MonthlyScoreLog({
  scores,
  locale,
}: {
  scores: ScoreRow[];
  locale: AppLocale;
}) {
  const s = ui(locale).supervisor;
  const scale = allScoreBands(locale);

  return (
    <div className="space-y-4">
      <div
        className="overflow-x-auto rounded-2xl border text-xs"
        style={{ borderColor: "var(--card-border)" }}
      >
        <table className="w-full border-collapse text-right">
          <thead>
            <tr
              className="border-b text-muted"
              style={{ borderColor: "var(--card-border)", backgroundColor: "var(--accent-soft)" }}
            >
              <th className="p-2 font-semibold">{s.scoreScaleRange}</th>
              <th className="p-2 font-semibold">{s.scoreScaleLabel}</th>
              <th className="p-2 font-semibold">{s.scoreScaleDesc}</th>
            </tr>
          </thead>
          <tbody>
            {scale.map((row) => (
              <tr key={row.rangeLabel} className="border-b" style={{ borderColor: "var(--card-border)" }}>
                <td className="p-2 whitespace-nowrap">{row.rangeLabel}</td>
                <td className="p-2 whitespace-nowrap">
                  <span aria-hidden>{row.emoji}</span> {row.label}
                </td>
                <td className="p-2">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {scores.length === 0 ? (
        <p className="text-sm text-muted">{s.scoreEmpty}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {scores.map((sc) => {
            const band = getScoreBand(sc.score, locale);
            return (
              <li
                key={sc.id}
                className="rounded-xl border p-3"
                style={{
                  borderColor: "var(--card-border)",
                  backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-muted">{sc.month}</span>
                  <span className="font-mono text-lg font-bold text-accent">{sc.score}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  <span aria-hidden>{band.emoji}</span> {band.label} · {band.rangeLabel}
                </p>
                <p className="mt-0.5 text-xs">{band.description}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
