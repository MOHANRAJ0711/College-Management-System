import { useEffect, useState } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function DepartmentOverview() {
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semFilter, setSemFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  useEffect(() => {
    Promise.all([api.get('/hod/dashboard'), api.get('/hod/students')])
      .then(([dRes, sRes]) => { setData(dRes.data); setStudents(sRes.data); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s => {
    if (semFilter && String(s.semester) !== semFilter) return false;
    if (sectionFilter && s.section !== sectionFilter) return false;
    return true;
  });

  const semOptions = [...new Set(students.map(s => s.semester).filter(Boolean))].sort();
  const sectionOptions = [...new Set(students.map(s => s.section).filter(Boolean))].sort();

  if (loading) return <div className="flex h-60 items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Department Overview</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {data?.department?.name} ({data?.department?.code})
        </p>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Students', value: data?.stats?.students ?? 0, color: 'from-emerald-500 to-teal-600' },
          { label: 'Faculty Members', value: data?.stats?.faculty ?? 0, color: 'from-indigo-500 to-blue-600' },
          { label: 'Courses', value: data?.stats?.courses ?? 0, color: 'from-amber-500 to-orange-500' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.color} p-5 text-white shadow`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="mt-1 text-sm font-medium text-white/80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Students table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 dark:border-slate-700 px-5 py-3">
          <h2 className="font-semibold text-slate-900 dark:text-white flex-1">Students ({filtered.length})</h2>
          <select value={semFilter} onChange={e => setSemFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs text-slate-900 dark:text-white">
            <option value="">All Semesters</option>
            {semOptions.map(s => <option key={s} value={String(s)}>Sem {s}</option>)}
          </select>
          <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs text-slate-900 dark:text-white">
            <option value="">All Sections</option>
            {sectionOptions.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <tr>
                {['Roll No.', 'Name', 'Semester', 'Section', 'Batch'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No students found</td></tr>
              ) : filtered.map(s => (
                <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{s.rollNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.semester ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.section ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.batch ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
