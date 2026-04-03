import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSearch, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';

import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

function refId(x) {
  if (!x) return '';
  if (typeof x === 'object' && x._id) return x._id;
  return x;
}

export default function StudentList() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [reportMap, setReportMap] = useState({});
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [viewerName, setViewerName] = useState('');

  const loadCourses = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setViewerName(data?.name || '');
      const subs = data?.facultyProfile?.subjects;
      setCourses(Array.isArray(subs) ? subs : []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load courses');
    }
  }, []);

  const loadStudents = useCallback(async (courseId) => {
    if (!courseId) {
      setStudents([]);
      setReportMap({});
      return;
    }
    setLoading(true);
    try {
      const [{ data: studs }, { data: rep }] = await Promise.all([
        api.get('/students', { params: { course: courseId } }),
        api.get(`/attendance/report/${courseId}`),
      ]);
      setStudents(Array.isArray(studs) ? studs : []);
      const m = {};
      (rep?.students || []).forEach((row) => {
        m[String(row.student)] = row;
      });
      setReportMap(m);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (course) loadStudents(course);
  }, [course, loadStudents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = (s.user?.name || '').toLowerCase();
      const roll = String(s.rollNumber || '').toLowerCase();
      return name.includes(q) || roll.includes(q);
    });
  }, [students, search]);

  const openDetail = async (s) => {
    setSelected(s);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/students/${refId(s)}`);
      setDetail(data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load student');
      setDetail(s);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
  };

  const d = detail || selected;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Students</h1>
        <p className="mt-1 text-sm text-slate-600">
          Students enrolled under your courses
          {viewerName ? ` (${viewerName})` : ''} with attendance summary.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <label className="block flex-1 text-sm font-medium text-slate-700">
          Filter by course
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">All courses (select to load)</option>
            {courses.map((c) => (
              <option key={refId(c)} value={refId(c)}>
                {c.name} {c.code ? `(${c.code})` : ''}
              </option>
            ))}
          </select>
        </label>
        <div className="relative w-full sm:max-w-xs">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search name or roll no."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {!course ? (
        <p className="text-sm text-slate-600">
          Select a course to list students and attendance.
        </p>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner label="Loading students…" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Roll</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const id = String(refId(s));
                  const rep = reportMap[id];
                  const pct = rep
                    ? Math.round((rep.attendancePercentage || 0) * 10) / 10
                    : null;
                  return (
                    <tr
                      key={id}
                      className="cursor-pointer hover:bg-indigo-50/50"
                      onClick={() => openDetail(s)}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {s.rollNumber || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-800">
                        {s.user?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.department?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.semester ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.section || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {pct != null ? (
                          <span className="font-semibold text-indigo-700">
                            {pct}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-600">
              No students match your search.
            </p>
          ) : null}
        </div>
      )}

      <Modal
        isOpen={Boolean(selected)}
        onClose={closeDetail}
        title="Student details"
        size="lg"
      >
        {detailLoading ? (
          <LoadingSpinner label="Loading…" />
        ) : !d ? null : (
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                <FiUser className="h-6 w-6" />
              </span>
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {d.user?.name || '—'}
                </p>
                <p className="text-slate-600">{d.user?.email}</p>
              </div>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Roll number
                </dt>
                <dd className="font-medium text-slate-900">
                  {d.rollNumber || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Registration
                </dt>
                <dd className="font-medium text-slate-900">
                  {d.registrationNumber || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Department
                </dt>
                <dd className="font-medium text-slate-900">
                  {d.department?.name || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Course
                </dt>
                <dd className="font-medium text-slate-900">
                  {d.course?.name || '—'}{' '}
                  {d.course?.code ? `(${d.course.code})` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Semester / Section
                </dt>
                <dd className="font-medium text-slate-900">
                  {d.semester ?? '—'} / {d.section || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Phone
                </dt>
                <dd className="font-medium text-slate-900">
                  {d.phone || '—'}
                </dd>
              </div>
            </dl>
            {course && reportMap[String(refId(d))] ? (
              <div className="rounded-xl bg-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase text-indigo-800">
                  Attendance (this course)
                </p>
                <p className="mt-1 text-2xl font-bold text-indigo-900">
                  {Math.round(
                    (reportMap[String(refId(d))].attendancePercentage || 0) *
                      10
                  ) / 10}
                  %
                </p>
                <p className="text-xs text-indigo-700">
                  Sessions:{' '}
                  {reportMap[String(refId(d))].totalSessions ?? 0}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
