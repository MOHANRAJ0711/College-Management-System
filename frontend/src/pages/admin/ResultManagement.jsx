import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAward,
  FiBarChart2,
  FiCheckCircle,
  FiRefreshCw,
  FiToggleLeft,
  FiToggleRight,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function errMsg(e) {
  return e.response?.data?.message || e.message || 'Request failed';
}

function normalizeList(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

export default function ResultManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [examId, setExamId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  const exams = useMemo(() => {
    const map = new Map();
    results.forEach((r) => {
      const id = r.examId ?? r.exam?._id ?? r.exam?.id;
      const name =
        r.examName ?? r.exam?.name ?? r.examTitle ?? (id ? `Exam ${String(id).slice(-6)}` : null);
      if (id && !map.has(String(id))) map.set(String(id), { id: String(id), name: name || 'Exam' });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [results]);

  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/results');
      const list = normalizeList({ data });
      setResults(list);
    } catch (e) {
      toast.error(errMsg(e));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  useEffect(() => {
    if (examId || !results.length) return;
    const first = results[0];
    const eid = first.examId ?? first.exam?._id ?? first.exam?.id;
    if (eid) setExamId(String(eid));
  }, [results, examId]);

  const loadAnalysis = useCallback(async (id) => {
    if (!id) {
      setAnalysis(null);
      return;
    }
    setAnalysisLoading(true);
    try {
      const { data } = await api.get(`/results/analysis/${id}`);
      setAnalysis(data?.analysis ?? data);
    } catch (e) {
      toast.error(errMsg(e));
      setAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  useEffect(() => {
    if (examId) loadAnalysis(examId);
    else setAnalysis(null);
  }, [examId, loadAnalysis]);

  const filteredRows = useMemo(() => {
    if (!examId) return results;
    return results.filter((r) => String(r.examId ?? r.exam?._id ?? r.exam?.id) === examId);
  }, [results, examId]);

  const publishedForExam = useMemo(() => {
    const row = filteredRows[0];
    if (row?.published !== undefined) return Boolean(row.published);
    if (row?.resultPublished !== undefined) return Boolean(row.resultPublished);
    return null;
  }, [filteredRows]);

  const togglePublish = async (next) => {
    if (!examId) {
      toast.warn('Select an exam first.');
      return;
    }
    setPublishLoading(true);
    try {
      await api.put(`/results/publish/${examId}`, { published: next });
      toast.success(next ? 'Results published.' : 'Results unpublished.');
      await loadResults();
      await loadAnalysis(examId);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setPublishLoading(false);
    }
  };

  const columns = [
    {
      key: 'student',
      label: 'Student',
      render: (_, row) =>
        row.studentName ??
        row.student?.name ??
        row.rollNumber ??
        row.student?.rollNumber ??
        '—',
    },
    { key: 'marks', label: 'Marks', render: (v, row) => row.marks ?? row.totalMarks ?? v ?? '—' },
    { key: 'grade', label: 'Grade', render: (v, row) => row.grade ?? v ?? '—' },
    {
      key: 'status',
      label: 'Status',
      render: (v, row) => {
        const s = row.status ?? v ?? '—';
        const ok = String(s).toLowerCase() === 'pass' || s === true;
        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
            }`}
          >
            {typeof s === 'boolean' ? (s ? 'Pass' : 'Fail') : String(s)}
          </span>
        );
      },
    },
  ];

  const passPct = analysis?.passPercentage ?? analysis?.passPercent ?? analysis?.pass_rate;
  const avgMarks = analysis?.averageMarks ?? analysis?.avgMarks ?? analysis?.average;
  const gradeDist = analysis?.gradeDistribution ?? analysis?.grades ?? analysis?.distribution;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Result management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review marks, publish results, and view performance analytics
            {user?.name ? ` · ${user.name}` : ''}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadResults()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
        >
          <FiRefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <label className="block text-sm font-semibold text-slate-800" htmlFor="exam-select">
            Select exam
          </label>
          <select
            id="exam-select"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none ring-indigo-500/30 focus:border-indigo-400 focus:bg-white focus:ring-4"
          >
            <option value="">Choose an exam…</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!examId || publishLoading}
              onClick={() => togglePublish(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishLoading ? (
                <FiRefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FiToggleRight className="h-5 w-5" />
              )}
              Publish results
            </button>
            <button
              type="button"
              disabled={!examId || publishLoading}
              onClick={() => togglePublish(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiToggleLeft className="h-5 w-5" />
              Unpublish
            </button>
            {publishedForExam !== null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                Current: {publishedForExam ? 'Published' : 'Draft'}
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-blue-700 p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 text-indigo-100">
            <FiAward className="h-5 w-5" />
            <p className="text-sm font-semibold">Quick insight</p>
          </div>
          <p className="mt-2 text-sm text-indigo-100/90">
            Publishing controls visibility for students. Analysis updates after publish actions.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <FiBarChart2 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Result analysis</h2>
        </div>
        {analysisLoading ? (
          <div className="py-10">
            <LoadingSpinner label="Loading analysis…" />
          </div>
        ) : !examId ? (
          <p className="text-sm text-slate-600">Select an exam to view analysis.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pass %</p>
              <p className="mt-2 text-3xl font-bold text-indigo-700 tabular-nums">
                {passPct != null ? `${Number(passPct).toFixed(1)}%` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Average marks
              </p>
              <p className="mt-2 text-3xl font-bold text-indigo-700 tabular-nums">
                {avgMarks != null ? Number(avgMarks).toFixed(2) : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 md:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Grade distribution
              </p>
              <div className="mt-3 space-y-2">
                {gradeDist && typeof gradeDist === 'object' && !Array.isArray(gradeDist) ? (
                  Object.entries(gradeDist).map(([g, c]) => (
                    <div key={g} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{g}</span>
                      <span className="tabular-nums text-slate-600">{String(c)}</span>
                    </div>
                  ))
                ) : Array.isArray(gradeDist) ? (
                  gradeDist.map((item) => (
                    <div
                      key={item.grade ?? item.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="font-medium text-slate-700">
                        {item.grade ?? item.label}
                      </span>
                      <span className="tabular-nums text-slate-600">{item.count ?? item.value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No distribution data.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Results</h2>
        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Loading results…" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows.map((r, i) => ({
              ...r,
              id: r._id ?? r.id ?? `${examId || 'all'}-${i}`,
            }))}
            loading={false}
            emptyMessage={examId ? 'No results for this exam.' : 'No results loaded.'}
          />
        )}
      </div>
    </div>
  );
}
