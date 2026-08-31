import { createFileRoute } from "@tanstack/react-router";
import { TaskDrawer } from "@/components/task-drawer";

export const Route = createFileRoute("/tasks/$taskId")({
  component: TaskPage,
});

function TaskPage() {
  const { taskId } = Route.useParams();
  return <TaskDrawer taskId={taskId} />;
}
