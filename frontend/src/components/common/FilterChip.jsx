import { FiX } from 'react-icons/fi';

export default function FilterChip({ label, onClear }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
      <span className="max-w-[22rem] truncate">{label}</span>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full p-1 text-slate-500 transition hover:bg-white hover:text-slate-800"
          aria-label={`Remove filter: ${label}`}
          title="Remove filter"
        >
          <FiX className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  );
}

