import { createFileRoute, Link } from "@tanstack/react-router";
import { SEED_TASKS } from "@/lib/demo-data";
import { useTaskStore } from "@/lib/store";

export const Route = createFileRoute("/intake/$taskId")({
  component: IntakePage,
});

function IntakePage() {
  const { taskId } = Route.useParams();
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId)) ?? SEED_TASKS.find((t) => t.id === taskId);
  if (!task) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm">Intake not found.</p>
        <Link to="/tasks" className="mt-3 inline-block text-sm font-semibold text-accent">
          Back
        </Link>
      </div>
    );
  }
  const p = task.patient;
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Intake form</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{p.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {p.code} · {p.dob} · {task.service}
      </p>
      <dl className="mt-8 space-y-4">
        {task.intake.map((qa) => (
          <div key={qa.q} className="border-b border-border pb-4">
            <dt className="text-sm text-muted">{qa.q}</dt>
            <dd className="mt-1 text-[15px] font-medium">{qa.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
