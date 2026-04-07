import { useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiFilter } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { apiError, formatDateTime } from './utils';

const TYPES = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'academic', label: 'Academic' },
  { id: 'exam', label: 'Exam' },
  { id: 'fee', label: 'Fee' },
  { id: 'placement', label: 'Placement' },
];

function typeStyle(t) {
  const x = String(t ?? 'general').toLowerCase();
  const map = {
    general: 'bg-slate-100 text-slate-800',
    academic: 'bg-indigo-100 text-indigo-800',
    exam: 'bg-amber-100 text-amber-900',
    fee: 'bg-emerald-100 text-emerald-900',
    placement: 'bg-violet-100 text-violet-900',
  };
  return map[x] ?? map.general;
}

function normalize(res) {
  const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.notifications;
  const arr = Array.isArray(list) ? list : [];
  return arr.map((n, i) => ({
    id: n.id ?? n._id ?? i,
    title: n.title ?? 'Notice',
    message: n.message ?? n.body ?? n.content ?? '',
    type: (n.type ?? n.category ?? 'general').toLowerCase(),
    createdAt: n.createdAt ?? n.date ?? n.sentAt,
  }));
}

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/notifications');
        if (!cancelled) setItems(normalize(data));
      } catch (e) {
        if (!cancelled) {
          const msg = apiError(e);
          setError(msg);
          toast.error(msg);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((n) => n.type === filter);
  }, [items, filter]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading notifications…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Official announcements filtered by category.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FiFilter className="h-4 w-4 text-indigo-600" />
          <span className="font-medium text-slate-800">Filter</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === t.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {filtered.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-slate-500">
            No notifications in this category.
          </li>
        ) : (
          filtered.map((n) => {
            const expanded = openId === n.id;
            return (
              <li
                key={n.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(expanded ? null : n.id)}
                  className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeStyle(n.type)}`}
                      >
                        {n.type}
                      </span>
                      <span className="text-xs text-slate-400">{formatDateTime(n.createdAt)}</span>
                    </div>
                    <p className="mt-2 font-semibold text-slate-900">{n.title}</p>
                  </div>
                  {expanded ? (
                    <FiChevronUp className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                  ) : (
                    <FiChevronDown className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                  )}
                </button>
                {expanded ? (
                  <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-700">
                    {n.message || 'No additional details.'}
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
