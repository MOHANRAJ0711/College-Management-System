import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiAlertTriangle, FiBookOpen, FiLayers } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function toastApiError(err, fallback) {
  const msg = err.response?.data?.message ?? err.message;
  toast.error(typeof msg === 'string' && msg.trim() ? msg : fallback);
}

function unwrapList(res) {
  const d = res?.data?.data ?? res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.results)) return d.results;
  return [];
}

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.min(100, Math.max(0, x));
}

function deptName(row) {
  const d = row?.department ?? row?.departmentName;
  if (!d) return '';
  if (typeof d === 'string') return d;
  return d.name ?? d.title ?? '';
}

export default function AttendanceManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [courses, setCourses] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailCourse, setDetailCourse] = useState(null);
  const [detailRows, setDetailRows] = useState([]);

  const loadCourses = useCallback(async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(unwrapList({ data }));
    } catch {
      setCourses([]);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (deptFilter) params.department = deptFilter;
      if (courseFilter) params.courseId = courseFilter;
      const { data } = await api.get('/attendance', { params });
      const body = data?.data ?? data;
      const list = Array.isArray(body)
        ? body
        : Array.isArray(body?.summary)
          ? body.summary
          : Array.isArray(body?.departments)
            ? body.departments
            : [];
      setSummary(list);
    } catch (err) {
      toastApiError(err, 'Failed to load attendance overview');
      setSummary([]);
    } finally {
      setLoading(false);
    }
  }, [deptFilter, courseFilter]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const deptNames = useMemo(() => {
    const s = new Set();
    summary.forEach((x) => {
      const n = x.department ?? x.departmentName ?? x.name;
      if (n) s.add(n);
    });
    courses.forEach((c) => {
      const n = c.department ?? c.departmentName;
      if (n) s.add(n);
    });
    return Array.from(s).sort();
  }, [summary, courses]);

  const lowAlerts = useMemo(() => {
    const rows = [];
    const visit = (list, dept) => {
      list.forEach((s) => {
        const p = pct(s.percentage ?? s.attendancePercent ?? s.rate);
        if (p < 75) {
          rows.push({
            id: s.studentId ?? s.id ?? `${dept}-${s.name}`,
            name: s.name ?? s.studentName,
            roll: s.rollNumber ?? s.roll,
            department: s.department ?? dept,
            course: s.courseName ?? s.course,
            percentage: p,
          });
        }
      });
    };

    summary.forEach((block) => {
      const dept = block.department ?? block.departmentName ?? block.name;
      const students = block.students ?? block.lowAttendance ?? [];
      if (Array.isArray(students) && students.length) visit(students, dept);
    });

    if (!rows.length && Array.isArray(summary)) {
      summary.forEach((block) => {
        const students = block.students ?? [];
        if (Array.isArray(students)) visit(students, block.department ?? block.name);
      });
    }

    return rows.sort((a, b) => a.percentage - b.percentage);
  }, [summary]);

  const openCourseDetail = async (courseId, label) => {
    if (!courseId) {
      toast.error('Select a course for detailed view');
      return;
    }
    setDetailCourse({ id: courseId, label });
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/attendance/report/${courseId}`);
      const body = data?.data ?? data;
      const sessions = body?.sessions ?? body?.records ?? body;
      setDetailRows(Array.isArray(sessions) ? sessions : Array.isArray(body) ? body : []);
    } catch (err) {
      toastApiError(err, 'Could not load course attendance report');
      setDetailRows([]);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance overview</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor department-wise attendance and intervene early
          {user?.name ? <span className="text-slate-500"> · {user.name}</span> : null}
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Department
            </span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/15"
            >
              <option value="">All</option>
              {deptNames.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Course filter
            </span>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/15"
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ?? c.name} · {c.name ?? c.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading && summary.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <LoadingSpinner label="Loading attendance…" />
        </div>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {summary.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600 lg:col-span-2">
              No attendance summary returned. When the API provides department aggregates, they will
              appear here.
            </div>
          ) : (
            summary.map((block, idx) => {
              const dept = block.department ?? block.departmentName ?? block.name ?? `Department ${idx + 1}`;
              const rate = pct(block.averageAttendance ?? block.rate ?? block.percentage);
              const sessions = block.sessionsHeld ?? block.sessions ?? '—';
              return (
                <div
                  key={block.id ?? dept}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                        Department
                      </p>
                      <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-slate-900">
                        <FiLayers className="h-5 w-5 text-indigo-600" />
                        {dept}
                      </h2>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
                      Avg {rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Attendance</span>
                      <span className="tabular-nums">{rate.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          rate < 75 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-sky-500'
                        }`}
                        style={{ width: `${Math.max(rate, 3)}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Sessions held: <span className="font-semibold text-slate-900">{sessions}</span>
                  </p>
                </div>
              );
            })
          )}
        </section>
      )}

      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
              <FiAlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Low attendance alerts</h2>
              <p className="text-sm text-slate-600">Students below the 75% policy threshold</p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
            {lowAlerts.length} students
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-amber-200/80 text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                <th className="py-2 pr-4">Roll</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Course</th>
                <th className="py-2">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {lowAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-600">
                    No low-attendance rows parsed from the API response yet.
                  </td>
                </tr>
              ) : (
                lowAlerts.map((r) => (
                  <tr key={r.id} className="text-slate-800">
                    <td className="py-2 pr-4 font-mono text-xs">{r.roll ?? '—'}</td>
                    <td className="py-2 pr-4 font-medium">{r.name ?? '—'}</td>
                    <td className="py-2 pr-4">{deptName(r) || '—'}</td>
                    <td className="py-2 pr-4">{r.course ?? '—'}</td>
                    <td className="py-2 font-semibold text-amber-900 tabular-nums">
                      {r.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Detailed course view</h2>
            <p className="mt-1 text-sm text-slate-600">
              Open session-wise attendance for a course (GET /api/attendance/report/:courseId)
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCourseDetail(courseFilter, 'Selected course')}
            disabled={!courseFilter}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            <FiBookOpen className="h-4 w-4" />
            View report
          </button>
        </div>
      </section>

      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailCourse?.label ? `Attendance · ${detailCourse.label}` : 'Course attendance'}
        size="lg"
      >
        {detailLoading ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <LoadingSpinner label="Loading report…" />
          </div>
        ) : detailRows.length === 0 ? (
          <p className="text-sm text-slate-600">
            No session records returned. The API may structure this payload differently.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Topic</th>
                  <th className="py-2 pr-4">Present</th>
                  <th className="py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detailRows.map((row, idx) => (
                  <tr key={row.id ?? idx}>
                    <td className="py-2 pr-4">{row.date ?? row.sessionDate ?? '—'}</td>
                    <td className="py-2 pr-4">{row.topic ?? row.title ?? '—'}</td>
                    <td className="py-2 pr-4 tabular-nums">{row.present ?? row.presentCount ?? '—'}</td>
                    <td className="py-2 tabular-nums">{row.total ?? row.totalStudents ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
