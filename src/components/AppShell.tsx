import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Pulse" },
  { to: "/options", label: "Options" },
  { to: "/news", label: "News" },
  { to: "/desk", label: "Desk" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const symbol = q.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
    if (!symbol) return;
    void navigate({ to: "/ticker/$symbol", params: { symbol } });
    setQ("");
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-baseline gap-2 no-underline">
              <span className="font-display text-lg tracking-tight text-fg">Sigma Pulse</span>
              <span className="text-xs uppercase tracking-[0.18em] text-subtle">Desk</span>
            </Link>
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm no-underline transition-colors duration-(--motion-quick)",
                    active ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <form onSubmit={onSearch} className="sm:ml-auto">
            <label className="sr-only" htmlFor="ticker-search">
              Ticker
            </label>
            <input
              id="ticker-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="AAPL"
              autoCapitalize="characters"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 font-mono text-sm text-fg outline-none ring-accent/50 placeholder:text-subtle focus:ring-2 sm:w-44"
            />
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-5 pb-16">{children}</main>
    </div>
  );
}
