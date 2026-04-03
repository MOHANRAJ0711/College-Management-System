import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiBell, FiSend } from 'react-icons/fi';
import api from '../../services/api';

export default function HODNotificationPanel() {
  const [form, setForm] = useState({ title: '', message: '', targetRole: 'all' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then(({ data }) => {
        const d = data?.data ?? data;
        setSent(Array.isArray(d) ? d.slice(0, 20) : []);
      })
      .catch(() => setSent([]))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) { toast.error('Title and message are required'); return; }
    setSending(true);
    try {
      await api.post('/hod/notify', form);
      toast.success('Notification sent to department');
      setForm({ title: '', message: '', targetRole: 'all' });
      const { data } = await api.get('/notifications');
      const d = data?.data ?? data;
      setSent(Array.isArray(d) ? d.slice(0, 20) : []);
    } catch (err) { toast.error(err.response?.data?.message ?? 'Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notification Panel</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Send alerts and announcements to your department</p>
      </header>

      {/* Send form */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <FiSend className="h-5 w-5 text-indigo-600" /> Send Notification
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Title *</span>
              <input required value={form.title} onChange={(e) => setForm(f => ({...f, title: e.target.value}))}
                placeholder="Announcement title"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Message *</span>
              <textarea required rows={3} value={form.message} onChange={(e) => setForm(f => ({...f, message: e.target.value}))}
                placeholder="Write your announcement here..."
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400 resize-none" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Target</span>
              <select value={form.targetRole} onChange={(e) => setForm(f => ({...f, targetRole: e.target.value}))}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400">
                <option value="all">All</option>
                <option value="student">Students only</option>
                <option value="faculty">Faculty only</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={sending} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60">
            {sending ? 'Sending...' : <><FiSend className="h-4 w-4" /> Send Notification</>}
          </button>
        </form>
      </div>

      {/* Recent */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-700 px-5 py-3">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <FiBell className="h-4 w-4 text-indigo-600" /> Recent Notifications
          </h2>
        </div>
        {loading ? (
          <div className="flex h-24 items-center justify-center text-slate-400">Loading...</div>
        ) : sent.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-slate-400 text-sm">No notifications yet</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {sent.map(n => (
              <div key={n._id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{n.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{n.message}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
