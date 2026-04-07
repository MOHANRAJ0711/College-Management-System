import { useCallback, useEffect, useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { apiError, formatDate } from './utils';

function pctColor(p) {
  if (p > 75) return 'text-emerald-700 bg-emerald-50';
  if (p >= 65) return 'text-amber-800 bg-amber-50';
  return 'text-red-700 bg-red-50';
}

function normalize(res) {
  const d = res?.data ?? res;
  const courses = Array.isArray(d.courses)
    ? d.courses
    : Array.isArray(d.records)
      ? d.records
      : [];
  return {
    overallPercent: Number(d.overallPercent ?? d.overall_percentage ?? d.percent ?? 0),
    courses: courses.map((c, i) => ({
      id: c.id ?? i,
      courseName: c.courseName ?? c.course ?? c.name ?? `Course ${i + 1}`,
      held: Number(c.classesHeld ?? c.held ?? c.total ?? 0),
      present: Number(c.present ?? c.attended ?? 0),
      absent: Number(c.absent ?? Math.max(0, (c.classesHeld ?? c.held ?? 0) - (c.present ?? 0))),
      percent: Number(
        c.percent ??
          c.percentage ??
          (c.classesHeld
            ? Math.round((c.present / c.classesHeld) * 1000) / 10
            : 0)
      ),
    })),
  };
}

export default function Attendance() {
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await api.get('/attendance/student', {
        params: { startDate, endDate },
      });
      setData(normalize(res));
    } catch (e) {
      const msg = apiError(e);
      setError(msg);
      toast.error(msg);
      setData({ overallPercent: 0, courses: [] });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const overall = Math.min(100, Math.max(0, data?.overallPercent ?? 0));
  const circumference = 2 * Math.PI * 44;
  const dash = (overall / 100) * circumference;

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading attendance…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Attendance</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track your presence across courses for the selected period.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <FiCalendar className="h-5 w-5 text-indigo-600" />
          <span className="font-medium text-slate-800">Date range</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex flex-col text-sm">
            <span className="text-slate-600">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="text-slate-600">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </label>
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Refreshing…' : 'Apply'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Overall attendance</p>
          <div className="relative mt-4 h-36 w-36">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-100"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="url(#attGrad)"
                strokeWidth="10"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="attGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold tabular-nums text-slate-900 sm:text-4xl">
                {overall.toFixed(1)}
                <span className="text-lg font-semibold text-slate-500">%</span>
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {formatDate(startDate)} — {formatDate(endDate)}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Course</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Held</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Present</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Absent</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.courses?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      No attendance records for this range.
                    </td>
                  </tr>
                ) : (
                  data.courses.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">{row.courseName}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{row.held}</td>
                      <td className="px-4 py-3 tabular-nums text-emerald-700">{row.present}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{row.absent}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${pctColor(row.percent)}`}
                        >
                          {row.percent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
