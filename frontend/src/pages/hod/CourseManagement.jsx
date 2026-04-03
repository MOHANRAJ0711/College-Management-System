import { useEffect, useState } from 'react';
import { FiBookOpen } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const typeColor = { core: 'bg-indigo-100 text-indigo-800', elective: 'bg-sky-100 text-sky-800', lab: 'bg-amber-100 text-amber-800', seminar: 'bg-violet-100 text-violet-800' };

export default function HODCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semFilter, setSemFilter] = useState('');

  useEffect(() => {
    api.get('/hod/courses').then(({ data }) => setCourses(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = semFilter ? courses.filter(c => String(c.semester) === semFilter) : courses;

  const grouped = filtered.reduce((acc, c) => {
    const k = `Semester ${c.semester ?? 'N/A'}`;
    if (!acc[k]) acc[k] = [];
    acc[k].push(c);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Course Management</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Courses offered in your department</p>
        </div>
        <select value={semFilter} onChange={e => setSemFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none">
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
        </select>
      </header>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400">
          <FiBookOpen className="h-8 w-8 opacity-30" /><p>No courses found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort().map(([sem, list]) => (
            <div key={sem}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{sem}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map(c => (
                  <div key={c._id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{c.code}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${typeColor[c.type] ?? 'bg-slate-100 text-slate-600'}`}>{c.type}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>📚 {c.credits} credits</span>
                      <span>📅 Sem {c.semester}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
