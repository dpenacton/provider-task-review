import { createFileRoute, Link } from "@tanstack/react-router";
import { ReviewView } from "@/components/review-view";
import { useTaskStore } from "@/lib/store";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskPage,
});

function TaskPage() {
  const { taskId } = Route.useParams();
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));

  if (!task) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-xl font-semibold">Task not found</h1>
        <p className="mt-2 text-sm text-muted">It may have been reset or the link is stale.</p>
        <Link to="/tasks" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
          Back to tasks
        </Link>
      </div>
    );
  }

  return <ReviewView task={task} />;
}
