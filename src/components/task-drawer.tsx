import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ReviewView } from "@/components/review-view";
import { useTaskStore } from "@/lib/store";

/**
 * The review drawer sits over the task list at its own URL, so a plain click
 * opens it in place and a Ctrl-click opens the very same view in a new tab —
 * which is how Miller works through a queue.
 */
export function TaskDrawer({ taskId }: { taskId: string }) {
  const navigate = useNavigate();
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function close() {
    navigate({ to: "/tasks" });
  }

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Task review">
      <button
        aria-label="Close review"
        onClick={close}
        className="absolute inset-0 bg-foreground/40 animate-in fade-in duration-150"
      />
      <div className="absolute inset-0 flex flex-col overflow-hidden bg-background shadow-2xl animate-in slide-in-from-right duration-200 sm:left-[12%] lg:left-[22%]">
        {task ? (
          <ReviewView
            task={task}
            onClose={close}
            onGo={(next) => navigate({ to: "/tasks/$taskId", params: { taskId: next } })}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-base font-semibold">Task not found</p>
            <p className="text-sm text-muted">It may have been reset, or the link is stale.</p>
            <button onClick={close} className="text-sm font-semibold text-accent hover:underline">
              Back to tasks
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
