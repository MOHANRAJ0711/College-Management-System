import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAward, FiSend, FiShare2 } from 'react-icons/fi';
import { toast } from 'react-toastify';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function computeGrade(marksObtained, totalMarks, passingMarks) {
  if (totalMarks <= 0) return 'F';
  const pct = (marksObtained / totalMarks) * 100;
  if (passingMarks != null && marksObtained < passingMarks) return 'F';
  if (pct >= 90) return 'O';
  if (pct >= 80) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'B+';
  if (pct >= 50) return 'B';
  if (pct >= 40) return 'C';
  return 'D';
}

function refId(x) {
  if (!x) return '';
  if (typeof x === 'object' && x._id) return x._id;
  return x;
}

export default function EnterMarks() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [examDetail, setExamDetail] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const profile = me || user;

  const deptId = useMemo(() => {
    const d = profile?.facultyProfile?.department;
    return refId(d);
  }, [profile]);

  const subjectIds = useMemo(() => {
    const subs = profile?.facultyProfile?.subjects;
    if (!Array.isArray(subs)) return new Set();
    return new Set(subs.map((s) => refId(s)).filter(Boolean));
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (!cancelled) setMe(data);
      } catch {
        /* useAuth user */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadExams = useCallback(async () => {
    if (!deptId) {
      setExams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/exams', { params: { department: deptId } });
      const list = Array.isArray(data) ? data : [];
      const filtered = list.filter((ex) => subjectIds.has(refId(ex.course)));
      setExams(filtered.length ? filtered : list);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load exams');
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [deptId, subjectIds]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  useEffect(() => {
    const run = async () => {
      if (!examId) {
        setExamDetail(null);
        setStudents([]);
        setMarks({});
        return;
      }
      setBusy(true);
      try {
        const { data: ex } = await api.get(`/exams/${examId}`);
        setExamDetail(ex);
        const cId = refId(ex.course);
        const [{ data: studs }, { data: existing }] = await Promise.all([
          api.get('/students', { params: { course: cId } }),
          api.get('/results', { params: { exam: examId } }),
        ]);
        setStudents(Array.isArray(studs) ? studs : []);
        const next = {};
        (Array.isArray(existing) ? existing : []).forEach((r) => {
          const sid = refId(r.student);
          if (sid) next[sid] = r.marksObtained ?? '';
        });
        setMarks(next);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Could not load exam data');
        setExamDetail(null);
        setStudents([]);
      } finally {
        setBusy(false);
      }
    };
    run();
  }, [examId]);

  const totalMarks = examDetail?.totalMarks ?? 100;
  const passingMarks =
    examDetail?.passingMarks ?? Math.ceil(totalMarks * 0.4);

  const updateMark = (studentId, raw) => {
    const key = String(studentId);
    const v = raw === '' ? '' : Number(raw);
    setMarks((prev) => ({ ...prev, [key]: Number.isNaN(v) ? '' : v }));
  };

  const submitMarks = async () => {
    if (!examId) {
      toast.error('Select an exam');
      return;
    }
    const entries = students
      .map((s) => {
        const sid = refId(s._id ? s : s);
        const id = s._id || sid;
        const mo = marks[id];
        if (mo === '' || mo === undefined) return null;
        return { student: id, marksObtained: Number(mo) };
      })
      .filter(Boolean);
    if (!entries.length) {
      toast.error('Enter at least one mark');
      return;
    }
    setBusy(true);
    try {
      await api.post('/results/enter', { exam: examId, entries });
      toast.success('Marks saved');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save marks');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!examId) return;
    setPublishing(true);
    try {
      await api.put(`/results/publish/${examId}`);
      toast.success('Results published');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not publish');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Loading exams…" />
      </div>
    );
  }

  if (!deptId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Your profile has no department set. Contact admin to assign a department
        before entering marks.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Enter marks</h1>
        <p className="mt-1 text-sm text-slate-600">
          Select an exam, enter marks, then save. Publish when ready for students
          to view.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label className="block text-sm font-medium text-slate-700">
          Exam
          <select
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="mt-1 w-full max-w-xl rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">Select exam</option>
            {exams.map((ex) => (
              <option key={refId(ex)} value={refId(ex)}>
                {ex.name} —{' '}
                {ex.course?.name || 'Course'}{' '}
                ({ex.type || 'exam'}) —{' '}
                {ex.date ? new Date(ex.date).toLocaleDateString() : ''}
              </option>
            ))}
          </select>
        </label>

        {examDetail ? (
          <dl className="mt-4 grid gap-3 rounded-xl bg-indigo-50/80 p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-600">Type</dt>
              <dd className="font-semibold capitalize text-slate-900">
                {examDetail.type || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">Total marks</dt>
              <dd className="font-semibold text-slate-900">{totalMarks}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Passing marks</dt>
              <dd className="font-semibold text-slate-900">{passingMarks}</dd>
            </div>
            <div className="sm:col-span-3">
              <dt className="text-slate-600">Course</dt>
              <dd className="font-medium text-slate-900">
                {examDetail.course?.name}{' '}
                {examDetail.course?.code
                  ? `(${examDetail.course.code})`
                  : ''}
              </dd>
            </div>
          </dl>
        ) : null}
      </div>

      {busy && examId ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner label="Loading students…" />
        </div>
      ) : examId && students.length === 0 ? (
        <p className="text-sm text-slate-600">
          No students enrolled for this course.
        </p>
      ) : examId ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Roll</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Marks</th>
                  <th className="px-4 py-3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => {
                  const id = refId(s);
                  const mo = marks[id];
                  const num =
                    mo === '' || mo === undefined ? NaN : Number(mo);
                  const grade = Number.isFinite(num)
                    ? computeGrade(num, totalMarks, passingMarks)
                    : '—';
                  return (
                    <tr key={id} className="hover:bg-indigo-50/30">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {s.rollNumber || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-800">
                        {s.user?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={totalMarks}
                          step={0.5}
                          value={marks[id] ?? ''}
                          onChange={(e) => updateMark(id, e.target.value)}
                          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                        />
                        <span className="ml-2 text-xs text-slate-500">
                          / {totalMarks}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            grade === 'F'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <FiAward className="h-3.5 w-3.5" />
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-4 py-4">
            <button
              type="button"
              onClick={submitMarks}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
            >
              <FiSend className="h-4 w-4" />
              Submit all marks
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={publishing || busy}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-800 shadow-sm hover:bg-indigo-50 disabled:opacity-50"
            >
              <FiShare2 className="h-4 w-4" />
              {publishing ? 'Publishing…' : 'Publish results'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
