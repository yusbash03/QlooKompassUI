/**
 * Affinity as returned by Qloo (0–1). Renders nothing when Qloo returned no value — no invented scales (FE-01 §6).
 */
export function AffinityBar({ value, label = 'Affinity' }: { value: number | null | undefined; label?: string }) {
  if (value === null || value === undefined) return null;
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div className="flex max-w-72 flex-col gap-1.5">
      <div className="flex justify-between text-xs font-medium text-ink">
        <span>{label}</span>
        <span className="font-mono">{value.toFixed(2)}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={value}
        aria-valuetext={value.toFixed(2)}
        className="h-1.5 rounded-full bg-border"
      >
        <div className="h-full rounded-full bg-evidence" style={{ width: `${clamped * 100}%` }} />
      </div>
    </div>
  );
}
