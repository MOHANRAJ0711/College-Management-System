import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
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
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.results)) return d.results;
  return [];
}

const emptyForm = {
  code: '',
  name: '',
  departmentId: '',
  department: '',
  semester: '',
  credits: '',
  type: 'core',
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

function TypeBadge({ type }) {
  const t = String(type ?? '—').toLowerCase();
  const map = {
    core: 'bg-indigo-100 text-indigo-800 ring-indigo-600/10',
    elective: 'bg-sky-100 text-sky-800 ring-sky-600/10',
    lab: 'bg-amber-100 text-amber-900 ring-amber-600/10',
    seminar: 'bg-violet-100 text-violet-800 ring-violet-600/10',
  };
  const cls = map[t] ?? 'bg-slate-100 text-slate-700 ring-slate-600/10';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${cls}`}
    >
      {type ?? '—'}
    </span>
  );
}

export default function ManageCourses() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadDepartments = useCallback(async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(unwrapList({ data }));
    } catch {
      setDepartments([]);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (deptFilter) params.department = deptFilter;
      if (semFilter) params.semester = semFilter;
      const { data } = await api.get('/courses', { params });
      setRows(unwrapList({ data }));
    } catch (err) {
      toastApiError(err, 'Failed to load courses');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [deptFilter, semFilter]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const deptNames = useMemo(() => {
    const s = new Set();
    departments.forEach((d) => {
      if (d.name) s.add(d.name);
    });
    rows.forEach((r) => {
      const n = deptName(r);
      if (n) s.add(n);
    });
    return Array.from(s).sort();
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
    return list;
  }, [rows, deptFilter, semFilter]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id ?? row._id);
    setForm({
      code: row.code ?? '',
      name: row.name ?? row.title ?? '',
      departmentId: deptId(row),
      department: deptName(row),
      semester: row.semester != null ? String(row.semester) : '',
      credits: row.credits != null ? String(row.credits) : '',
      type: row.type ?? 'core',
    });
    setModalOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        name: form.name,
<<<<<<< HEAD
        department: form.departmentId || undefined,
=======
        departmentId: form.departmentId || undefined,
        department: form.department || undefined,
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
        semester: form.semester ? Number(form.semester) : undefined,
        credits: form.credits ? Number(form.credits) : undefined,
        type: form.type,
      };
      if (editId) {
        await api.put(`/courses/${editId}`, payload);
        toast.success('Course updated');
      } else {
        await api.post('/courses', payload);
        toast.success('Course created');
      }
      setModalOpen(false);
      await loadCourses();
    } catch (err) {
      toastApiError(err, 'Could not save course');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name', render: (v, row) => v ?? row.title ?? '—' },
    {
      key: 'department',
      label: 'Department',
      render: (_, row) => deptName(row) || '—',
    },
    { key: 'semester', label: 'Semester' },
    { key: 'credits', label: 'Credits' },
    {
      key: 'type',
      label: 'Type',
      render: (v) => <TypeBadge type={v} />,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Courses</h1>
          <p className="mt-1 text-sm text-slate-600">
            Maintain catalog, credits, and offering details
            {user?.name ? <span className="text-slate-500"> · {user.name}</span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <FiPlus className="h-4 w-4" />
          Add course
        </button>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
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
              {deptNames.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
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
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <LoadingSpinner label="Loading courses…" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered.map((r) => ({
            ...r,
            id: r._id ?? r.id,
            name: r.name ?? r.title,
            department: deptName(r),
          }))}
          loading={loading}
          onEdit={openEdit}
          emptyMessage="No courses match your filters."
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editId ? 'Edit course' : 'Add course'}
        size="lg"
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Code</span>
              <input
                required
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
<<<<<<< HEAD
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Department</span>
              <select
                required
                value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="" disabled>Select department</option>
                {departments.map((d) => (
                  <option key={d._id ?? d.id} value={d._id ?? d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
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
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
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
              <span className="text-xs font-semibold text-slate-600">Credits</span>
              <input
                inputMode="decimal"
                value={form.credits}
                onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Type</span>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="core">Core</option>
                <option value="elective">Elective</option>
                <option value="lab">Lab</option>
                <option value="seminar">Seminar</option>
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
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Create course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
