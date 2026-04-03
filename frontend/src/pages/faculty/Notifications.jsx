import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiBell, FiFilter } from 'react-icons/fi';
import { toast } from 'react-toastify';

import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'general', label: 'General' },
  { value: 'academic', label: 'Academic' },
  { value: 'exam', label: 'Exam' },
  { value: 'fee', label: 'Fee' },
  { value: 'placement', label: 'Placement' },
  { value: 'event', label: 'Event' },
];

function refId(x) {
  if (!x) return '';
  if (typeof x === 'object' && x._id) return x._id;
  return x;
}

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [type, setType] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications', {
        params: type ? { type } : {},
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [items]
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600">
            Announcements visible to faculty.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FiFilter className="h-4 w-4 text-indigo-600" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          >
            {TYPES.map((t) => (
              <option key={t.value || 'all'} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner label="Loading…" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <FiBell className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-600">No notifications found.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((n) => (
            <li
              key={refId(n._id)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-indigo-800">
                    {n.type || 'general'}
                  </span>
                  {n.priority ? (
                    <span className="ml-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                      {n.priority}
                    </span>
                  ) : null}
                </div>
                <time className="text-xs text-slate-500">
                  {n.createdAt
                    ? new Date(n.createdAt).toLocaleString()
                    : ''}
                </time>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                {n.title || 'Notice'}
              </h2>
              {n.message ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {n.message}
                </p>
              ) : null}
              {n.department?.name ? (
                <p className="mt-3 text-xs text-slate-500">
                  Department: {n.department.name}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
