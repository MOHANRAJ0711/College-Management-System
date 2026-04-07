import { useCallback, useEffect, useState } from 'react';
import {
  FiCheck,
  FiCheckCircle,
  FiRefreshCw,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';

import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function courseId(c) {
  if (!c) return '';
  if (typeof c === 'object' && c._id) return c._id;
  return c;
}

function studentId(s) {
  if (!s) return '';
  if (typeof s === 'object' && s._id) return s._id;
  return s;
}

export default function MarkAttendance() {
  const [booting, setBooting] = useState(true);
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState('');
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [statusMap, setStatusMap] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    const load = async () => {
      setBooting(true);
      try {
        const { data } = await api.get('/auth/me');
        const subs = data?.facultyProfile?.subjects;
        setCourses(Array.isArray(subs) ? subs : []);
        if (subs?.length && courseId(subs[0])) {
          setCourse((c) => c || courseId(subs[0]));
        }
      } catch (e) {
        toast.error(e.response?.data?.message || 'Could not load courses');
      } finally {
        setBooting(false);
      }
    };
    load();
  }, []);

  const loadStudents = useCallback(async (courseVal) => {
    if (!courseVal) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    try {
      const { data } = await api.get('/students', {
        params: { course: courseVal },
      });
      setStudents(Array.isArray(data) ? data : []);
      setStatusMap({});
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load students');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (course) loadStudents(course);
  }, [course, loadStudents]);

  const loadReport = useCallback(async (courseVal) => {
    if (!courseVal) {
      setReport(null);
      return;
    }
    setLoadingReport(true);
    try {
      const { data } = await api.get(`/attendance/report/${courseVal}`);
      setReport(data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load report');
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    if (course) loadReport(course);
  }, [course, loadReport]);

  const setAll = (status) => {
    const next = {};
    students.forEach((s) => {
      next[studentId(s)] = status;
    });
    setStatusMap(next);
  };

  const toggleStatus = (sid, status) => {
    setStatusMap((prev) => ({ ...prev, [sid]: status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!course) {
      toast.error('Select a course');
      return;
    }
    const entries = students.map((s) => {
      const sid = studentId(s);
      const st = statusMap[sid] || 'present';
      return { student: sid, status: st };
    });
    if (entries.length === 0) {
      toast.error('No students in this course');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/attendance/mark', {
        course,
        date: new Date(date).toISOString(),
        entries,
      });
      toast.success('Attendance saved');
      loadReport(course);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Could not save attendance'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (booting) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Loading…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mark attendance</h1>
        <p className="mt-1 text-sm text-slate-600">
          Record attendance for your assigned courses and review class-wise
          reports.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="block flex-1 text-sm font-medium text-slate-700">
            Course
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={courseId(c)} value={courseId(c)}>
                  {c.name} {c.code ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block w-full text-sm font-medium text-slate-700 lg:max-w-xs">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAll('present')}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            <FiCheckCircle className="h-4 w-4" />
            All present
          </button>
          <button
            type="button"
            onClick={() => setAll('absent')}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
          >
            <FiXCircle className="h-4 w-4" />
            All absent
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-100">
          {loadingStudents ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner label="Loading students…" />
            </div>
          ) : students.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-600">
              {course
                ? 'No students found for this course.'
                : 'Select a course to load students.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Roll no.</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 text-center">Present</th>
                    <th className="px-4 py-3 text-center">Absent</th>
                    <th className="px-4 py-3 text-center">Late</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => {
                    const sid = studentId(s);
                    const name =
                      s.user?.name || s.name || 'Student';
                    const roll = s.rollNumber || '—';
                    const current = statusMap[sid] || 'present';
                    return (
                      <tr key={sid} className="hover:bg-indigo-50/30">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {roll}
                        </td>
                        <td className="px-4 py-3 text-slate-800">{name}</td>
                        {['present', 'absent', 'late'].map((st) => (
                          <td key={st} className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              checked={current === st}
                              onChange={() => toggleStatus(sid, st)}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={submitting || !course || students.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiCheck className="h-4 w-4" />
            {submitting ? 'Saving…' : 'Submit attendance'}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Attendance report
            </h2>
            <p className="text-sm text-slate-600">
              Summary for the selected course (all recorded sessions).
            </p>
          </div>
          <button
            type="button"
            onClick={() => course && loadReport(course)}
            disabled={!course || loadingReport}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw
              className={`h-4 w-4 ${loadingReport ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        {loadingReport && !report ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner label="Loading report…" />
          </div>
        ) : !course ? (
          <p className="mt-4 text-sm text-slate-600">Select a course first.</p>
        ) : !report ? (
          <p className="mt-4 text-sm text-slate-600">No report data.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="rounded-lg bg-indigo-50 px-3 py-1.5 font-medium text-indigo-900">
                Total records: {report.totalRecords ?? 0}
              </span>
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-800">
                Session days: {report.sessionDays ?? 0}
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Roll</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Sessions</th>
                    <th className="px-4 py-3">Present</th>
                    <th className="px-4 py-3">Late</th>
                    <th className="px-4 py-3">Absent</th>
                    <th className="px-4 py-3">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(report.students || []).map((row) => (
                    <tr key={row.student} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium">{row.rollNumber}</td>
                      <td className="px-4 py-3">{row.studentName}</td>
                      <td className="px-4 py-3">{row.totalSessions}</td>
                      <td className="px-4 py-3">{row.presentCount}</td>
                      <td className="px-4 py-3">{row.lateCount}</td>
                      <td className="px-4 py-3">{row.absentCount}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-700">
                        {Math.round((row.attendancePercentage || 0) * 10) / 10}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(report.students || []).length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <FiUsers className="h-4 w-4" />
                No attendance rows yet for this course.
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
