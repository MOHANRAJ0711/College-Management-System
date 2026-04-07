import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiActivity,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiDollarSign,
  FiFileText,
  FiLayers,
  FiPlusCircle,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function toastApiError(err, fallback = 'Failed to load dashboard') {
  const msg = err.response?.data?.message ?? err.message;
  toast.error(typeof msg === 'string' && msg.trim() ? msg : fallback);
}

function normalizePayload(raw) {
  const p = raw?.data ?? raw;
  const counts = p?.counts ?? p?.stats ?? p;
  const feeCol = p?.feeCollection ?? p?.feeCol ?? {};
  const summary = feeCol?.summary ?? {};
  return {
    totalStudents: Number(counts?.students ?? counts?.totalStudents ?? 0),
    totalFaculty: Number(counts?.faculty ?? counts?.totalFaculty ?? 0),
    totalDepartments: Number(counts?.departments ?? counts?.totalDepartments ?? 0),
    totalCourses: Number(counts?.courses ?? counts?.totalCourses ?? 0),
    pendingAdmissions: Number(p?.pendingAdmissions ?? counts?.pendingAdmissions ?? 0),
    feeCollection: Number(summary?.collectedAmount ?? p?.feeCollection?.collectedAmount ?? 0),
    admissionTrends: Array.isArray(p?.admissionTrends) ? p.admissionTrends : [],
    feeOverview: (() => {
      if (Array.isArray(p?.feeOverview)) return p.feeOverview;
      if (feeCol?.byStatus && typeof feeCol.byStatus === 'object') {
        return Object.entries(feeCol.byStatus).map(([label, v]) => ({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          amount: v?.totalAmount ?? 0,
        }));
      }
      return [
        { label: 'Collected', amount: summary?.collectedAmount ?? 0 },
        { label: 'Pending', amount: summary?.outstandingPending ?? 0 },
        { label: 'Overdue', amount: summary?.outstandingOverdue ?? 0 },
      ];
    })(),
    departmentDistribution: Array.isArray(p?.departmentDistribution)
      ? p.departmentDistribution
      : [],
    recentActivities: Array.isArray(p?.recentActivities)
      ? p.recentActivities
      : Array.isArray(p?.recentNotifications)
        ? p.recentNotifications.map((n) => ({
            title: n.title,
            message: n.message,
            time: n.createdAt,
          }))
        : [],
  };
}

