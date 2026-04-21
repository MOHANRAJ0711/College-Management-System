import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiDollarSign,
  FiFilter,
  FiRefreshCw,
  FiUsers,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function errMsg(e) {
  return e.response?.data?.message || e.message || 'Request failed';
}

function BarRow({ label, value, max, unit = '' }) {
  const numValue = Number(value);
  const displayValue = unit === '%' ? numValue.toFixed(1) : numValue;
  const pct = max > 0 ? Math.min(100, Math.round((numValue / max) * 100)) : 0;
  
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-28 shrink-0 truncate font-medium text-slate-700" title={label}>
        {label}
      </div>
      <div className="flex-1">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="w-16 shrink-0 text-right tabular-nums text-slate-600">
        {displayValue}{unit}
      </div>
    </div>
  );
}

function ReportCard({ title, icon, loading, error, children }) {
  const ReportIcon = icon;
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
          <ReportIcon className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <LoadingSpinner label="Loading data..." />
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center py-10 text-center">
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      ) : (
        <div className="flex-1">{children}</div>
      )}
    </div>
  );
}

function deptName(row) {
  const d = row?.department ?? row?.departmentName;
  if (!d) return '';
  if (typeof d === 'string') return d;
  return d.name ?? d.title ?? '';
}

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [results, setResults] = useState(null);
  const [fees, setFees] = useState(null);
  const [placements, setPlacements] = useState(null);
  const [errors, setErrors] = useState({});
  
  // Filters
  const [depts, setDepts] = useState([]);
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');

  const loadDepts = useCallback(async () => {
    try {
      const { data } = await api.get('/departments');
      setDepts(Array.isArray(data) ? data : data.items || []);
    } catch {
      setDepts([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const nextErrors = {};

    const safe = async (key, fn) => {
      try {
        return await fn();
      } catch (e) {
        nextErrors[key] = errMsg(e);
        return null;
      }
    };

    const params = {
      department: filterDept || undefined,
      semester: filterSem || undefined
    };

    const [en, att, res, fee, plc] = await Promise.all([
      safe('enrollment', async () => {
        const { data } = await api.get('/reports/enrollment', { params });
        return data;
      }),
      safe('attendance', async () => {
        const { data } = await api.get('/reports/attendance', { params });
        return data;
      }),
      safe('results', async () => {
        const { data } = await api.get('/reports/results', { params });
        return data;
      }),
      safe('fees', async () => {
        const { data } = await api.get('/fees/report', { params });
        return data;
      }),
      safe('placements', async () => {
        const { data } = await api.get('/reports/placements', { params });
        return data;
      }),
    ]);

    setEnrollment(en);
    setAttendance(att);
    setResults(res);
    setFees(fee);
    setPlacements(plc);
    setErrors(nextErrors);

    const failed = Object.keys(nextErrors).length;
    if (failed === 5) {
      toast.error('Could not load reports. Check API connectivity.');
    } else if (failed > 0) {
      toast.warn('Some report sections could not be loaded.');
    }
    setLoading(false);
  }, [filterDept, filterSem]);

  useEffect(() => {
    loadDepts();
  }, [loadDepts]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const enrollmentBars = useMemo(() => {
    const raw = enrollment?.byDepartment ?? enrollment;
    if (!raw || typeof raw !== 'object') return { rows: [], max: 1 };
    const rows = Array.isArray(raw)
      ? raw.map((r) => ({
          label: deptName(r) || r.name || r.dept || '—',
          value: Number(r.count ?? r.total ?? r.students ?? 0),
        }))
      : Object.entries(raw).map(([k, v]) => ({
          label: k,
          value: typeof v === 'number' ? v : Number(v?.count ?? v ?? 0),
        }));
    const max = Math.max(1, ...rows.map((r) => r.value));
    return { rows, max };
  }, [enrollment]);

  const attendanceBars = useMemo(() => {
    const pick = attendance?.byDepartment ?? attendance?.departmentWise;
    if (!pick || typeof pick !== 'object') return { rows: [], max: 1 };
    const rows = Array.isArray(pick)
      ? pick.map((r) => ({
          label: r.department?.name ?? r.name ?? r.course ?? (deptName(r) || '—'),
          value: Number(r.percentage ?? r.percent ?? r.avg ?? 0),
        }))
      : Object.entries(pick).map(([k, v]) => ({
          label: k,
          value: typeof v === 'number' ? v : Number(v?.percentage ?? v ?? 0),
        }));
    const max = 100; // Attendance is always out of 100%
    return { rows, max };
  }, [attendance]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Analytics</h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time insights across academic and administrative modules.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <FiFilter className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-lg border-none bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Departments</option>
          {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>

        <select
          value={filterSem}
          onChange={(e) => setFilterSem(e.target.value)}
          className="rounded-lg border-none bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>

        {(filterDept || filterSem) && (
          <button
            onClick={() => { setFilterDept(''); setFilterSem(''); }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportCard
          title="Student Enrollment"
          icon={FiUsers}
          loading={loading}
          error={errors.enrollment}
        >
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">By Department</p>
              <div className="space-y-3">
                {enrollmentBars.rows.length ? (
                  enrollmentBars.rows.map((r) => (
                    <BarRow key={r.label} label={r.label} value={r.value} max={enrollmentBars.max} />
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No enrollment records found.</p>
                )}
              </div>
            </div>
            {enrollment?.semesters && !filterSem && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">By Semester</p>
                <div className="space-y-3">
                  {Object.entries(enrollment.semesters).map(([k, v]) => (
                    <BarRow
                      key={k}
                      label={`Semester ${k}`}
                      value={typeof v === 'number' ? v : Number(v?.count ?? v ?? 0)}
                      max={Math.max(1, ...Object.values(enrollment.semesters).map((x) => typeof x === 'number' ? x : Number(x?.count ?? x ?? 0)))}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ReportCard>

        <ReportCard
          title="Attendance Overview"
          icon={FiBookOpen}
          loading={loading}
          error={errors.attendance}
        >
          <div className="space-y-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Average Percentage</p>
            {attendanceBars.rows.length ? (
              attendanceBars.rows.map((r) => (
                <BarRow key={r.label} label={r.label} value={r.value} max={100} unit="%" />
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">No attendance data available.</p>
            )}
          </div>
        </ReportCard>

        <ReportCard
          title="Result Analysis"
          icon={FiBarChart2}
          loading={loading}
          error={errors.results}
        >
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-100">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Pass Rate</p>
              <p className="mt-1 text-3xl font-bold text-indigo-700 tabular-nums">
                {results?.passPercentage != null ? `${results.passPercentage.toFixed(1)}%` : '—'}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full border-4 border-indigo-100 border-t-indigo-600`} style={{ transform: `rotate(${(results?.passPercentage || 0) * 3.6}deg)` }} />
          </div>
          
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Grade Distribution</p>
          <div className="space-y-3">
            {results?.gradeDistribution && Object.keys(results.gradeDistribution).length ? (
              Object.entries(results.gradeDistribution)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([grade, count]) => {
                  const max = Math.max(1, ...Object.values(results.gradeDistribution));
                  return <BarRow key={grade} label={grade} value={count} max={max} />;
                })
            ) : (
              <p className="text-sm text-slate-400">No grades recorded yet.</p>
            )}
          </div>
        </ReportCard>

        <ReportCard
          title="Fee Collection"
          icon={FiDollarSign}
          loading={loading}
          error={errors.fees}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Collected', value: fees?.collected, color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Total Due', value: fees?.due, color: 'text-indigo-700', bg: 'bg-indigo-50' },
              { label: 'Pending', value: fees?.pending, color: 'text-rose-700', bg: 'bg-rose-50' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl px-4 py-3 ${s.bg}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
                <p className={`mt-1 text-lg font-bold tabular-nums ${s.color}`}>
                  {s.value != null ? `₹${Number(s.value).toLocaleString()}` : '—'}
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Collection Progress</p>
            {fees?.due ? (
              <BarRow
                label="Overall Progress"
                value={fees.collected}
                max={fees.due}
              />
            ) : (
              <p className="text-sm text-slate-400">Awaiting data...</p>
            )}
          </div>
        </ReportCard>

        <ReportCard
          title="Placement Overview"
          icon={FiBriefcase}
          loading={loading}
          error={errors.placements}
        >
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Drives</p>
              <p className="mt-1 text-3xl font-bold text-indigo-700 tabular-nums">{placements?.totalDrives ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Offers Issued</p>
              <p className="mt-1 text-3xl font-bold text-emerald-700 tabular-nums">{placements?.offers ?? 0}</p>
            </div>
          </div>
          
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Top Companies</p>
          <div className="space-y-3">
            {Array.isArray(placements?.byCompany) && placements.byCompany.length ? (
              placements.byCompany.map((c) => (
                <BarRow
                  key={c.company}
                  label={c.company}
                  value={c.offers}
                  max={Math.max(1, ...placements.byCompany.map(x => x.offers))}
                />
              ))
            ) : (
              <p className="text-sm text-slate-400">No company data recorded.</p>
            )}
          </div>
        </ReportCard>
      </div>
    </div>
  );
}
