import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiDownload, FiPlus, FiSearch } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function toastApiError(err, fallback) {
  const msg = err.response?.data?.message ?? err.message;
  toast.error(typeof msg === 'string' && msg.trim() ? msg : fallback);
}

function unwrapList(res) {
  const d = res?.data?.data ?? res?.data;
  if (Array.isArray(d)) return { rows: d, total: d.length };
  if (Array.isArray(d?.items)) return { rows: d.items, total: d.total ?? d.items.length };
  if (Array.isArray(d?.results)) return { rows: d.results, total: d.total ?? d.results.length };
  return { rows: [], total: 0 };
}

const emptyForm = {
  rollNumber: '',
  name: '',
  email: '',
  password: '',
  departmentId: '',
  department: '',
  semester: '',
  section: '',
  status: 'active',
};

function deptName(row) {
  const d = row?.department ?? row?.departmentName;
  if (!d) return '';
  if (typeof d === 'string') return d;
  return d.name ?? d.title ?? '';
}

function deptId(row) {
  const d = row?.department;
  if (!d) return row?.departmentId ?? '';
  if (typeof d === 'object') return d._id ?? '';
  return row?.departmentId ?? '';
}

function StatusBadge({ status }) {
  const s = String(status ?? '—').toLowerCase();
  const map = {
    active: 'bg-emerald-100 text-emerald-800 ring-emerald-600/10',
    inactive: 'bg-slate-100 text-slate-700 ring-slate-600/10',
    graduated: 'bg-indigo-100 text-indigo-800 ring-indigo-600/10',
    suspended: 'bg-rose-100 text-rose-800 ring-rose-600/10',
  };
  const cls = map[s] ?? 'bg-slate-100 text-slate-700 ring-slate-600/10';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cls}`}
    >
      {status ?? '—'}
    </span>
  );
}

export default function ManageStudents() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [q, setQ] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadDepartments = useCallback(async () => {
    try {
      const { data } = await api.get('/departments');
      const { rows: list } = unwrapList({ data });
      setDepartments(list);
    } catch {
      setDepartments([]);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (deptFilter) params.department = deptFilter;
      if (semFilter) params.semester = semFilter;
      if (batchFilter) params.batch = batchFilter;
      const { data } = await api.get('/students', { params });
      const { rows: list } = unwrapList({ data });
      setRows(list);
    } catch (err) {
      toastApiError(err, 'Failed to load students');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q, deptFilter, semFilter, batchFilter]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadStudents();
    }, 250);
    return () => clearTimeout(t);
  }, [loadStudents]);

  const deptOptions = useMemo(() => {
    const names = new Set();
    departments.forEach((d) => {
      const n = d.name ?? d.title;
      if (n) names.add(n);
    });
    rows.forEach((r) => {
      const n = deptName(r);
      if (n) names.add(n);
    });
    return Array.from(names).sort();
  }, [departments, rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (deptFilter) {
      list = list.filter(
        (r) =>
          deptName(r).toLowerCase().includes(deptFilter.toLowerCase()) ||
          String(deptId(r)) === deptFilter
      );
    }
    if (semFilter) {
      list = list.filter((r) => String(r.semester ?? '') === semFilter);
    }
    if (batchFilter) {
      list = list.filter((r) => String(r.batch ?? r.year ?? '') === batchFilter);
    }
    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      list = list.filter((r) => {
        const blob = `${r.rollNumber ?? r.roll ?? ''} ${r.name ?? ''} ${r.email ?? ''}`.toLowerCase();
        return blob.includes(qq);
      });
    }
    return list;
  }, [rows, deptFilter, semFilter, batchFilter, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe]);

  useEffect(() => {
    setPage(1);
  }, [q, deptFilter, semFilter, batchFilter]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id ?? row._id);
    setForm({
      rollNumber: row.rollNumber ?? row.roll ?? '',
      name: row.name ?? '',
      email: row.email ?? '',
      password: '',
      departmentId: deptId(row),
      department: deptName(row),
      semester: row.semester ?? '',
      section: row.section ?? '',
      status: row.status ?? 'active',
    });
    setModalOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        rollNumber: form.rollNumber,
        name: form.name,
        email: form.email || undefined,
        password: form.password || (editId ? undefined : 'student123'),
        department: form.departmentId || undefined,
        semester: form.semester ? Number(form.semester) : undefined,
        section: form.section || undefined,
        status: form.status,
      };
      if (editId) {
        await api.put(`/students/${editId}`, payload);
        toast.success('Student updated');
      } else {
        await api.post('/students', payload);
        toast.success('Student added');
      }
      setModalOpen(false);
      await loadStudents();
    } catch (err) {
      toastApiError(err, 'Could not save student');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const targetId = deleteTarget?.id ?? deleteTarget?._id;
    if (!targetId) return;
    setDeleting(true);
    try {
      await api.delete(`/students/${targetId}`);
      toast.success('Student removed');
      setDeleteTarget(null);
      await loadStudents();
    } catch (err) {
      toastApiError(err, 'Could not delete student');
    } finally {
      setDeleting(false);
    }
  };

  const exportPlaceholder = () => {
    toast.info('Export will be available when the reporting service is connected.');
  };

  const columns = [
    {
      key: 'rollNumber',
      label: 'Roll number',
      render: (_, row) => row.rollNumber ?? row.roll ?? '—',
    },
    { key: 'name', label: 'Name' },
    {
      key: 'department',
      label: 'Department',
      render: (_, row) => deptName(row) || '—',
    },
    { key: 'semester', label: 'Semester' },
    { key: 'section', label: 'Section' },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <StatusBadge status={v} />,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Students</h1>
          <p className="mt-1 text-sm text-slate-600">
            Search, filter, and maintain student records
            {user?.name ? <span className="text-slate-500"> · {user.name}</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportPlaceholder}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
          >
            <FiDownload className="h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <FiPlus className="h-4 w-4" />
            Add student
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <label className="lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </span>
            <span className="relative block">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Roll number, name, email…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
              />
            </span>
          </label>
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
              {deptOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Semester
              </span>
              <select
                value={semFilter}
                onChange={(e) => setSemFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="">All</option>
                {Array.from({ length: 8 }).map((_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Batch
              </span>
              <input
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                placeholder="e.g. 2024"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
          </div>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <LoadingSpinner label="Loading students…" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={pageRows.map((r) => ({
            ...r,
            id: r._id ?? r.id,
            rollNumber: r.rollNumber ?? r.roll,
            name: r.user?.name ?? r.name,
            email: r.user?.email ?? r.email,
            department: deptName(r),
          }))}
          loading={loading}
          onEdit={openEdit}
          onDelete={(row) => setDeleteTarget(row)}
          emptyMessage="No students match your filters."
        />
      )}

      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row">
        <p>
          Page <span className="font-semibold text-slate-900">{pageSafe}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalPages}</span> ·{' '}
          <span className="tabular-nums">{filtered.length}</span> results
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pageSafe <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-800 transition enabled:hover:border-indigo-200 enabled:hover:bg-indigo-50 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={pageSafe >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-800 transition enabled:hover:border-indigo-200 enabled:hover:bg-indigo-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editId ? 'Edit student' : 'Add student'}
        size="lg"
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Roll number</span>
              <input
                required
                value={form.rollNumber}
                onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Full name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-xs font-semibold text-slate-600">Email</span>
              <input
                type="email"
                required={!editId}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-xs font-semibold text-slate-600">Password {editId ? '(leave blank to keep)' : ''}</span>
              <input
                type="password"
                required={!editId}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Department</span>
              <select
                required
                value={form.departmentId}
                onChange={(e) => {
                  const dept = departments.find((d) => d._id === e.target.value);
                  setForm((f) => ({ 
                    ...f, 
                    departmentId: dept?._id ?? '', 
                    department: dept ? (dept.name ?? dept.title ?? '') : ''
                  }));
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="" disabled>Select a department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name ?? d.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Semester</span>
              <input
                inputMode="numeric"
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Section</span>
              <input
                value={form.section}
                onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          </div>
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
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Create student'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete student?"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          This will remove{' '}
          <span className="font-semibold text-slate-900">
            {deleteTarget?.name ?? 'this student'}
          </span>{' '}
          from the directory. This action cannot be undone.
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
