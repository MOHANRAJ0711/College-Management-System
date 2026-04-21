import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FiUploadCloud,
  FiFileText,
  FiDownload,
  FiBarChart2,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiUsers,
  FiAward,
  FiTrendingUp,
  FiPercent,
  FiFilter,
  FiSave,
  FiTrash2,
  FiClock,
  FiChevronDown,
  FiEye,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function StatBox(props) {
  const { icon: Icon, label, value, color = 'indigo' } = props;
  const colors = {
    indigo: 'from-indigo-500 to-indigo-700 shadow-indigo-500/30',
    green: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
    red: 'from-rose-500 to-red-600 shadow-rose-500/30',
    blue: 'from-sky-500 to-blue-600 shadow-sky-500/30',
    amber: 'from-amber-400 to-orange-500 shadow-amber-500/30',
    purple: 'from-violet-500 to-purple-700 shadow-violet-500/30',
  };
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors[color] || colors.indigo} p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
        </div>
        <span className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
          <Icon className="h-6 w-6" />
        </span>
      </div>
    </div>
  );
}

export default function ResultUpload() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [students, setStudents] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const inputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [batchTitle, setBatchTitle] = useState('');
  const [batchDept, setBatchDept] = useState('');
  const [batchSemester, setBatchSemester] = useState('');
  const [batchSubject, setBatchSubject] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [viewBatch, setViewBatch] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [notifyStudents, setNotifyStudents] = useState(false);

  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const { data } = await api.get('/result-upload/batches');
      setBatches(Array.isArray(data) ? data : []);
    } catch {
      setBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f && f.type !== 'application/pdf') { toast.error('Please select a PDF file'); return; }
    setFile(f || null);
    setStudents([]); setAnalysis(null); setPdfInfo(null);
    setViewBatch(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type !== 'application/pdf') { toast.error('Please drop a PDF file'); return; }
    if (f) { setFile(f); setStudents([]); setAnalysis(null); setPdfInfo(null); setViewBatch(null); }
  };

  const uploadPDF = useCallback(async () => {
    if (!file) { toast.warn('Select a PDF first'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/result-upload/upload-pdf', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStudents(data.students || []);
      setAnalysis(data.analysis || null);
      setPdfInfo(data.pdfInfo || null);
      setViewBatch(null);
      toast.success(`Parsed ${data.students?.length || 0} student results`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to parse PDF');
      setStudents([]); setAnalysis(null);
    } finally { setUploading(false); }
  }, [file]);

  const saveBatch = useCallback(async () => {
    if (!batchTitle.trim()) { toast.warn('Enter a title for this result batch'); return; }
    if (students.length === 0) { toast.warn('No data to save'); return; }
    setSaving(true);
    try {
      await api.post('/result-upload/save', {
        title: batchTitle, department: batchDept, semester: batchSemester,
        subject: batchSubject, students, analysis,
        fileName: file?.name, pdfPages: pdfInfo?.pages,
        notifyStudents,
      });
      toast.success('Result batch saved' + (notifyStudents ? ' and students notified!' : '!'));
      setShowSaveForm(false);
      setBatchTitle(''); setBatchDept(''); setBatchSemester(''); setBatchSubject('');
      setNotifyStudents(false);
      loadBatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  // eslint-disable-next-line
  }, [batchTitle, batchDept, batchSemester, batchSubject, students, analysis, file, pdfInfo, loadBatches]);

  const loadBatchDetail = useCallback(async (id) => {
    try {
      const { data } = await api.get(`/result-upload/batches/${id}`);
      setStudents(data.students || []);
      setAnalysis(data.analysis || null);
      setPdfInfo({ pages: data.pdfPages, extractedStudents: data.students?.length });
      setViewBatch(data);
      setFile(null);
      setShowHistory(false);
      setStatusFilter('all'); setGradeFilter('all'); setSearch('');
    } catch {
      toast.error('Failed to load batch');
    }
  }, []);

  const deleteBatch = useCallback(async (id) => {
    if (!confirm('Delete this result batch?')) return;
    try {
      await api.delete(`/result-upload/batches/${id}`);
      toast.success('Batch deleted');
      loadBatches();
      if (viewBatch?._id === id) { setViewBatch(null); setStudents([]); setAnalysis(null); }
    } catch {
      toast.error('Failed to delete');
    }
  }, [loadBatches, viewBatch]);

  const downloadExcel = useCallback(async (filterType = 'all') => {
    if (students.length === 0) { toast.warn('No data to download'); return; }
    setDownloading(true);
    try {
      const response = await api.post('/result-upload/download-excel', { students, filterType }, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filterType === 'arrear' ? 'arrear_students.xlsx' : 'result_analysis.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Excel downloaded (${filterType === 'arrear' ? 'arrear only' : filterType === 'pass' ? 'pass only' : 'all'})!`);
    } catch { toast.error('Download failed'); }
    finally { setDownloading(false); }
  }, [students]);

  const reset = () => {
    setFile(null); setStudents([]); setAnalysis(null); setPdfInfo(null);
    setSearch(''); setStatusFilter('all'); setGradeFilter('all'); setViewBatch(null);
    setNotifyStudents(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const filtered = students.filter((s) => {
    if (statusFilter === 'arrear' && s.status !== 'Fail') return false;
    if (statusFilter === 'pass' && s.status !== 'Pass') return false;
    if (gradeFilter !== 'all' && s.grade !== gradeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name?.toLowerCase().includes(q) || s.rollNumber?.toLowerCase().includes(q);
    }
    return true;
  });

  const uniqueGrades = [...new Set(students.map((s) => s.grade).filter(Boolean))].sort();

  const gradeEntries = analysis?.gradeDistribution
    ? Object.entries(analysis.gradeDistribution).sort(([a], [b]) => a.localeCompare(b))
    : [];

  const arrearCount = students.filter((s) => s.status === 'Fail').length;
  const passCount = students.filter((s) => s.status === 'Pass').length;

  // Extract detected subject codes for table headers
  const subjectCodes = Array.from(new Set(students.flatMap(s => s.subjects?.map(sub => sub.code) || []))).sort();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Result PDF Upload & Analysis
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Upload result PDF, analyze performance, filter by arrear, and download as Excel with CGPA
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <FiClock className="h-4 w-4" />
            {showHistory ? 'Hide' : 'Upload'} History
          </button>
          {students.length > 0 && (
            <>
              <button type="button" onClick={() => setShowSaveForm(!showSaveForm)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
                <FiSave className="h-4 w-4" />
                Save Result
              </button>
              <button type="button" onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                <FiRefreshCw className="h-4 w-4" />
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {showSaveForm && students.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Save This Result Batch</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input value={batchTitle} onChange={(e) => setBatchTitle(e.target.value)} placeholder="Title *" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15" />
            <input value={batchDept} onChange={(e) => setBatchDept(e.target.value)} placeholder="Department" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15" />
            <input value={batchSemester} onChange={(e) => setBatchSemester(e.target.value)} placeholder="Semester" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15" />
            <input value={batchSubject} onChange={(e) => setBatchSubject(e.target.value)} placeholder="Subject" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15" />
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`flex h-5 w-5 items-center justify-center rounded border transition ${notifyStudents ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
                {notifyStudents && <FiCheckCircle className="h-3.5 w-3.5 text-white" />}
                <input type="checkbox" checked={notifyStudents} onChange={(e) => setNotifyStudents(e.target.checked)} className="sr-only" />
              </div>
              <span className="text-sm font-medium text-slate-700">Notify students via dashboard</span>
            </label>
            <button type="button" onClick={saveBatch} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50">
              {saving ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Batch'}
            </button>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Upload History</h2>
          {batchesLoading ? (
            <div className="flex justify-center py-8"><FiRefreshCw className="h-6 w-6 animate-spin text-indigo-500" /></div>
          ) : batches.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No saved result batches yet.</p>
          ) : (
            <div className="space-y-3">
              {batches.map((b) => (
                <div key={b._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-indigo-200">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 truncate">{b.title}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      {b.department && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700">{b.department}</span>}
                      {b.semester && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">Sem {b.semester}</span>}
                      {b.subject && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">{b.subject}</span>}
                      <span>{b.analysis?.totalStudents || 0} students</span>
                      <span>Pass: {b.analysis?.passPercentage ?? 0}%</span>
                      <span>Fail: {b.analysis?.failCount ?? 0}</span>
                      <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                      {b.uploadedBy?.name && <span>by {b.uploadedBy.name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => loadBatchDetail(b._id)} className="rounded-lg bg-indigo-600 p-2 text-white transition hover:bg-indigo-700" title="View">
                      <FiEye className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                      <button type="button" onClick={() => deleteBatch(b._id)} className="rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-700" title="Delete">
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {students.length === 0 && !showHistory && (
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
          className="rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-blue-50/40 p-8 text-center transition hover:border-indigo-400">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
            <FiUploadCloud className="h-10 w-10 text-indigo-600" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Upload Result PDF</h2>
          <p className="mt-2 text-sm text-slate-600">Drag & drop your result PDF here, or click to browse</p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
              <FiFileText className="h-4 w-4" />
              Choose PDF
              <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" />
            </label>
            <button type="button" onClick={uploadPDF} disabled={!file || uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
              {uploading ? <><FiRefreshCw className="h-4 w-4 animate-spin" />Analyzing...</> : <><FiBarChart2 className="h-4 w-4" />Upload & Analyze</>}
            </button>
          </div>
          {file && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
              <FiFileText className="h-4 w-4 text-indigo-500" />
              {file.name}
              <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>
      )}

      {viewBatch && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 flex items-center gap-3">
          <FiEye className="h-4 w-4 text-indigo-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-indigo-900">Viewing: {viewBatch.title}</span>
            {viewBatch.department && <span className="text-xs text-indigo-600 ml-2">{viewBatch.department}</span>}
            {viewBatch.uploadedBy?.name && <span className="text-xs text-indigo-500 ml-2">by {viewBatch.uploadedBy.name}</span>}
          </div>
        </div>
      )}

      {analysis && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatBox icon={FiUsers} label="Total Students" value={analysis.totalStudents} color="indigo" />
            <StatBox icon={FiTrendingUp} label="Average Marks" value={analysis.average} color="blue" />
            <StatBox icon={FiAward} label="Highest Marks" value={analysis.highest} color="purple" />
            <StatBox icon={FiCheckCircle} label="Pass Count" value={analysis.passCount} color="green" />
            <StatBox icon={FiXCircle} label="Fail / Arrear" value={analysis.failCount} color="red" />
            <StatBox icon={FiPercent} label="Pass %" value={`${analysis.passPercentage}%`} color="amber" />
          </section>

          {gradeEntries.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Grade Distribution</h2>
              <div className="flex flex-wrap items-end gap-4 overflow-x-auto pb-2">
                {gradeEntries.length > 0 && gradeEntries.map(([grade, count]) => {
                  const max = Math.max(...gradeEntries.map(([, c]) => c), 1);
                  const h = Math.round((count / max) * 120);
                  const gc = { O: 'bg-emerald-500', 'A+': 'bg-teal-500', A: 'bg-blue-500', 'B+': 'bg-indigo-500', B: 'bg-violet-500', C: 'bg-amber-500', D: 'bg-orange-500', F: 'bg-red-500', U: 'bg-red-600', UA: 'bg-slate-500' };
                  return (
                    <div key={grade} className="flex flex-col items-center gap-2 grow min-w-[3rem]">
                      <span className="text-xs font-semibold text-slate-600">{count}</span>
                      <div className={`w-full rounded-t-lg ${gc[grade] || 'bg-slate-400'} transition-all`} style={{ height: `${Math.max(h, 8)}px` }} title={`${grade}: ${count}`} />
                      <span className="text-sm font-bold text-slate-800">{grade}</span>
                    </div>
                  );
                })}
              </div>

              {analysis.subjectStats?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Subject-wise Pass Rates</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {analysis.subjectStats.map((stat) => (
                      <div key={stat.code} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900">{stat.code}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stat.passPercentage >= 90 ? 'bg-emerald-100 text-emerald-800' : stat.passPercentage >= 60 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                            {stat.passPercentage}% Pass
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${stat.passPercentage >= 90 ? 'bg-emerald-500' : stat.passPercentage >= 60 ? 'bg-blue-500' : 'bg-rose-500'}`} style={{ width: `${stat.passPercentage}%` }} />
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-tighter">
                          <span>Pass: {stat.passCount || 0}</span>
                          <span>Fail: {stat.failCount || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {pdfInfo && (
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <FiFileText className="h-3.5 w-3.5" />{pdfInfo.pages} page{pdfInfo.pages !== 1 ? 's' : ''} parsed
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <FiUsers className="h-3.5 w-3.5" />{pdfInfo.extractedStudents} students extracted
              </span>
            </div>
          )}
        </>
      )}

      {students.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Student Results
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({filtered.length} of {students.length}
                {statusFilter === 'arrear' ? ' — Arrear/Fail only' : statusFilter === 'pass' ? ' — Pass only' : ''})
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <FiFilter className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filters:</span>
            </div>

            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20">
                <option value="all">All Students</option>
                <option value="arrear">Arrear / Fail ({arrearCount})</option>
                <option value="pass">Pass ({passCount})</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20">
                <option value="all">All Grades</option>
                {uniqueGrades.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or roll..."
              className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />

            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => downloadExcel('all')} disabled={downloading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                <FiDownload className="h-3.5 w-3.5" />All Excel
              </button>
              <button type="button" onClick={() => downloadExcel('arrear')} disabled={downloading || arrearCount === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                <FiDownload className="h-3.5 w-3.5" />Arrear Excel ({arrearCount})
              </button>
              <button type="button" onClick={() => downloadExcel('pass')} disabled={downloading || passCount === 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                <FiDownload className="h-3.5 w-3.5" />Pass Excel ({passCount})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">S.No</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Roll Number</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Student Name</th>
                  {subjectCodes.length > 0 ? (
                    subjectCodes.map(code => (
                      <th key={code} className="px-4 py-3 font-semibold text-slate-700 uppercase">{code}</th>
                    ))
                  ) : (
                    <>
                      <th className="px-4 py-3 font-semibold text-slate-700">Marks</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Grade</th>
                    </>
                  )}
                  <th className="px-4 py-3 font-semibold text-slate-700">CGPA</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, i) => (
                  <tr key={s.rollNumber || i} className={`transition hover:bg-slate-50 ${s.status === 'Fail' ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3 tabular-nums text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{s.rollNumber || '—'}</td>
                    <td className="px-4 py-3 text-slate-800">{s.name || '—'}</td>
                    {subjectCodes.length > 0 ? (
                      subjectCodes.map(code => {
                        const sub = s.subjects?.find(sub => sub.code === code);
                        return (
                          <td key={code} className="px-4 py-3">
                            <span className={`font-bold ${sub?.status === 'Fail' ? 'text-rose-600' : 'text-slate-700'}`}>
                              {sub?.grade || '—'}
                            </span>
                          </td>
                        );
                      })
                    ) : (
                      <>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{s.marks != null ? s.marks : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            s.grade === 'O' || s.grade === 'A+' || s.grade === 'A' ? 'bg-emerald-100 text-emerald-800'
                            : s.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                          }`}>{s.grade || '—'}</span>
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 tabular-nums font-semibold text-indigo-700">{s.cgpa != null ? s.cgpa.toFixed(1) : '—'}</td>
                    <td className="px-4 py-3">
                      {s.status === 'Pass' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800"><FiCheckCircle className="h-3 w-3" />Pass</span>
                      ) : s.status === 'Fail' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800"><FiXCircle className="h-3 w-3" />Arrear</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600"><FiAlertTriangle className="h-3 w-3" />N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">No students match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
