import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiDollarSign,
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

function BarRow({ label, value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((Number(value) / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-28 shrink-0 truncate font-medium text-slate-700" title={label}>
        {label}
      </div>
      <div className="flex-1">
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="w-16 shrink-0 text-right tabular-nums text-slate-600">{value}</div>
    </div>
  );
}

function ReportCard({ title, subtitle, icon, loading, error, children }) {
  const ReportIcon = icon;
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="rounded-xl bg-indigo-100 p-2 text-indigo-700">
          <ReportIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <LoadingSpinner label="Loading…" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        children
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

    const [en, att, res, fee, plc] = await Promise.all([
      safe('enrollment', async () => {
        const { data } = await api.get('/reports/enrollment');
        return data;
      }),
      safe('attendance', async () => {
        const { data } = await api.get('/reports/attendance');
        return data;
      }),
      safe('results', async () => {
        const { data } = await api.get('/reports/results');
        return data;
      }),
      safe('fees', async () => {
        const { data } = await api.get('/fees/report');
        return data;
      }),
      safe('placements', async () => {
        const { data } = await api.get('/reports/placements');
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
      toast.error('Could not load reports. Check API routes.');
    } else if (failed > 0) {
      toast.warn('Some report sections failed to load.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadAll]);

  const enrollmentBars = useMemo(() => {
    const raw =
      enrollment?.byDepartment ??
      enrollment?.departments ??
      enrollment?.breakdown ??
      enrollment;
    if (!raw || typeof raw !== 'object') return [];
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
    const dept = attendance?.byDepartment ?? attendance?.departmentWise;
    const course = attendance?.byCourse ?? attendance?.courseWise;
    const pick = dept || course;
    if (!pick || typeof pick !== 'object') return { rows: [], max: 1 };
    const rows = Array.isArray(pick)
      ? pick.map((r) => ({
          label: r.name ?? r.course ?? (deptName(r) || '—'),
          value: Number(r.percentage ?? r.percent ?? r.avg ?? 0),
        }))
      : Object.entries(pick).map(([k, v]) => ({
          label: k,
          value: typeof v === 'number' ? v : Number(v?.percentage ?? v ?? 0),
        }));
    const max = Math.max(1, ...rows.map((r) => r.value));
    return { rows, max };
  }, [attendance]);

  const resultSummary = useMemo(() => {
    const r = results ?? {};
    return {
      pass: r.passPercentage ?? r.passPercent ?? r.pass_pct,
      grades: r.gradeDistribution ?? r.grades ?? r.distribution,
    };
  }, [results]);

  const feeSummary = useMemo(() => {
    const f = fees ?? {};
    return {
      collected: f.totalCollected ?? f.collected,
      due: f.totalDue ?? f.due,
      pending: f.pending,
    };
  }, [fees]);

  const placementSummary = useMemo(() => {
    const p = placements ?? {};
    const drives = Array.isArray(p.drives) ? p.drives : p;
    if (Array.isArray(drives)) {
      return {
        totalDrives: drives.length,
        offers: drives.reduce((a, d) => a + Number(d.offers ?? d.selected ?? 0), 0),
      };
    }
    return {
      totalDrives: p.totalDrives ?? p.count,
      offers: p.offers ?? p.totalOffers,
    };
  }, [placements]);

  const gradeRows = useMemo(() => {
    const g = resultSummary.grades;
    if (!g || typeof g !== 'object') return { rows: [], max: 1 };
    const rows = Array.isArray(g)
      ? g.map((x) => ({
          label: String(x.grade ?? x.label),
          value: Number(x.count ?? x.value ?? 0),
        }))
      : Object.entries(g).map(([k, v]) => ({ label: k, value: Number(v) }));
    const max = Math.max(1, ...rows.map((r) => r.value));
    return { rows, max };
  }, [resultSummary.grades]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-slate-600">
            Consolidated analytics for enrollment, attendance, academics, finance, and placements
            {user?.name ? ` · ${user.name}` : ''}.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh all
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          title="Student enrollment"
          subtitle="By department / semester · GET /api/reports/enrollment"
          icon={FiUsers}
          loading={loading}
          error={errors.enrollment}
        >
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">By department</p>
              <div className="space-y-2">
                {enrollmentBars.rows.length ? (
                  enrollmentBars.rows.map((r) => (
                    <BarRow key={r.label} label={r.label} value={r.value} max={enrollmentBars.max} />
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No enrollment breakdown in response.</p>
                )}
              </div>
            </div>
            {enrollment?.semesters ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-800">By semester</p>
                <div className="space-y-2">
                  {Object.entries(enrollment.semesters).map(([k, v]) => (
                    <BarRow
                      key={k}
                      label={`Sem ${k}`}
                      value={typeof v === 'number' ? v : Number(v?.count ?? v ?? 0)}
                      max={Math.max(
                        1,
                        ...Object.values(enrollment.semesters).map((x) =>
                          typeof x === 'number' ? x : Number(x?.count ?? x ?? 0)
                        )
                      )}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </ReportCard>

        <ReportCard
          title="Attendance"
          subtitle="Department / course-wise · GET /api/reports/attendance"
          icon={FiBookOpen}
          loading={loading}
          error={errors.attendance}
        >
          <div className="space-y-2">
            {attendanceBars.rows.length ? (
              attendanceBars.rows.map((r) => (
                <BarRow key={r.label} label={r.label} value={r.value} max={attendanceBars.max} />
              ))
            ) : (
              <p className="text-sm text-slate-500">No attendance aggregates in response.</p>
            )}
          </div>
        </ReportCard>

        <ReportCard
          title="Result analysis"
          subtitle="Pass % & grade distribution · GET /api/reports/results"
          icon={FiBarChart2}
          loading={loading}
          error={errors.results}
        >
          <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pass rate</p>
            <p className="mt-1 text-3xl font-bold text-indigo-700 tabular-nums">
              {resultSummary.pass != null ? `${Number(resultSummary.pass).toFixed(1)}%` : '—'}
            </p>
          </div>
          <p className="mb-2 text-sm font-semibold text-slate-800">Grade distribution</p>
          <div className="space-y-2">
            {gradeRows.rows.length ? (
              gradeRows.rows.map((r) => (
                <BarRow key={r.label} label={r.label} value={r.value} max={gradeRows.max} />
              ))
            ) : (
              <p className="text-sm text-slate-500">No grade distribution in response.</p>
            )}
          </div>
        </ReportCard>

        <ReportCard
          title="Fee collection"
          subtitle="Summary · GET /api/fees/report"
          icon={FiDollarSign}
          loading={loading}
          error={errors.fees}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Collected</p>
              <p className="mt-1 text-xl font-bold text-emerald-700 tabular-nums">
                {feeSummary.collected != null ? `₹${Number(feeSummary.collected).toLocaleString()}` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Due</p>
              <p className="mt-1 text-xl font-bold text-indigo-700 tabular-nums">
                {feeSummary.due != null ? `₹${Number(feeSummary.due).toLocaleString()}` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Pending</p>
              <p className="mt-1 text-xl font-bold text-amber-700 tabular-nums">
                {feeSummary.pending != null ? `₹${Number(feeSummary.pending).toLocaleString()}` : '—'}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {feeSummary.due != null && feeSummary.collected != null ? (
              <BarRow
                label="Collected vs due"
                value={Number(feeSummary.collected)}
                max={Math.max(Number(feeSummary.due), Number(feeSummary.collected), 1)}
              />
            ) : (
              <p className="text-sm text-slate-500">Awaiting numeric totals from API.</p>
            )}
          </div>
        </ReportCard>

        <ReportCard
          title="Placement report"
          subtitle="GET /api/reports/placements"
          icon={FiBriefcase}
          loading={loading}
          error={errors.placements}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Total drives</p>
              <p className="mt-1 text-2xl font-bold text-indigo-700 tabular-nums">
                {placementSummary.totalDrives ?? '—'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Offers / selections</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
                {placementSummary.offers ?? '—'}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {Array.isArray(placements?.byCompany) ? (
              placements.byCompany.map((c) => (
                <BarRow
                  key={c.company ?? c.name}
                  label={c.company ?? c.name}
                  value={Number(c.offers ?? c.count ?? 0)}
                  max={Math.max(
                    1,
                    ...placements.byCompany.map((x) => Number(x.offers ?? x.count ?? 0))
                  )}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">Company-wise breakdown optional in API response.</p>
            )}
          </div>
        </ReportCard>
      </div>
    </div>
  );
}
