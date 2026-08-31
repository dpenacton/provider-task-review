import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { QueueView } from "@/components/queue-view";

export const Route = createFileRoute("/tasks")({
  component: TasksLayout,
});

function TasksLayout() {
  // The queue stays mounted underneath so opening and closing the review drawer
  // never loses the provider's scroll position or filters.
  return (
    <AppShell>
      <QueueView />
      <Outlet />
    </AppShell>
  );
}
