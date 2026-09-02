export function DeskPending() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="desk-spin inline-block size-5 rounded-full border-2 border-border border-t-accent" />
        Pulling delayed tape…
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="h-16 rounded-xl border border-border bg-surface" />
        <div className="h-16 rounded-xl border border-border bg-surface" />
        <div className="h-16 rounded-xl border border-border bg-surface" />
        <div className="h-16 rounded-xl border border-border bg-surface" />
      </div>
      <div className="h-72 rounded-xl border border-border bg-surface" />
    </div>
  );
}
