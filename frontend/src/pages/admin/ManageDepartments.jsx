import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiDownload, FiFileText, FiLayers, FiPlus, FiSettings } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';

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
  code: '',
  hod: '',
  hodName: '',
};

export default function ManageDepartments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/departments');
      setRows(unwrapList({ data }));
    } catch (err) {
      toastApiError(err, 'Failed to load departments');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFaculties = useCallback(async () => {
    try {
      const { data } = await api.get('/faculty');
      setFaculties(unwrapList({ data }));
    } catch {
      setFaculties([]);
    }
  }, []);

  useEffect(() => {
    load();
    loadFaculties();
  }, [load, loadFaculties]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    const hodVal = row.hod && typeof row.hod === 'object' ? (row.hod._id || row.hod.id) : row.hod;
    setForm({
      name: row.name ?? '',
      code: row.code ?? '',
      hod: hodVal ?? row.hodId ?? '',
      hodName: row.hodName ?? row.head ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        hod: form.hod || undefined,
      };
      if (editId) {
        await api.put(`/departments/${editId}`, payload);
        toast.success('Department updated');
      } else {
        await api.post('/departments', payload);
        toast.success('Department created');
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toastApiError(err, 'Could not save department');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row) => {
    const next = !(row.isActive ?? row.active ?? true);
    try {
      await api.put(`/departments/${row.id}`, {
        ...row,
        isActive: next,
        active: next,
      });
      toast.success(next ? 'Department activated' : 'Department deactivated');
      await load();
    } catch (err) {
      toastApiError(err, 'Could not update status');
    }
  };
  
  const handleExportExcel = () => {
    if (rows.length === 0) {
      return toast.info('No department data to export.');
    }

    const data = rows.map((d) => {
      const active = d.isActive ?? d.active ?? true;
      const rawHod = d.hodName ?? d.hod ?? d.head;
      const hod = typeof rawHod === 'object' && rawHod !== null
        ? (rawHod.name ?? rawHod.employeeId ?? 'Unknown')
        : (rawHod || '—');
        
      return {
        Code: d.code ?? '—',
        Name: d.name ?? '—',
        'Head of Department': hod,
        Students: d.studentCount ?? 0,
        Courses: d.courseCount ?? 0,
        Status: active ? 'Active' : 'Inactive',
        'Created At': d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'
      };
    });

    try {
      exportToExcel(data, 'Department_Report');
      toast.success('Department report exported to Excel');
    } catch (err) {
      toast.error('Failed to export data');
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (rows.length === 0) {
      return toast.info('No department data to export.');
    }

    const data = rows.map((d) => {
      const active = d.isActive ?? d.active ?? true;
      const rawHod = d.hodName ?? d.hod ?? d.head;
      const hod = typeof rawHod === 'object' && rawHod !== null
        ? (rawHod.name ?? rawHod.employeeId ?? 'Unknown')
        : (rawHod || '—');
        
      return {
        Code: d.code ?? '—',
        Name: d.name ?? '—',
        'Head of Department': hod,
        Students: d.studentCount ?? 0,
        Courses: d.courseCount ?? 0,
        Status: active ? 'Active' : 'Inactive',
        'Created At': d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'
      };
    });

    try {
      exportToCSV(data, 'Department_Report');
      toast.success('Department report exported to CSV');
    } catch (err) {
      toast.error('Failed to export data');
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Departments</h1>
          <p className="mt-1 text-sm text-slate-600">
            Organize departments, HOD, and program counts
            {user?.name ? <span className="text-slate-500"> · {user.name}</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
            title="Export to Excel"
          >
            <FiDownload className="h-4 w-4" />
            Excel
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
            title="Export to CSV"
          >
            <FiFileText className="h-4 w-4 text-emerald-600" />
            CSV
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <FiPlus className="h-4 w-4" />
            Add department
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <LoadingSpinner label="Loading departments…" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => {
            const active = d.isActive ?? d.active ?? true;
            const students = d.studentsCount ?? d.studentCount ?? d.students ?? 0;
            const courses = d.coursesCount ?? d.courseCount ?? d.courses ?? 0;
            const rawHod = d.hodName ?? d.hod ?? d.head;
            const hod = typeof rawHod === 'object' && rawHod !== null
              ? (rawHod.name ?? rawHod.employeeId ?? 'Unknown')
              : (rawHod || '—');
            return (
              <article
                key={d.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                      {d.code ?? 'CODE'}
                    </p>
                    <h2 className="mt-1 truncate text-lg font-bold text-slate-900">{d.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      HOD: <span className="font-medium text-slate-800">{hod}</span>
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                      active
                        ? 'bg-emerald-100 text-emerald-800 ring-emerald-600/10'
                        : 'bg-slate-100 text-slate-700 ring-slate-600/10'
                    }`}
                  >
                    {active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50/60 p-3">
                    <p className="text-xs font-semibold text-indigo-900/80">Students</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-950">{students}</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50/50 p-3">
                    <p className="text-xs font-semibold text-sky-900/80">Courses</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-sky-950">{courses}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(d)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 sm:flex-none"
                  >
                    <FiSettings className="h-4 w-4 text-indigo-600" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(d)}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition sm:flex-none ${
                      active
                        ? 'border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                    }`}
                  >
                    {active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <FiLayers className="mx-auto h-10 w-10 text-indigo-400" />
          <p className="mt-3 text-sm font-semibold text-slate-900">No departments yet</p>
          <p className="mt-1 text-sm text-slate-600">Create your first department to get started.</p>
        </div>
      ) : null}

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editId ? 'Edit department' : 'Add department'}
        size="md"
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Code</span>
            <input
              required
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-slate-600">Head of Department (HOD)</span>
            <select
              value={form.hod}
              onChange={(e) => setForm((f) => ({ ...f, hod: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
            >
              <option value="">Select HOD (optional)</option>
              {faculties.map((f) => {
                const rawUser = f.user?.name ?? f.name ?? f.user;
                const userName = typeof rawUser === 'object' && rawUser !== null ? (rawUser._id || 'Unknown') : (rawUser || 'Unknown');
                const fId = f._id ?? f.id;
                return (
                  <option key={fId} value={fId}>
                    {userName} {f.designation ? `— ${f.designation}` : ''}
                  </option>
                );
              })}
            </select>
          </label>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
