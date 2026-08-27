import { createFileRoute, Link } from "@tanstack/react-router";
import { idDocsFor } from "@/lib/catalog";
import { SEED_TASKS } from "@/lib/demo-data";
import { useTaskStore } from "@/lib/store";
import { initials } from "@/lib/utils";

export const Route = createFileRoute("/id/$taskId")({
  component: IdPage,
});

function IdPage() {
  const { taskId } = Route.useParams();
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId)) ?? SEED_TASKS.find((t) => t.id === taskId);
  if (!task) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm">ID not found.</p>
        <Link to="/tasks" className="mt-3 inline-block text-sm font-semibold text-accent">
          Back
        </Link>
      </div>
    );
  }
  const p = task.patient;
  const docs = idDocsFor(task);
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Government ID</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{p.name}</h1>
      <p className="mt-1 text-sm text-muted">{docs[0]?.name ?? `${p.code}-id.jpg`}</p>

      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex gap-4 p-5">
          <div className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-muted-bg text-lg font-semibold">
            {initials(p.name)}
          </div>
          <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted">Name</dt>
              <dd className="font-medium">{p.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">DOB</dt>
              <dd className="font-medium">{p.dob}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Sex</dt>
              <dd className="font-medium">{p.sex}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">State</dt>
              <dd className="font-medium">{p.state}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-muted">Patient code</dt>
              <dd className="font-medium">{p.code}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