function BarGroup({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function MonthlyAdmissionBars({ points }) {
  const list = points.length
    ? points
    : Array.from({ length: 6 }).map((_, i) => ({
        month: `M${i + 1}`,
        count: 0,
      }));
  const max = Math.max(1, ...list.map((x) => Number(x.count ?? x.value ?? 0)));
  return (
    <div className="flex h-48 items-end gap-2 sm:gap-3">
      {list.map((pt, i) => {
        const v = Number(pt.count ?? pt.value ?? 0);
        const h = Math.round((v / max) * 100);
        const label = pt.month ?? pt.label ?? pt.name ?? `M${i + 1}`;
        return (
          <div key={`${label}-${i}`} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end justify-center rounded-lg bg-slate-50 px-1">
              <div
                className="w-full max-w-[2.5rem] rounded-t-md bg-gradient-to-t from-indigo-600 to-blue-500 shadow-inner transition hover:opacity-90"
                style={{ height: `${Math.max(h, 4)}%` }}
                title={`${label}: ${v}`}
              />
            </div>
            <span className="max-w-full truncate text-center text-[11px] font-medium text-slate-600 sm:text-xs">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FeeBars({ points }) {
  const list = points.length
    ? points
    : [
        { label: 'Collected', amount: 0 },
        { label: 'Pending', amount: 0 },
        { label: 'Overdue', amount: 0 },
      ];
  const max = Math.max(1, ...list.map((x) => Number(x.amount ?? x.value ?? 0)));
  return (
    <div className="space-y-3">
      {list.map((pt, i) => {
        const v = Number(pt.amount ?? pt.value ?? 0);
        const pct = Math.round((v / max) * 100);
        const label = pt.label ?? pt.name ?? '—';
        return (
          <div key={`${label}-${i}`}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{label}</span>
              <span className="tabular-nums text-slate-500">{v.toLocaleString()}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DeptDistributionBars({ points }) {
  const list = points.length
    ? points
    : [{ name: '—', students: 0 }];
  const max = Math.max(1, ...list.map((x) => Number(x.students ?? x.count ?? x.value ?? 0)));
  return (
    <div className="space-y-3">
      {list.map((pt, i) => {
        const v = Number(pt.students ?? pt.count ?? pt.value ?? 0);
        const pct = Math.round((v / max) * 100);
        const name = pt.name ?? pt.department ?? pt.label ?? 'Department';
        return (
          <div key={`${name}-${i}`}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="max-w-[70%] truncate font-medium text-slate-700">{name}</span>
              <span className="tabular-nums text-slate-500">{v}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
                style={{ width: `${Math.max(pct, 3)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100"
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get('/dashboard/admin');
        if (!alive) return;
        setPayload(normalizePayload(data));
      } catch (err) {
        toastApiError(err);
        if (!alive) return;
        setPayload(normalizePayload({}));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const model = useMemo(() => payload ?? normalizePayload({}), [payload]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Control center for academics, admissions, and operations
            {user?.name ? (
              <span className="text-slate-500"> · Signed in as {user.name}</span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
            <FiActivity className="h-3.5 w-3.5" />
            Live overview
          </span>
        </div>
      </header>

      {loading ? (
        <StatsSkeleton />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatsCard
            title="Total students"
            value={model.totalStudents}
            icon={FiUsers}
            color="indigo"
            animate
          />
          <StatsCard
            title="Total faculty"
            value={model.totalFaculty}
            icon={FiBookOpen}
            color="blue"
            animate
          />
          <StatsCard
            title="Departments"
            value={model.totalDepartments}
            icon={FiLayers}
            color="purple"
            animate
          />
          <StatsCard
            title="Courses"
            value={model.totalCourses}
            icon={FiBarChart2}
            color="green"
            animate
          />
          <StatsCard
            title="Pending admissions"
            value={model.pendingAdmissions}
            icon={FiFileText}
            color="yellow"
            animate
          />
          <StatsCard
            title="Fee collection"
            value={model.feeCollection}
            icon={FiDollarSign}
            color="green"
            animate
          />
        </section>
      )}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <LoadingSpinner label="Loading charts…" />
        </div>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <div className="lg:col-span-2 xl:col-span-2">
            <BarGroup title="Admission trends" subtitle="Monthly intake (last periods)">
              <MonthlyAdmissionBars points={model.admissionTrends} />
            </BarGroup>
          </div>
          <BarGroup title="Fee collection overview" subtitle="Relative distribution">
            <FeeBars points={model.feeOverview} />
          </BarGroup>
          <div className="lg:col-span-2 xl:col-span-3">
            <BarGroup
              title="Department-wise students"
              subtitle="Share of enrolled students by department"
            >
              <DeptDistributionBars points={model.departmentDistribution} />
            </BarGroup>
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Recent activities</h2>
            <FiTrendingUp className="h-5 w-5 text-indigo-500" aria-hidden />
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : model.recentActivities.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No recent activity yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {model.recentActivities.map((act, idx) => (
                <li key={act.id ?? idx} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <FiActivity className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {act.title ?? act.message ?? act.description ?? 'Activity'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {act.time ?? act.at ?? act.createdAt ?? ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-blue-700 p-5 text-white shadow-lg">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <p className="mt-1 text-sm text-indigo-100">
            Jump to common administrative tasks.
          </p>
          <div className="mt-5 grid gap-2">
            <Link
              to="/admin/students"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
            >
              <FiPlusCircle className="h-4 w-4" />
              Add student
            </Link>
            <Link
              to="/admin/faculty"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
            >
              <FiUsers className="h-4 w-4" />
              Add faculty
            </Link>
            <Link
              to="/admin/notifications"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
            >
              <FiBell className="h-4 w-4" />
              Create notice
            </Link>
            <Link
              to="/admin/reports"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-50"
            >
              <FiBarChart2 className="h-4 w-4" />
              View reports
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
