import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiBookOpen, FiCalendar, FiEdit2, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import api from '../../services/api';
import Modal from '../../components/common/Modal';



const emptyForm = { title: '', description: '', courseId: '', department: '', semester: '', section: '', dueDate: '', maxMarks: 100, status: 'active' };

function DueBadge({ date }) {
  const d = new Date(date);
  const now = new Date();
  const diff = d - now;
  const overdue = diff < 0;
  const soon = diff > 0 && diff < 86400000 * 3;
  return (
    <span className={`text-xs font-semibold ${overdue ? 'text-rose-600' : soon ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400'}`}>
      {overdue ? '⚠ Overdue' : soon ? '⏰ Due soon' : ''} {d.toLocaleDateString()}
    </span>
  );
}

export default function AssignmentManagement() {
  const [list, setList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([api.get('/assignments/mine'), api.get('/courses')]);
      const cData = cRes.data?.data ?? cRes.data;
      setList(aRes.data);
      setCourses(Array.isArray(cData) ? cData : cData?.items ?? []);
    } catch { setList([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (a) => {
    setEditId(a._id);
    setForm({ title: a.title, description: a.description ?? '', courseId: a.course?._id ?? '', department: a.department?._id ?? '', semester: a.semester ?? '', section: a.section ?? '', dueDate: a.dueDate?.slice(0, 10) ?? '', maxMarks: a.maxMarks ?? 100, status: a.status });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) { await api.put(`/assignments/${editId}`, form); toast.success('Assignment updated'); }
      else { await api.post('/assignments', form); toast.success('Assignment created'); }
      setOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this assignment?')) return;
    try { await api.delete(`/assignments/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const stats = useMemo(() => ({
    active: list.filter(a => a.status === 'active').length,
    closed: list.filter(a => a.status === 'closed').length,
    overdue: list.filter(a => new Date(a.dueDate) < new Date() && a.status === 'active').length,
  }), [list]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assignment Management</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Create and manage assignments for your students</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <FiPlus className="h-4 w-4" /> New Assignment
        </button>
      </header>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Active', value: stats.active, color: 'from-indigo-600 to-blue-500' },
          { label: 'Closed', value: stats.closed, color: 'from-slate-500 to-slate-600' },
          { label: 'Overdue', value: stats.overdue, color: 'from-rose-500 to-red-600' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.color} p-5 text-white shadow`}>
            <p className="text-xs font-medium text-white/80">{s.label}</p>
            <p className="mt-1 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-500">Loading...</div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-16 text-slate-400">
          <FiBookOpen className="h-10 w-10 opacity-40" />
          <p className="text-sm">No assignments created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(a => (
            <div key={a._id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${a.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{a.status}</span>
                  </div>
                  {a.description && <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">{a.description}</p>}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                    {a.course && <span><FiBookOpen className="inline h-3 w-3 mr-1" />{a.course.code} — {a.course.name}</span>}
                    {a.semester && <span>Sem {a.semester}{a.section ? ` · Sec ${a.section}` : ''}</span>}
                    <span><FiUsers className="inline h-3 w-3 mr-1" />{a.submissions?.length ?? 0} submissions</span>
                    <span>Max: {a.maxMarks} marks</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <DueBadge date={a.dueDate} />
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(a)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition">
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => del(a._id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editId ? 'Edit Assignment' : 'Create Assignment'} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Title *</span>
            <input required value={form.title} onChange={(e) => setForm(f => ({...f, title: e.target.value}))}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Description</span>
            <textarea rows={2} value={form.description} onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400 resize-none" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Course</span>
              <select value={form.courseId} onChange={(e) => setForm(f => ({...f, courseId: e.target.value}))}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400">
                <option value="">Select course</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.code} — {c.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Due Date *</span>
              <div className="relative mt-1">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input required type="date" value={form.dueDate} onChange={(e) => setForm(f => ({...f, dueDate: e.target.value}))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 pl-10 pr-3 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Semester</span>
              <select value={form.semester} onChange={(e) => setForm(f => ({...f, semester: e.target.value}))}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400">
                <option value="">All</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Section</span>
              <input value={form.section} onChange={(e) => setForm(f => ({...f, section: e.target.value}))} placeholder="e.g. A"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Max Marks</span>
              <input type="number" min="1" value={form.maxMarks} onChange={(e) => setForm(f => ({...f, maxMarks: Number(e.target.value)}))}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status</span>
              <select value={form.status} onChange={(e) => setForm(f => ({...f, status: e.target.value}))}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400">
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700 pt-4">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
