export function MissingBits() {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-medium">Still missing to pull the trigger</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        <li>A date. The queue is a watch list, not a PDUFA / earnings calendar.</li>
        <li>Live flow. Unusual options here are delayed, one expiry, volume vs open interest — not a sweep feed.</li>
        <li>Your size and stop. Risk to the 20-day is a tape measure, not a book.</li>
        <li>A live quote. This feed is delayed. You cannot beat the print with it. You can only see the coil before it spends.</li>
      </ul>
    </section>
  );
}
