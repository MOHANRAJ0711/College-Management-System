import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiFilter,
  FiList,
  FiX,
} from 'react-icons/fi';
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

function deptName(row) {
  const d = row?.department ?? row?.departmentName;
  if (!d) return '';
  if (typeof d === 'string') return d;
  return d.name ?? d.title ?? '';
}

function StatusBadge({ status }) {
  const s = String(status ?? '—').toLowerCase();
  const map = {
    pending: 'bg-amber-100 text-amber-900 ring-amber-600/10',
    approved: 'bg-emerald-100 text-emerald-800 ring-emerald-600/10',
    rejected: 'bg-rose-100 text-rose-800 ring-rose-600/10',
    shortlisted: 'bg-indigo-100 text-indigo-800 ring-indigo-600/10',
  };
  const cls = map[s] ?? 'bg-slate-100 text-slate-700 ring-slate-600/10';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${cls}`}
    >
      {status ?? '—'}
    </span>
  );
}

export default function AdmissionControl() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [viewRow, setViewRow] = useState(null);
  const [decision, setDecision] = useState({ open: false, row: null, action: 'approve' });
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [meritDeptId, setMeritDeptId] = useState('');
  const [meritOpen, setMeritOpen] = useState(false);
  const [meritRows, setMeritRows] = useState([]);
  const [meritLoading, setMeritLoading] = useState(false);

  const loadDepartments = useCallback(async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(unwrapList({ data }));
    } catch {
      setDepartments([]);
    }
  }, []);

  const loadAdmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (deptFilter) params.departmentId = deptFilter;
      const { data } = await api.get('/admissions', { params });
      setRows(unwrapList({ data }));
    } catch (err) {
      toastApiError(err, 'Failed to load admissions');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, deptFilter]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadAdmissions();
  }, [loadAdmissions]);

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => String(r.status ?? '').toLowerCase() === 'pending').length;
    const approved = rows.filter((r) => String(r.status ?? '').toLowerCase() === 'approved').length;
    const rejected = rows.filter((r) => String(r.status ?? '').toLowerCase() === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter) {
      list = list.filter((r) => String(r.status ?? '').toLowerCase() === statusFilter.toLowerCase());
    }
    if (deptFilter) {
      list = list.filter((r) => String(r.departmentId ?? '') === String(deptFilter));
    }
    return list;
  }, [rows, statusFilter, deptFilter]);

  const openDecision = (row, action) => {
    setDecision({ open: true, row, action });
    setRemarks('');
  };

  const submitDecision = async () => {
    const rowId = decision.row?.id ?? decision.row?._id;
    if (!rowId) return;
    setSubmitting(true);
    try {
      const status = decision.action === 'approve' ? 'approved' : 'rejected';
      await api.put(`/admissions/${rowId}/status`, { status, remarks });
      toast.success(`Application ${status}`);
      setDecision({ open: false, row: null, action: 'approve' });
      await loadAdmissions();
    } catch (err) {
      toastApiError(err, 'Could not update status');
    } finally {
      setSubmitting(false);
    }
  };

  const generateMeritList = async () => {
    if (!meritDeptId) {
      toast.error('Select a department to generate merit list');
      return;
    }
    setMeritLoading(true);
    try {
      const { data } = await api.get(`/admissions/merit/${meritDeptId}`);
      const list = unwrapList({ data });
      setMeritRows(Array.isArray(list) ? list : Array.isArray(data) ? data : []);
      setMeritOpen(true);
      setMeritLoading(false);
    } catch (err) {
      toastApiError(err, 'Could not load merit list');
      setMeritLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admissions</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review applications, approve or reject with remarks, and generate merit lists
            {user?.name ? <span className="text-slate-500"> · {user.name}</span> : null}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="sm:w-56">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Merit list · department
            </span>
            <select
              value={meritDeptId}
              onChange={(e) => setMeritDeptId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/15"
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id ?? d.id} value={d._id ?? d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={generateMeritList}
            disabled={meritLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <FiList className="h-4 w-4" />
            {meritLoading ? 'Generating…' : 'Generate merit list'}
          </button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total applications', value: stats.total, tone: 'from-indigo-600 to-blue-500' },
          { label: 'Pending', value: stats.pending, tone: 'from-amber-500 to-orange-500' },
          { label: 'Approved', value: stats.approved, tone: 'from-emerald-500 to-teal-600' },
          { label: 'Rejected', value: stats.rejected, tone: 'from-rose-500 to-red-600' },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl bg-gradient-to-br ${s.tone} p-5 text-white shadow-lg`}
          >
            <p className="text-sm font-medium text-white/85">{s.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FiFilter className="h-4 w-4 text-indigo-600" />
          Filters
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/15"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
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
              {departments.map((d) => (
                <option key={d._id ?? d.id} value={d._id ?? d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <LoadingSpinner label="Loading applications…" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-800">
              <thead className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Application</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Name</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Department</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Merit</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-indigo-950">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      No applications match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <AdmissionRow
                      key={row._id ?? row.id}
                      row={row}
                      onView={() => setViewRow(row)}
                      onApprove={() => openDecision(row, 'approve')}
                      onReject={() => openDecision(row, 'reject')}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        title="Application details"
        size="lg"
      >
        {viewRow ? (
          <div className="space-y-3 text-sm">
            <DetailRow label="Application no." value={viewRow.applicationNo ?? viewRow.id} />
            <DetailRow label="Name" value={viewRow.name ?? viewRow.fullName} />
            <DetailRow label="Department" value={deptName(viewRow) || '—'} />
            <DetailRow label="Merit score" value={viewRow.meritScore ?? viewRow.score} />
            <DetailRow label="Status" value={<StatusBadge status={viewRow.status} />} />
            <DetailRow label="Email" value={viewRow.email} />
            <DetailRow label="Phone" value={viewRow.phone} />
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
              <p className="mt-1 text-slate-700">{viewRow.notes ?? viewRow.remarks ?? '—'}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={decision.open}
        onClose={() => !submitting && setDecision((d) => ({ ...d, open: false }))}
        title={decision.action === 'approve' ? 'Approve application' : 'Reject application'}
        size="md"
      >
        <p className="text-sm text-slate-600">
          Add optional remarks for{' '}
          <span className="font-semibold text-slate-900">
            {decision.row?.name ?? 'this applicant'}
          </span>
          .
        </p>
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-slate-600">Remarks</span>
          <textarea
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => setDecision((d) => ({ ...d, open: false }))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={submitDecision}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${
              decision.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {submitting ? 'Submitting…' : decision.action === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={meritOpen}
        onClose={() => setMeritOpen(false)}
        title="Merit list"
        size="lg"
      >
        {meritRows.length === 0 ? (
          <p className="text-sm text-slate-600">No records returned for this department.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Rank</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2">Application</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meritRows.map((r, idx) => (
                  <tr key={r.id ?? idx}>
                    <td className="py-2 pr-4 font-semibold tabular-nums">{r.rank ?? idx + 1}</td>
                    <td className="py-2 pr-4">{r.name ?? r.fullName}</td>
                    <td className="py-2 pr-4 tabular-nums">{r.meritScore ?? r.score ?? '—'}</td>
                    <td className="py-2 tabular-nums">{r.applicationNo ?? r.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-slate-900">{value ?? '—'}</span>
    </div>
  );
}

function AdmissionRow({ row, onView, onApprove, onReject }) {
  const [open, setOpen] = useState(false);
  const status = row.status;
  const pending = String(status ?? '').toLowerCase() === 'pending';

  return (
    <>
      <tr className="transition hover:bg-indigo-50/40 odd:bg-slate-50/50">
        <td className="px-4 py-3 font-mono text-xs text-slate-700">
          {row.applicationNo ?? row.id}
        </td>
        <td className="px-4 py-3 font-medium">{row.name ?? row.fullName}</td>
        <td className="px-4 py-3">{deptName(row) || '—'}</td>
        <td className="px-4 py-3 tabular-nums">{row.meritScore ?? row.score ?? '—'}</td>
        <td className="px-4 py-3">
          <StatusBadge status={status} />
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 sm:hidden"
            >
              {open ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            <button
              type="button"
              onClick={onView}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
            >
              <FiEye className="h-3.5 w-3.5" />
              View
            </button>
            <button
              type="button"
              disabled={!pending}
              onClick={onApprove}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-40"
            >
              <FiCheck className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              type="button"
              disabled={!pending}
              onClick={onReject}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-40"
            >
              <FiX className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        </td>
      </tr>
      {open ? (
        <tr className="sm:hidden">
          <td colSpan={6} className="bg-slate-50 px-4 py-3 text-xs text-slate-600">
            Quick view: merit {row.meritScore ?? row.score ?? '—'} ·{' '}
            <button type="button" className="font-semibold text-indigo-700" onClick={onView}>
              Open details
            </button>
          </td>
        </tr>
      ) : null}
    </>
  );
}
