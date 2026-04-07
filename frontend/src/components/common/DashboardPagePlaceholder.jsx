export default function DashboardPagePlaceholder({ title }) {
  return (
    <div className="rounded-2xl border border-indigo-100/80 bg-white p-8 shadow-sm shadow-indigo-100/50">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-600">
        This section is coming soon. You&apos;re viewing a placeholder while we build the full experience.
      </p>
    </div>
  );
}
