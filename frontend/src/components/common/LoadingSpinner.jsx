export default function LoadingSpinner({ className = '', label = 'Loading…' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      {label ? <p className="text-sm font-medium text-slate-600">{label}</p> : null}
    </div>
  );
}
