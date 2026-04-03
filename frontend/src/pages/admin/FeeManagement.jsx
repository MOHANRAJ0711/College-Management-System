import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiDollarSign,
  FiDownload,
  FiFilter,
  FiPlus,
  FiRefreshCw,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatsCard from '../../components/common/StatsCard';

function errMsg(e) {
  return e.response?.data?.message || e.message || 'Request failed';
}

function normalizeFees(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.fees)) return d.fees;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

function deptName(row) {
  const d = row?.department ?? row?.departmentName;
  if (!d) return '';
  if (typeof d === 'string') return d;
  return d.name ?? d.title ?? '';
}

export default function FeeManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState([]);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');
  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [form, setForm] = useState({
    feeType: 'Tuition',
    amount: '',
    dueDate: '',
  });

  const loadFees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fees');
      setFees(normalizeFees({ data }));
    } catch (e) {
      toast.error(errMsg(e));
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const { data } = await api.get('/fees/report');
      setReport(data?.report ?? data);
    } catch (e) {
      toast.error(errMsg(e));
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFees();
    loadReport();
  }, [loadFees, loadReport]);

  const departments = useMemo(() => {
    const s = new Set();
    fees.forEach((f) => {
      const d = f.department ?? f.student?.department ?? f.dept;
      if (d) s.add(String(d));
    });
    return [...s].sort();
  }, [fees]);

  const filteredFees = useMemo(() => {
    return fees.filter((f) => {
      const st = (f.status ?? f.paymentStatus ?? '').toString().toLowerCase();
      const dept = f.department ?? f.student?.department ?? f.dept ?? '';
      const sem = f.semester ?? f.student?.semester ?? f.sem ?? '';
      if (filterStatus && st !== filterStatus.toLowerCase()) return false;
      if (filterDept && String(dept) !== filterDept) return false;
      if (filterSem && String(sem) !== filterSem) return false;
      return true;
    });
  }, [fees, filterStatus, filterDept, filterSem]);

  const stats = useMemo(() => {
    const r = report || {};
    return {
      totalDue: r.totalDue ?? r.total_due ?? r.due,
      collected: r.totalCollected ?? r.collected ?? r.paid,
      pending: r.pending ?? r.totalPending,
      overdue: r.overdue ?? r.totalOverdue,
    };
  }, [report]);

  const searchStudents = async () => {
    if (!studentQuery.trim()) {
      toast.warn('Enter a name or roll number to search.');
      return;
    }
    try {
      const { data } = await api.get('/students', {
        params: { search: studentQuery.trim(), limit: 20 },
      });
      const list = Array.isArray(data) ? data : data?.students ?? data?.data ?? [];
      setStudentOptions(list);
      if (!list.length) toast.info('No students found.');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const toggleStudent = (id) => {
    const sid = String(id);
    setSelectedStudentIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!selectedStudentIds.length) {
      toast.warn('Select at least one student.');
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.warn('Enter a valid amount.');
      return;
    }
    if (!form.dueDate) {
      toast.warn('Pick a due date.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/fees', {
        studentIds: selectedStudentIds,
        feeType: form.feeType,
        amount,
        dueDate: form.dueDate,
      });
      toast.success('Fee entries created.');
      setModalOpen(false);
      setSelectedStudentIds([]);
      setStudentOptions([]);
      setStudentQuery('');
      setForm({ feeType: 'Tuition', amount: '', dueDate: '' });
      await loadFees();
      await loadReport();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (row) => {
    const id = row._id ?? row.id;
    if (!id) return;
    const st = (row.status ?? row.paymentStatus ?? '').toString().toLowerCase();
    if (st === 'paid') {
      toast.info('Already marked as paid.');
      return;
    }
    try {
      await api.put(`/fees/${id}`, { status: 'paid', paymentStatus: 'paid', paidAt: new Date().toISOString() });
      toast.success('Marked as paid.');
      await loadFees();
      await loadReport();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const columns = [
    {
      key: 'student',
      label: 'Student',
      render: (_, row) =>
        row.studentName ?? row.student?.name ?? row.rollNumber ?? row.student?.rollNumber ?? '—',
    },
    {
      key: 'feeType',
      label: 'Type',
      render: (v, row) => row.feeType ?? v ?? '—',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (v, row) => {
        const a = row.amount ?? v;
        return a != null ? `₹${Number(a).toLocaleString()}` : '—';
      },
    },
    {
      key: 'dueDate',
      label: 'Due',
      render: (v, row) => {
        const d = row.dueDate ?? v;
        return d ? new Date(d).toLocaleDateString() : '—';
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (v, row) => {
        const s = (row.status ?? row.paymentStatus ?? v ?? 'pending').toString();
        const low = s.toLowerCase();
        const cls =
          low === 'paid'
            ? 'bg-emerald-100 text-emerald-800'
            : low === 'overdue'
              ? 'bg-red-100 text-red-800'
              : 'bg-amber-100 text-amber-900';
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
            {s}
          </span>
        );
      },
    },
    {
      key: 'department',
      label: 'Department',
      render: (_, row) =>
        deptName({ ...row, department: row.department ?? row.student?.department }) || '—',
    },
    {
      key: 'semester',
      label: 'Sem',
      render: (_, row) => row.semester ?? row.student?.semester ?? '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const st = (row.status ?? row.paymentStatus ?? '').toString().toLowerCase();
        const paid = st === 'paid';
        return (
          <button
            type="button"
            disabled={paid}
            onClick={() => markPaid(row)}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <FiCheck className="h-3.5 w-3.5" />
            {paid ? 'Paid' : 'Mark paid'}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fee management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track dues, collections, and fee records
            {user?.name ? ` · ${user.name}` : ''}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              loadFees();
              loadReport();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <FiPlus className="h-4 w-4" />
            Create fee entries
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total due"
          value={
            stats.totalDue != null
              ? `₹${Number(stats.totalDue).toLocaleString()}`
              : reportLoading
                ? '…'
                : '—'
          }
          icon={FiDollarSign}
          color="indigo"
        />
        <StatsCard
          title="Total collected"
          value={
            stats.collected != null
              ? `₹${Number(stats.collected).toLocaleString()}`
              : reportLoading
                ? '…'
                : '—'
          }
          icon={FiCheck}
          color="green"
        />
        <StatsCard
          title="Pending"
          value={
            stats.pending != null
              ? `₹${Number(stats.pending).toLocaleString()}`
              : reportLoading
                ? '…'
                : '—'
          }
          icon={FiFilter}
          color="yellow"
        />
        <StatsCard
          title="Overdue"
          value={
            stats.overdue != null
              ? `₹${Number(stats.overdue).toLocaleString()}`
              : reportLoading
                ? '…'
                : '—'
          }
          icon={FiAlertCircle}
          color="red"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FiFilter className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Fee records</h2>
          </div>
          <p className="text-xs text-slate-500">
            Filters apply client-side; ensure API returns department & semester fields.
          </p>
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Department</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            >
              <option value="">All</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Semester</label>
            <select
              value={filterSem}
              onChange={(e) => setFilterSem(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            >
              <option value="">All</option>
              {['1', '2', '3', '4', '5', '6', '7', '8'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Loading fees…" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredFees.map((r, i) => ({ ...r, id: r._id ?? r.id ?? `fee-${i}` }))}
            loading={false}
            emptyMessage="No fee records match filters."
          />
        )}
        <p className="mt-2 text-xs text-slate-500">
          Use row actions to mark fees as paid when payment is received.
        </p>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Fee reports</h2>
            <p className="text-sm text-slate-600">
              Summary from <code className="rounded bg-slate-100 px-1">GET /api/fees/report</code>
            </p>
          </div>
          <a
            href="/api/fees/report"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            onClick={(e) => {
              e.preventDefault();
              loadReport();
              toast.info('Report refreshed from API.');
            }}
          >
            <FiDownload className="h-4 w-4" />
            Refresh report
          </a>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">Collection ratio</p>
            <p className="mt-2 text-2xl font-bold text-indigo-700">
              {stats.collected != null && stats.totalDue != null && Number(stats.totalDue) > 0
                ? `${((Number(stats.collected) / Number(stats.totalDue)) * 100).toFixed(1)}%`
                : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Collected / Total due (from report)</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">Outstanding pressure</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              {stats.pending != null ? `₹${Number(stats.pending).toLocaleString()}` : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Pending amount</p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title="Create fee entries"
        size="lg"
      >
        <form className="space-y-4" onSubmit={submitCreate}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-800">Find students</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Name or roll number"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={searchStudents}
                  className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Search
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">Fee type</label>
              <select
                value={form.feeType}
                onChange={(e) => setForm((f) => ({ ...f, feeType: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              >
                {['Tuition', 'Exam', 'Hostel', 'Transport', 'Library', 'Misc'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-800">Due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {studentOptions.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-slate-800">Select students</p>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                {studentOptions.map((s) => {
                  const id = String(s._id ?? s.id);
                  const checked = selectedStudentIds.includes(id);
                  return (
                    <label
                      key={id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudent(id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-800">
                        {s.name}{' '}
                        <span className="text-slate-500">({s.rollNumber ?? s.roll ?? id})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiCheck className="h-4 w-4" />}
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
