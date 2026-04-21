import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiCamera,
  FiDownload,
  FiFileText,
  FiLoader,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiTrash2,
  FiUser,
} from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import FilterChip from '../../components/common/FilterChip';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';

function toInputDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

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
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  addressStreet: '',
  addressCity: '',
  addressState: '',
  addressPincode: '',
  guardianName: '',
  guardianPhone: '',
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
  const [uploading, setUploading] = useState(false);


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

  const startRow = filtered.length === 0 ? 0 : (pageSafe - 1) * pageSize + 1;
  const endRow = Math.min(filtered.length, pageSafe * pageSize);

  const statusCounts = useMemo(() => {
    const counts = { active: 0, inactive: 0, graduated: 0, suspended: 0 };
    filtered.forEach((r) => {
      const key = String(r.status ?? '').toLowerCase();
      if (Object.hasOwn(counts, key)) counts[key] += 1;
    });
    return counts;
  }, [filtered]);

  useEffect(() => {
    setPage(1);
  }, [q, deptFilter, semFilter, batchFilter]);

  const hasFilters = Boolean(q.trim() || deptFilter || semFilter || batchFilter);
  const clearFilters = () => {
    setQ('');
    setDeptFilter('');
    setSemFilter('');
    setBatchFilter('');
  };

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
      phone: row.phone ?? '',
      dateOfBirth: toInputDate(row.dateOfBirth),
      gender: row.gender ?? '',
      bloodGroup: row.bloodGroup ?? '',
      addressStreet: row.address?.street ?? '',
      addressCity: row.address?.city ?? '',
      addressState: row.address?.state ?? '',
      addressPincode: row.address?.pincode ?? '',
      guardianName: row.guardianName ?? '',
      guardianPhone: row.guardianPhone ?? '',
      avatar: row.user?.avatar || row.avatar,
    });
    setModalOpen(true);
  };

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file || !editId) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Please select an image file');
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const { data } = await api.put(`/auth/users/${editId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({ ...f, avatar: data.avatar }));
      toast.success('Student photo updated');
      await loadStudents();
    } catch (err) {
      toastApiError(err, 'Could not upload image');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveImage() {
    if (!editId || !window.confirm('Remove student photo?')) return;

    setUploading(true);
    try {
      await api.delete(`/auth/users/${editId}/avatar`);
      setForm((f) => ({ ...f, avatar: '' }));
      toast.success('Student photo removed');
      await loadStudents();
    } catch (err) {
      toastApiError(err, 'Could not remove image');
    } finally {
      setUploading(false);
    }
  }

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
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        address: {
          street: form.addressStreet,
          city: form.addressCity,
          state: form.addressState,
          pincode: form.addressPincode,
        },
        guardianName: form.guardianName,
        guardianPhone: form.guardianPhone,
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

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      return toast.info('No data matches the current filters to export.');
    }

    const data = filtered.map((r) => ({
      'Roll Number': r.rollNumber ?? r.roll ?? '—',
      Name: r.user?.name ?? r.name,
      Email: r.user?.email ?? r.email,
      Department: deptName(r),
      Semester: r.semester ?? '—',
      Section: r.section ?? '—',
      Status: r.status ?? '—',
      Batch: r.batch ?? r.year ?? '—',
      Phone: r.phone ?? '—',
      'Date of Birth': r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString() : '—',
      Gender: r.gender ?? '—',
      'Blood Group': r.bloodGroup ?? '—',
      Address: `${r.address?.street ?? ''}, ${r.address?.city ?? ''}, ${r.address?.state ?? ''} - ${r.address?.pincode ?? ''}`.replace(/^, |, $/g, '').trim() || '—',
      'Guardian Name': r.guardianName ?? '—',
      'Guardian Phone': r.guardianPhone ?? '—',
    }));

    try {
      exportToExcel(data, 'Student_List');
      toast.success('Student list exported to Excel');
    } catch (err) {
      toast.error('Failed to export data');
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      return toast.info('No data matches the current filters to export.');
    }

    const data = filtered.map((r) => ({
      'Roll Number': r.rollNumber ?? r.roll ?? '—',
      Name: r.user?.name ?? r.name,
      Email: r.user?.email ?? r.email,
      Department: deptName(r),
      Semester: r.semester ?? '—',
      Section: r.section ?? '—',
      Status: r.status ?? '—',
      Batch: r.batch ?? r.year ?? '—',
      Phone: r.phone ?? '—',
      'Date of Birth': r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString() : '—',
      Gender: r.gender ?? '—',
      'Blood Group': r.bloodGroup ?? '—',
      Address: `${r.address?.street ?? ''}, ${r.address?.city ?? ''}, ${r.address?.state ?? ''} - ${r.address?.pincode ?? ''}`.replace(/^, |, $/g, '').trim() || '—',
      'Guardian Name': r.guardianName ?? '—',
      'Guardian Phone': r.guardianPhone ?? '—',
    }));

    try {
      exportToCSV(data, 'Student_List');
      toast.success('Student list exported to CSV');
    } catch (err) {
      toast.error('Failed to export data');
      console.error(err);
    }
  };

  const columns = [
    {
      key: 'avatar',
      label: 'Photo',
      render: (v, row) => {
        const src = v || row.user?.avatar;
        return (
          <div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
            {src ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL || ''}${src}`}
                className="h-full w-full object-cover"
                alt=""
                onError={(e) => (e.target.style.display = 'none')}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-700 text-xs font-bold uppercase">
                {(row.name || '?').slice(0, 1)}
              </div>
            )}
          </div>
        );
      },
    },
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
            onClick={loadStudents}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 disabled:opacity-50"
            title="Refresh list"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filters</span>
          {q.trim() ? <FilterChip label={`Search: ${q.trim()}`} onClear={() => setQ('')} /> : null}
          {deptFilter ? (
            <FilterChip label={`Department: ${deptFilter}`} onClear={() => setDeptFilter('')} />
          ) : null}
          {semFilter ? <FilterChip label={`Semester: ${semFilter}`} onClear={() => setSemFilter('')} /> : null}
          {batchFilter ? <FilterChip label={`Batch: ${batchFilter}`} onClear={() => setBatchFilter('')} /> : null}
          {!hasFilters ? <span className="text-sm text-slate-500">None</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            <span className="font-semibold text-slate-900 tabular-nums">{filtered.length}</span> total
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-emerald-700 tabular-nums">{statusCounts.active}</span> active
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-700 tabular-nums">{statusCounts.inactive}</span> inactive
          </span>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              Clear all
            </button>
          ) : null}
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
          onRowClick={openEdit}
          onDelete={(row) => setDeleteTarget(row)}
          emptyMessage="No students match your filters."
          emptyState={
            <div className="mx-auto flex max-w-md flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
                <FiUser className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-900">No students found</p>
              <p className="text-sm text-slate-600">Try adjusting your search or filters.</p>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          }
        />
      )}

      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row">
        <p>
          Showing{' '}
          <span className="font-semibold text-slate-900 tabular-nums">
            {startRow}-{endRow}
          </span>{' '}
          of <span className="font-semibold text-slate-900 tabular-nums">{filtered.length}</span> results · Page{' '}
          <span className="font-semibold text-slate-900 tabular-nums">{pageSafe}</span> of{' '}
          <span className="font-semibold text-slate-900 tabular-nums">{totalPages}</span>
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
          {editId && (
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white ring-2 ring-slate-200 transition-all hover:ring-indigo-400">
                {form.avatar ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL || ''}${form.avatar}`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-2xl font-bold text-indigo-700">
                    {(form.name || '?').slice(0, 1)}
                  </div>
                )}
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  {uploading ? (
                    <FiLoader className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <FiCamera className="h-5 w-5 text-white" />
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploading}
                  />
                </label>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900">Student Photo</h4>
                <p className="text-xs text-slate-500">JPG, PNG or GIF. Max 2MB.</p>
                <div className="mt-2 flex gap-2">
                  <label className="cursor-pointer rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50">
                    {uploading ? 'Uploading...' : 'Change'}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploading}
                    />
                  </label>
                  {form.avatar && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={uploading}
                      className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-rose-600 shadow-sm ring-1 ring-inset ring-rose-200 hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

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

            <div className="sm:col-span-2">
              <hr className="my-2 border-slate-100" />
              <h3 className="mb-3 text-sm font-bold text-slate-900">Personal information</h3>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Phone</span>
              <div className="relative mt-1">
                <FiPhone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Date of birth</span>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Gender</span>
              <select
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Blood group</span>
              <select
                value={form.bloodGroup}
                onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </label>

            <div className="sm:col-span-2">
              <hr className="my-2 border-slate-100" />
              <h3 className="mb-3 text-sm font-bold text-slate-900">Address details</h3>
            </div>

            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-600">Street / Address line</span>
              <div className="relative mt-1">
                <FiMapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <textarea
                  rows={2}
                  value={form.addressStreet}
                  onChange={(e) => setForm((f) => ({ ...f, addressStreet: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">City</span>
              <input
                value={form.addressCity}
                onChange={(e) => setForm((f) => ({ ...f, addressCity: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">State</span>
              <input
                value={form.addressState}
                onChange={(e) => setForm((f) => ({ ...f, addressState: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Pincode</span>
              <input
                value={form.addressPincode}
                onChange={(e) => setForm((f) => ({ ...f, addressPincode: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </label>

            <div className="sm:col-span-2">
              <hr className="my-2 border-slate-100" />
              <h3 className="mb-3 text-sm font-bold text-slate-900">Guardian info</h3>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Guardian name</span>
              <input
                value={form.guardianName}
                onChange={(e) => setForm((f) => ({ ...f, guardianName: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Guardian phone</span>
              <input
                value={form.guardianPhone}
                onChange={(e) => setForm((f) => ({ ...f, guardianPhone: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </label>

            <div className="sm:col-span-2">
              <hr className="my-2 border-slate-100" />
              <h3 className="mb-3 text-sm font-bold text-slate-900">Academic & meta</h3>
            </div>

            <label className="block sm:col-span-1">
              <span className="text-xs font-semibold text-slate-600">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
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
