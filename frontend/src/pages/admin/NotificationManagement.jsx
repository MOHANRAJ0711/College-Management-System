import { useCallback, useEffect, useState } from 'react';
import {
  FiBell,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiSave,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function errMsg(e) {
  return e.response?.data?.message || e.message || 'Request failed';
}

function normalizeList(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.notifications)) return d.notifications;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

function deptName(row) {
  const d = row?.department ?? row?.departmentName;
  if (!d) return '';
  if (typeof d === 'string') return d;
  return d.name ?? d.title ?? '';
}

const emptyForm = {
  title: '',
  message: '',
  type: 'info',
  targetRole: 'all',
  department: '',
  expiryDate: '',
};

export default function NotificationManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [editRow, setEditRow] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setItems(normalizeList({ data }));
    } catch (e) {
      toast.error(errMsg(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.warn('Title and message are required.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/notifications', {
        ...form,
        expiryDate: form.expiryDate || undefined,
        department: form.department || undefined,
      });
      toast.success('Notification created.');
      setForm(emptyForm);
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editRow?.id) return;
    setSaving(true);
    try {
      await api.put(`/notifications/${editRow.id}`, editRow.payload);
      toast.success('Notification updated.');
      setEditRow(null);
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    const id = row._id ?? row.id;
    if (!id) return;
    if (!window.confirm('Delete this notification?')) return;
    try {
      await api.delete(`/notifications/${id}`);
      toast.success('Deleted.');
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'type',
      label: 'Type',
      render: (v, row) => (
        <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
          {row.type ?? v ?? 'info'}
        </span>
      ),
    },
    {
      key: 'targetRole',
      label: 'Target',
      render: (v, row) => row.targetRole ?? row.audience ?? v ?? '—',
    },
    {
      key: 'department',
      label: 'Department',
      render: (v, row) => deptName(row) || v || 'All',
    },
    {
      key: 'expiryDate',
      label: 'Expires',
      render: (v, row) => {
        const d = row.expiryDate ?? v;
        return d ? new Date(d).toLocaleString() : '—';
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Notification & circular management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Publish announcements with role targeting and expiry
            {user?.name ? ` · ${user.name}` : ''}.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <FiRefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <FiBell className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Create notification</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-600">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              >
                {['info', 'warning', 'urgent', 'event'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Target role</label>
              <select
                value={form.targetRole}
                onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              >
                {['all', 'student', 'faculty', 'admin'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Department (optional)</label>
            <input
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              placeholder="Leave blank for all departments"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Expiry date</label>
            <input
              type="datetime-local"
              value={form.expiryDate}
              onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setPreview({
                title: form.title || '(Untitled)',
                message: form.message || '(No message yet)',
                type: form.type,
                targetRole: form.targetRole,
                department: form.department,
                expiryDate: form.expiryDate,
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <FiEye className="h-4 w-4" />
            Preview before publish
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiPlus className="h-4 w-4" />}
            Publish
          </button>
        </div>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Notifications</h2>
        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Loading notifications…" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={items.map((r, i) => ({ ...r, id: r._id ?? r.id ?? `n-${i}` }))}
            loading={false}
            onEdit={(row) =>
              setEditRow({
                id: row._id ?? row.id,
                payload: {
                  title: row.title ?? '',
                  message: row.message ?? row.body ?? '',
                  type: row.type ?? 'info',
                  targetRole: row.targetRole ?? row.audience ?? 'all',
                  department: deptName(row),
                  expiryDate: row.expiryDate
                    ? new Date(row.expiryDate).toISOString().slice(0, 16)
                    : '',
                },
              })
            }
            onDelete={remove}
          />
        )}
      </div>

      <Modal
        isOpen={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Preview"
        size="lg"
      >
        {preview ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                {preview.type} · {preview.targetRole}
              </p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">{preview.title}</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{preview.message}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
                <span>Dept: {preview.department || 'All'}</span>
                {preview.expiryDate ? (
                  <span>Expires: {new Date(preview.expiryDate).toLocaleString()}</span>
                ) : (
                  <span>No expiry</span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Preview is client-side only. Click Publish in the form to call the API.
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(editRow)}
        onClose={() => !saving && setEditRow(null)}
        title="Edit notification"
        size="lg"
      >
        {editRow ? (
          <form className="space-y-3" onSubmit={saveEdit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Title</label>
                <input
                  value={editRow.payload.title}
                  onChange={(e) =>
                    setEditRow((er) => ({
                      ...er,
                      payload: { ...er.payload, title: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Type</label>
                <select
                  value={editRow.payload.type}
                  onChange={(e) =>
                    setEditRow((er) => ({
                      ...er,
                      payload: { ...er.payload, type: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {['info', 'warning', 'urgent', 'event'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Target role</label>
                <select
                  value={editRow.payload.targetRole}
                  onChange={(e) =>
                    setEditRow((er) => ({
                      ...er,
                      payload: { ...er.payload, targetRole: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {['all', 'student', 'faculty', 'admin'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Department</label>
                <input
                  value={editRow.payload.department}
                  onChange={(e) =>
                    setEditRow((er) => ({
                      ...er,
                      payload: { ...er.payload, department: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Expiry</label>
                <input
                  type="datetime-local"
                  value={editRow.payload.expiryDate}
                  onChange={(e) =>
                    setEditRow((er) => ({
                      ...er,
                      payload: { ...er.payload, expiryDate: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Message</label>
                <textarea
                  value={editRow.payload.message}
                  onChange={(e) =>
                    setEditRow((er) => ({
                      ...er,
                      payload: { ...er.payload, message: e.target.value },
                    }))
                  }
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setEditRow(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
                Save
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
