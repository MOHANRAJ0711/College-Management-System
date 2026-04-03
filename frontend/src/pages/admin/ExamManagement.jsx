import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCalendar, FiPlus, FiTrash2 } from 'react-icons/fi';
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

const emptyForm = {
  name: '',
  type: 'midterm',
  courseId: '',
  date: '',
  time: '',
  totalMarks: '',
  passingMarks: '',
  room: '',
};

function StatusBadge({ status }) {
  const s = String(status ?? 'scheduled').toLowerCase();
  const map = {
    scheduled: 'bg-indigo-100 text-indigo-800 ring-indigo-600/10',
    ongoing: 'bg-sky-100 text-sky-800 ring-sky-600/10',
    completed: 'bg-emerald-100 text-emerald-800 ring-emerald-600/10',
    cancelled: 'bg-rose-100 text-rose-800 ring-rose-600/10',
  };
  const cls = map[s] ?? 'bg-slate-100 text-slate-700 ring-slate-600/10';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${cls}`}
    >
      {status ?? 'scheduled'}
    </span>
  );
}

export default function ExamManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(unwrapList({ data }));
    } catch {
      setCourses([]);
    }
  }, []);

  const loadExams = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/exams');
      setExams(unwrapList({ data }));
    } catch (err) {
      toastApiError(err, 'Failed to load exams');
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      name: row.name ?? row.title ?? '',
      type: row.type ?? 'midterm',
      courseId: row.courseId != null ? String(row.courseId) : '',
      date: row.date ?? row.examDate ?? '',
      time: row.time ?? row.startTime ?? '',
      totalMarks: row.totalMarks != null ? String(row.totalMarks) : '',
      passingMarks: row.passingMarks != null ? String(row.passingMarks) : '',
      room: row.room ?? row.hall ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        courseId: form.courseId || undefined,
        date: form.date || undefined,
        time: form.time || undefined,
        totalMarks: form.totalMarks ? Number(form.totalMarks) : undefined,
        passingMarks: form.passingMarks ? Number(form.passingMarks) : undefined,
        room: form.room || undefined,
      };
      if (editId) {
        await api.put(`/exams/${editId}`, payload);
        toast.success('Exam updated');
      } else {
        await api.post('/exams', payload);
        toast.success('Exam scheduled');
      }
      setModalOpen(false);
      await loadExams();
    } catch (err) {
      toastApiError(err, 'Could not save exam');
    } finally {
      setSaving(false);
    }
  };

  const cancelExam = async (row) => {
    setSaving(true);
    try {
      await api.put(`/exams/${row.id}`, { ...row, status: 'cancelled' });
      toast.success('Exam cancelled');
      await loadExams();
    } catch (err) {
      toastApiError(err, 'Could not cancel exam');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await api.delete(`/exams/${deleteTarget.id}`);
      toast.success('Exam deleted');
      setDeleteTarget(null);
      await loadExams();
    } catch (err) {
      toastApiError(err, 'Could not delete exam');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Exams</h1>
          <p className="mt-1 text-sm text-slate-600">
            Schedule assessments and track examination status
            {user?.name ? <span className="text-slate-500"> · {user.name}</span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <FiPlus className="h-4 w-4" />
          Schedule exam
        </button>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Create exam</h2>
        <p className="mt-1 text-sm text-slate-600">
          Quick form mirrors the modal — use either surface to schedule.
        </p>
        <form
          className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              await api.post('/exams', {
                name: form.name,
                type: form.type,
                courseId: form.courseId || undefined,
                date: form.date || undefined,
                time: form.time || undefined,
                totalMarks: form.totalMarks ? Number(form.totalMarks) : undefined,
                passingMarks: form.passingMarks ? Number(form.passingMarks) : undefined,
                room: form.room || undefined,
              });
              toast.success('Exam scheduled');
              setForm(emptyForm);
              await loadExams();
            } catch (err) {
              toastApiError(err, 'Could not schedule exam');
            } finally {
              setSaving(false);
            }
          }}
        >
          <label className="md:col-span-2 lg:col-span-3">
            <span className="text-xs font-semibold text-slate-600">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
            />
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-600">Type</span>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
            >
              <option value="midterm">Midterm</option>
              <option value="endsem">End semester</option>
              <option value="internal">Internal</option>
              <option value="practical">Practical</option>
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold text-slate-600">Course</span>
            <select
              value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.name ?? c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-600">Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
            />
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-600">Time</span>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
            />
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-600">Total marks</span>
            <input
              inputMode="numeric"
              value={form.totalMarks}
              onChange={(e) => setForm((f) => ({ ...f, totalMarks: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
            />
          </label>
          <label>
            <span className="text-xs font-semibold text-slate-600">Passing marks</span>
            <input
              inputMode="numeric"
              value={form.passingMarks}
              onChange={(e) => setForm((f) => ({ ...f, passingMarks: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
            />
          </label>
          <label className="md:col-span-2 lg:col-span-1">
            <span className="text-xs font-semibold text-slate-600">Room</span>
            <input
              value={form.room}
              onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
            />
          </label>
          <div className="flex items-end md:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60 md:w-auto"
            >
              <FiCalendar className="h-4 w-4" />
              {saving ? 'Saving…' : 'Create from panel'}
            </button>
          </div>
        </form>
      </div>

      {loading && exams.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <LoadingSpinner label="Loading exams…" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-800">
              <thead className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Exam</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Type</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Course</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">When</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Marks</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Room</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-indigo-950">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      No exams scheduled yet.
                    </td>
                  </tr>
                ) : (
                  exams.map((ex) => {
                    const status = ex.status ?? 'scheduled';
                    const cancelled = String(status).toLowerCase() === 'cancelled';
                    const courseLabel =
                      ex.courseName ??
                      ex.courseCode ??
                      courses.find((c) => String(c.id) === String(ex.courseId))?.code ??
                      '—';
                    return (
                      <tr key={ex.id} className="transition hover:bg-indigo-50/40 odd:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold">{ex.name ?? ex.title}</td>
                        <td className="px-4 py-3 capitalize">{ex.type ?? '—'}</td>
                        <td className="px-4 py-3">{courseLabel}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {ex.date ?? ex.examDate ?? '—'}{' '}
                          <span className="text-slate-500">
                            {ex.time ?? ex.startTime ? `· ${ex.time ?? ex.startTime}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {ex.totalMarks ?? '—'} / {ex.passingMarks ?? '—'}
                        </td>
                        <td className="px-4 py-3">{ex.room ?? ex.hall ?? '—'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(ex)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={cancelled || saving}
                              onClick={() => cancelExam(ex)}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-40"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(ex)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-900 hover:bg-rose-100"
                            >
                              <FiTrash2 className="inline h-3.5 w-3.5" aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editId ? 'Edit exam' : 'Schedule exam'}
        size="lg"
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Type</span>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="midterm">Midterm</option>
                <option value="endsem">End semester</option>
                <option value="internal">Internal</option>
                <option value="practical">Practical</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Course</span>
              <select
                value={form.courseId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.name ?? c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Time</span>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Total marks</span>
              <input
                inputMode="numeric"
                value={form.totalMarks}
                onChange={(e) => setForm((f) => ({ ...f, totalMarks: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Passing marks</span>
              <input
                inputMode="numeric"
                value={form.passingMarks}
                onChange={(e) => setForm((f) => ({ ...f, passingMarks: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Room</span>
              <input
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete exam?"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          Remove <span className="font-semibold text-slate-900">{deleteTarget?.name ?? 'this exam'}</span>{' '}
          permanently?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={confirmDelete}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
