import { useEffect, useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function HODTimetableManagement() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semFilter, setSemFilter] = useState('');

  useEffect(() => {
    const params = {};
    if (semFilter) params.semester = semFilter;
    api.get('/timetable', { params })
      .then(({ data }) => {
        const d = data?.data ?? data;
        setEntries(Array.isArray(d) ? d : d?.items ?? []);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [semFilter]);

  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = entries.filter(e => e.day?.toLowerCase() === day.toLowerCase());
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Timetable</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Department timetable overview</p>
        </div>
        <select value={semFilter} onChange={e => setSemFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none">
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
        </select>
      </header>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
      ) : entries.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
          <FiCalendar className="h-8 w-8 opacity-30" /><p>No timetable entries found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map(day => {
            const dayEntries = grouped[day];
            if (!dayEntries || dayEntries.length === 0) return null;
            return (
              <div key={day} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
                <div className="border-b border-slate-100 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2">
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">{day}</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {dayEntries.sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')).map(e => (
                    <div key={e._id} className="flex items-center gap-4 px-4 py-3">
                      <div className="w-24 shrink-0 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {e.startTime} – {e.endTime}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">{e.subject ?? e.course?.name ?? '—'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{e.faculty?.user?.name ?? ''} · Room {e.room ?? '—'}</p>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Sem {e.semester} · {e.section}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
