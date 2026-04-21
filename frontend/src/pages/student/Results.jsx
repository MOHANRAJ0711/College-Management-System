import { FiChevronDown, FiChevronUp, FiDownload, FiTrendingUp, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { apiError } from './utils';

function statusBadge(status) {
  const s = String(status ?? '').toLowerCase();
  const pass = s === 'pass' || s === 'passed';
  return pass
    ? 'bg-emerald-100 text-emerald-800 ring-emerald-600/20'
    : 'bg-red-100 text-red-800 ring-red-600/20';
}

function normalize(standardRes, batchRes) {
  const d = standardRes?.data ?? standardRes;
  const bData = batchRes?.data ?? batchRes ?? [];
  
  // Handle old format (array) or new format (object)
  const examResults = Array.isArray(d) ? d : (Array.isArray(d.examResults) ? d.examResults : []);
  const standardCgpa = Number(d.cgpa || 0);

  // Parse batch results from the new result-upload batches
  const normalizedBatches = bData.map((b) => ({
    id: b.batchId,
    label: b.title || 'Result',
    semester: b.semester || '?',
    status: b.result?.status || 'Pass',
    type: 'batch',
    subjects: b.result?.subjects || [],
    cgpa: b.result?.cgpa,
    date: b.date,
    description: b.description
  }));

  // 1. Group individual exam results by semester or batching
  const semesterMap = {};

  examResults.forEach((r) => {
    const semKey = r.exam?.semester ?? r.semester ?? 'Other';
    if (!semesterMap[semKey]) {
      semesterMap[semKey] = {
        id: `sem-${semKey}`,
        label: `Semester ${semKey}`,
        semester: semKey,
        results: [],
        type: 'standard'
      };
    }
    semesterMap[semKey].results.push({
      id: r._id,
      subject: r.course?.name || r.exam?.name || 'Subject',
      internal: r.internalMarks || 0,
      semesterMarks: r.marksObtained || 0,
      total: r.marksObtained + (r.internalMarks || 0),
      grade: r.grade || '—',
      status: r.grade === 'F' ? 'Fail' : 'Pass'
    });
  });

  // Use standard grouping logic for examResults by semester

  // Combine them for the UI
  // Standard results grouped by semester
  const standardSemesters = Object.values(semesterMap).map(sem => ({
    ...sem,
    subjects: sem.results,
    sgpa: 0, // Placeholder
    status: sem.results.some(r => r.status === 'Fail') ? 'Fail' : 'Pass'
  }));

  return {
    cgpa: standardCgpa,
    semesters: [...standardSemesters, ...normalizedBatches]
  };
}

export default function Results() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [examRes, batchRes] = await Promise.all([
          api.get('/results/student'),
          api.get('/result-upload/my-results')
        ]);
        
        const normalized = normalize(examRes, batchRes);
        if (!cancelled) {
          setData(normalized);
          if (normalized.semesters.length) {
            setOpenId(normalized.semesters[0].id);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(apiError(e));
          toast.error(apiError(e));
          setData({ cgpa: 0, semesters: [] });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    const list = data?.semesters ?? [];
    return [...list].sort((a, b) => Number(b.semester) - Number(a.semester));
  }, [data?.semesters]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading results…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Results</h1>
          <p className="mt-1 text-sm text-slate-600">
            Semester-wise marks, grades, and cumulative performance.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-center shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">CGPA</p>
            <p className="text-2xl font-bold tabular-nums text-indigo-900">
              {(data?.cgpa ?? 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
            No published results yet.
          </div>
        ) : (
          sorted.map((sem) => {
            const isOpen = openId === sem.id;
            return (
              <div
                key={sem.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : sem.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                >
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{sem.label}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <span>SGPA: {(sem.sgpa ?? 0).toFixed(2)}</span>
                      <span className="text-slate-300">|</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusBadge(sem.status)}`}
                      >
                        {sem.status}
                      </span>
                    </div>
                  </div>
                  {isOpen ? (
                    <FiChevronUp className="h-5 w-5 shrink-0 text-slate-500" />
                  ) : (
                    <FiChevronDown className="h-5 w-5 shrink-0 text-slate-500" />
                  )}
                </button>
                {isOpen ? (
                  <div className="border-t border-slate-100 px-5 pb-5">
                    <div className="overflow-x-auto pt-4">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 font-semibold text-slate-700">Subject</th>
                            {sem.type === 'batch' ? (
                              <th className="px-3 py-2 font-semibold text-slate-700">Grade</th>
                            ) : (
                              <>
                                <th className="px-3 py-2 font-semibold text-slate-700">Internal</th>
                                <th className="px-3 py-2 font-semibold text-slate-700">Semester</th>
                                <th className="px-3 py-2 font-semibold text-slate-700">Total</th>
                                <th className="px-3 py-2 font-semibold text-slate-700">Grade</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(sem.subjects?.length ?? 0) === 0 ? (
                            <tr>
                              <td colSpan={sem.type === 'batch' ? 2 : 5} className="px-3 py-8 text-center text-slate-500">
                                No subject rows.
                              </td>
                            </tr>
                          ) : (
                            sem.subjects.map((s, idx) => (
                              <tr key={s.id || s.code || idx} className="hover:bg-slate-50/80">
                                <td className="px-3 py-2.5 font-medium text-slate-900">{sem.type === 'batch' ? s.code : s.subject}</td>
                                {sem.type === 'batch' ? (
                                  <td className="px-3 py-2.5">
                                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${s.status === 'Fail' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                      {s.grade}
                                    </span>
                                  </td>
                                ) : (
                                  <>
                                    <td className="px-3 py-2.5 tabular-nums text-slate-700">{s.internal}</td>
                                    <td className="px-3 py-2.5 tabular-nums text-slate-700">
                                      {s.semesterMarks}
                                    </td>
                                    <td className="px-3 py-2.5 tabular-nums font-semibold text-slate-900">
                                      {s.total}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                                        {s.grade}
                                      </span>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {sem.type === 'batch' && (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          <FiDownload className="h-4 w-4" />
                          Download Result Card
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
