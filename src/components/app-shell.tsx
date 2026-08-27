import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  CreditCard,
  LineChart,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTaskStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/tasks", label: "Tasks", icon: ClipboardList, live: true },
  { to: "#", label: "All Patients", icon: Users, live: false },
  { to: "#", label: "Messages", icon: MessageSquare, live: false },
  { to: "#", label: "Payment History", icon: CreditCard, live: false },
  { to: "#", label: "Analytics", icon: BarChart3, live: false },
  { to: "#", label: "Task Analytics", icon: LineChart, live: false },
  { to: "#", label: "Medical Licenses", icon: Shield, live: false },
  { to: "#", label: "Schedule", icon: Calendar, live: false },
  { to: "#", label: "Settings", icon: Settings, live: false },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pending = useTaskStore(
    (s) => s.tasks.filter((t) => t.status === "pending" || t.status === "in_review" || t.status === "partial").length,
  );
  const [open, setOpen] = useState(false);
  const hydrated = useTaskStore((s) => s.hydrated);
  const setHydrated = useTaskStore((s) => s.setHydrated);

  useEffect(() => {
    Promise.resolve(useTaskStore.persist.rehydrate()).finally(() => setHydrated(true));
  }, [setHydrated]);

  return (
    <div className="flex min-h-screen bg-background">
      {open ? (
        <button
          className="fixed inset-0 z-30 bg-foreground/30 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col border-r border-border bg-background transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center gap-2.5 px-5">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary">
            <span className="flex gap-0.5">
              <span className="h-3.5 w-0.5 rounded-full bg-primary-fg" />
              <span className="h-3.5 w-0.5 rounded-full bg-primary-fg" />
              <span className="h-3.5 w-0.5 rounded-full bg-primary-fg" />
            </span>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Minimal</span>
          <button className="ml-auto md:hidden" onClick={() => setOpen(false)} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
          {NAV.map((item) => {
            const active = item.live && pathname.startsWith("/tasks");
            const Icon = item.icon;
            const inner = (
              <>
                <Icon className="size-[18px]" strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>
                {item.live && pending > 0 ? (
                  <span
                    className={cn(
                      "tabular rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                      active ? "bg-white/20 text-white" : "bg-muted-bg text-muted",
                    )}
                  >
                    {pending}
                  </span>
                ) : null}
              </>
            );
            if (!item.live) {
              return (
                <span
                  key={item.label}
                  className="flex h-10 items-center gap-3 rounded-lg px-3 text-[13.5px] text-muted"
                >
                  {inner}
                </span>
              );
            }
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-fg"
                    : "text-foreground hover:bg-muted-bg",
                )}
              >
                {inner}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Provider view</p>
          <p className="mt-1 text-sm font-medium">Dr. Jonathan Miller</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="hidden items-center gap-2 rounded-lg border border-accent-border bg-accent-soft px-3 py-1.5 text-sm text-accent md:flex">
            Impersonating Doctor: <span className="font-semibold">Jonathan Miller</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted sm:inline">Dr. Safa Ghori</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-fg">
              SG
            </span>
          </div>
        </header>
        <main className="min-w-0 flex-1">
          {hydrated ? (
            children
          ) : (
            <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">Loading…</div>
          )}
        </main>
      </div>
    </div>
  );
}
