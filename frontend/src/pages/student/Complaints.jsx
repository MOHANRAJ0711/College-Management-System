import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiPlus, FiX } from 'react-icons/fi';
import api from '../../services/api';
import Modal from '../../components/common/Modal';

const CATS = ['academic', 'infrastructure', 'faculty', 'admin', 'ragging', 'other'];
const PRIS = ['low', 'medium', 'high'];

const statusStyle = { pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', in_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' };
const priStyle = { low: 'bg-slate-100 text-slate-600', medium: 'bg-amber-100 text-amber-800', high: 'bg-rose-100 text-rose-800' };

export default function Complaints() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'academic', description: '', priority: 'medium', isAnonymous: false });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/complaints/my'); setList(data); }
    catch { setList([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/complaints', form);
      toast.success('Complaint submitted successfully');
      setOpen(false);
      setForm({ title: '', category: 'academic', description: '', priority: 'medium', isAnonymous: false });
      load();
    } catch (err) { toast.error(err.response?.data?.message ?? 'Failed to submit'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Complaints & Grievances</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Submit and track your complaints</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <FiPlus className="h-4 w-4" /> New Complaint
        </button>
      </header>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-500">Loading...</div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-16 text-slate-500">
          <FiAlertTriangle className="h-8 w-8 opacity-40" />
          <p className="text-sm">No complaints submitted yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <div key={c._id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{c.title}</h3>
                    {c.isAnonymous && <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Anonymous</span>}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{c.description}</p>
                  {c.adminRemarks && (
                    <div className="mt-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 text-xs text-indigo-800 dark:text-indigo-300">
                      <span className="font-semibold">Admin response:</span> {c.adminRemarks}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle[c.status] ?? ''}`}>{c.status.replace('_', ' ')}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${priStyle[c.priority] ?? ''}`}>{c.priority}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3">
                <span className="capitalize">📁 {c.category}</span>
                <span>📅 {new Date(c.createdAt).toLocaleDateString()}</span>
                {c.resolvedAt && <span>✅ Resolved {new Date(c.resolvedAt).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Submit Complaint" size="lg">
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Title *</span>
            <input required value={form.title} onChange={(e) => setForm(f => ({...f, title: e.target.value}))}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Category</span>
              <select value={form.category} onChange={(e) => setForm(f => ({...f, category: e.target.value}))}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400">
                {CATS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Priority</span>
              <select value={form.priority} onChange={(e) => setForm(f => ({...f, priority: e.target.value}))}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400">
                {PRIS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Description *</span>
            <textarea required rows={4} value={form.description} onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              placeholder="Describe your complaint in detail..." />
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm(f => ({...f, isAnonymous: e.target.checked}))}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Submit anonymously</span>
          </label>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700 pt-4">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
