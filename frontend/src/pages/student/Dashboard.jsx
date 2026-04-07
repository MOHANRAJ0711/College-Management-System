import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAward,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatsCard from '../../components/common/StatsCard';
import { apiError, formatCurrency, formatDate, formatDateTime } from './utils';

function normalizePayload(raw) {
  const d = raw?.data ?? raw;
  if (!d || typeof d !== 'object') return null;
  const stats = d.stats ?? d;
  const attendanceOverview = Array.isArray(d.attendanceOverview)
    ? d.attendanceOverview
    : Array.isArray(d.attendanceByCourse)
      ? d.attendanceByCourse
      : [];
  return {
    stats: {
      attendancePercent: Number(
        stats.attendancePercent ?? stats.attendance_percentage ?? stats.attendance ?? 0
      ),
      cgpa: Number(stats.cgpa ?? stats.currentCgpa ?? 0),
      pendingFees: Number(stats.pendingFees ?? stats.pending_fees ?? 0),
      activeCourses: Number(stats.activeCourses ?? stats.active_courses ?? 0),
    },
    notifications: Array.isArray(d.notifications) ? d.notifications.slice(0, 5) : [],
    upcomingExams: Array.isArray(d.upcomingExams) ? d.upcomingExams : [],
    attendanceOverview: attendanceOverview.map((row, i) => ({
      label:
        row.label ??
        row.courseName ??
        row.name ??
        row.course ??
        `Course ${i + 1}`,
      percent: Number(row.percent ?? row.percentage ?? row.value ?? row.attendance ?? 0),
    })),
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data: res } = await api.get('/students/dashboard');
        if (!cancelled) setData(normalizePayload(res));
      } catch (e) {
        if (!cancelled) {
          setError(apiError(e));
          toast.error(apiError(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const name = user?.name ?? 'Student';
  const stats = data?.stats;

  const maxBar = useMemo(() => {
    const rows = data?.attendanceOverview ?? [];
    const m = Math.max(1, ...rows.map((r) => r.percent));
    return m;
  }, [data?.attendanceOverview]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading dashboard…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back, {name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Here&apos;s a snapshot of your academics, attendance, and upcoming activity.
        </p>
      </div>

      {error ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          {error} — some sections may show placeholders until the API is available.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Attendance"
          value={`${Number(stats?.attendancePercent ?? 0).toFixed(1)}%`}
          icon={FiCheckCircle}
          color="green"
        />
        <StatsCard
          title="Current CGPA"
          value={Number(stats?.cgpa ?? 0).toFixed(2)}
          icon={FiAward}
          color="indigo"
        />
        <StatsCard
          title="Pending fees"
          value={formatCurrency(stats?.pendingFees)}
          icon={FiDollarSign}
          color="yellow"
        />
        <StatsCard
          title="Active courses"
          value={stats?.activeCourses ?? 0}
          icon={FiBarChart2}
          color="blue"
          animate
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: '/student/timetable', label: 'View Timetable', icon: FiCalendar },
            { to: '/student/results', label: 'Check Results', icon: FiAward },
            { to: '/student/fees', label: 'Pay Fees', icon: FiDollarSign },
            { to: '/student/placements', label: 'Apply Placement', icon: FiBriefcase },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50/40 px-4 py-3 text-sm font-medium text-indigo-900 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow">
                <a.icon className="h-5 w-5" />
              </span>
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Recent notifications</h2>
            <Link
              to="/student/notifications"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {(data?.notifications?.length ?? 0) === 0 ? (
              <li className="py-8 text-center text-sm text-slate-500">No notifications yet.</li>
            ) : (
              data.notifications.map((n, idx) => (
                <li key={n.id ?? idx} className="flex gap-3 py-3 first:pt-0">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                    <FiFileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{n.title ?? 'Notification'}</p>
                    <p className="line-clamp-2 text-sm text-slate-600">{n.message ?? n.body ?? '—'}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(n.createdAt ?? n.date ?? n.sentAt)}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming exams</h2>
          {(data?.upcomingExams?.length ?? 0) === 0 ? (
            <p className="mt-6 text-center text-sm text-slate-500">No upcoming exams scheduled.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.upcomingExams.map((ex, idx) => (
                <li
                  key={ex.id ?? idx}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{ex.subject ?? ex.name ?? 'Exam'}</p>
                    <p className="text-sm text-slate-600">
                      {ex.courseName ? `${ex.courseName} · ` : ''}
                      {formatDateTime(ex.dateTime ?? ex.startsAt ?? ex.date)}
                    </p>
                    {ex.venue ?? ex.room ? (
                      <p className="text-xs text-slate-500">{ex.venue ?? ex.room}</p>
                    ) : null}
                  </div>
                  <FiClock className="mt-1 h-5 w-5 shrink-0 text-indigo-500" aria-hidden />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Attendance overview</h2>
        <p className="mt-1 text-sm text-slate-600">Per-course attendance (last recorded period).</p>
        {(data?.attendanceOverview?.length ?? 0) === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-500">No attendance data to display.</p>
        ) : (
          <div className="mt-6 flex flex-wrap items-end gap-4 sm:gap-6">
            {data.attendanceOverview.map((row, i) => {
              const pct = Math.min(100, Math.max(0, row.percent));
              const h = Math.round((pct / maxBar) * 100);
              return (
                <div key={`${row.label}-${i}`} className="flex flex-col items-center gap-2">
                  <div className="flex h-40 w-10 items-end justify-center rounded-lg bg-slate-100 sm:h-48 sm:w-12">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-indigo-700 to-sky-400 transition-all"
                      style={{ height: `${h}%` }}
                      title={`${row.label}: ${pct.toFixed(1)}%`}
                    />
                  </div>
                  <span className="max-w-[5rem] text-center text-xs font-medium text-slate-600">
                    {row.label}
                  </span>
                  <span className="text-xs tabular-nums text-slate-500">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
