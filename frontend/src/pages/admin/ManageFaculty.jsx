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
  employeeId: '',
  name: '',
  email: '',
<<<<<<< HEAD
  password: '',
=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
  departmentId: '',
  department: '',
  designation: '',
  subjects: '',
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

function formatSubjects(subjects) {
<<<<<<< HEAD
  if (Array.isArray(subjects)) {
    return subjects.map(s => {
      if (typeof s === 'string') return s;
      if (s && typeof s === 'object') return s.name || s.code || s._id;
      return String(s);
    }).join(', ');
  }
=======
  if (Array.isArray(subjects)) return subjects.join(', ');
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
  if (typeof subjects === 'string') return subjects;
  return '—';
}

export default function ManageFaculty() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [q, setQ] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
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

  const loadFaculty = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (deptFilter) params.department = deptFilter;
      if (designationFilter) params.designation = designationFilter;
      const { data } = await api.get('/faculty', { params });
      const { rows: list } = unwrapList({ data });
      setRows(list);
    } catch (err) {
      toastApiError(err, 'Failed to load faculty');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q, deptFilter, designationFilter]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    const t = setTimeout(() => loadFaculty(), 250);
    return () => clearTimeout(t);
  }, [loadFaculty]);

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

  const designations = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => {
      if (r.designation) s.add(r.designation);
    });
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (deptFilter) {
      list = list.filter(
        (r) =>
          deptName(r).toLowerCase().includes(deptFilter.toLowerCase()) ||
          String(deptId(r)) === deptFilter
      );
    }
    if (designationFilter) {
      list = list.filter((r) => String(r.designation ?? '') === designationFilter);
    }
    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      list = list.filter((r) => {
        const blob = `${r.employeeId ?? r.empId ?? ''} ${r.name ?? ''} ${r.email ?? ''} ${formatSubjects(r.subjects)}`.toLowerCase();
        return blob.includes(qq);
      });
    }
    return list;
  }, [rows, deptFilter, designationFilter, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe]);

  useEffect(() => {
    setPage(1);
  }, [q, deptFilter, designationFilter]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id ?? row._id);
    setForm({
      employeeId: row.employeeId ?? row.empId ?? '',
      name: row.name ?? '',
      email: row.email ?? '',
<<<<<<< HEAD
      password: '',
=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
      departmentId: deptId(row),
      department: deptName(row),
      designation: row.designation ?? '',
      subjects: formatSubjects(row.subjects),
    });
    setModalOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const subjectsArr = form.subjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        employeeId: form.employeeId,
        name: form.name,
        email: form.email || undefined,
<<<<<<< HEAD
        password: form.password || (editId ? undefined : 'faculty123'),
        department: form.departmentId || undefined,
=======
        departmentId: form.departmentId || undefined,
        department: form.department || undefined,
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
        designation: form.designation || undefined,
        subjects: subjectsArr.length ? subjectsArr : undefined,
      };
      if (editId) {
        await api.put(`/faculty/${editId}`, payload);
        toast.success('Faculty updated');
      } else {
        await api.post('/faculty', payload);
        toast.success('Faculty added');
      }
      setModalOpen(false);
      await loadFaculty();
    } catch (err) {
      toastApiError(err, 'Could not save faculty');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const targetId = deleteTarget?.id ?? deleteTarget?._id;
    if (!targetId) return;
    setDeleting(true);
    try {
      await api.delete(`/faculty/${targetId}`);
      toast.success('Faculty removed');
      setDeleteTarget(null);
      await loadFaculty();
    } catch (err) {
      toastApiError(err, 'Could not delete faculty');
    } finally {
      setDeleting(false);
    }
  };

  const exportPlaceholder = () => {
    toast.info('Export will be available when the reporting service is connected.');
  };

  const columns = [
    {
      key: 'employeeId',
      label: 'Employee ID',
      render: (_, row) => row.employeeId ?? row.empId ?? '—',
    },
    { key: 'name', label: 'Name' },
    {
      key: 'department',
      label: 'Department',
      render: (_, row) => deptName(row) || '—',
    },
    { key: 'designation', label: 'Designation' },
    {
      key: 'subjects',
      label: 'Subjects',
      render: (_, row) => (
        <span className="max-w-[14rem] truncate" title={formatSubjects(row.subjects)}>
          {formatSubjects(row.subjects)}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Faculty</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage teaching staff and subject assignments
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
            Add faculty
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
                placeholder="Employee ID, name, subject…"
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
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Designation
            </span>
            <select
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/15"
            >
              <option value="">All</option>
              {designations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <LoadingSpinner label="Loading faculty…" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={pageRows.map((r) => ({
            ...r,
            id: r._id ?? r.id,
            employeeId: r.employeeId ?? r.empId,
            name: r.user?.name ?? r.name,
            email: r.user?.email ?? r.email,
            department: deptName(r),
          }))}
          loading={loading}
          onEdit={openEdit}
          onDelete={(row) => setDeleteTarget(row)}
          emptyMessage="No faculty match your filters."
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
        title={editId ? 'Edit faculty' : 'Add faculty'}
        size="lg"
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Employee ID</span>
              <input
                required
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
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
<<<<<<< HEAD
            <label className="block sm:col-span-1">
              <span className="text-xs font-semibold text-slate-600">Email</span>
              <input
                type="email"
                required={!editId}
=======
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Email</span>
              <input
                type="email"
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
<<<<<<< HEAD
            <label className="block sm:col-span-1">
              <span className="text-xs font-semibold text-slate-600">Password {editId ? '(leave blank to keep)' : ''}</span>
              <input
                type="password"
                required={!editId}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
=======
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Department</span>
              <input
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Department ID</span>
              <input
                value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block sm:col-span-2">
<<<<<<< HEAD
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
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Designation / Role</span>
              <select
                value={form.designation}
                onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="" disabled>Select a role</option>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
                <option value="HOD">HOD (Head of Department)</option>
                <option value="Dean">Dean</option>
                <option value="Lab Assistant">Lab Assistant</option>
                <option value="Other">Other</option>
              </select>
=======
              <span className="text-xs font-semibold text-slate-600">Designation</span>
              <input
                value={form.designation}
                onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                placeholder="Assistant Professor, Professor…"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Subjects (comma separated)</span>
              <textarea
                rows={3}
                value={form.subjects}
                onChange={(e) => setForm((f) => ({ ...f, subjects: e.target.value }))}
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Create faculty'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete faculty member?"
        size="sm"
      >
        <p className="text-sm text-slate-600">
          Remove <span className="font-semibold text-slate-900">{deleteTarget?.name ?? 'this record'}</span>{' '}
          from the directory?
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
