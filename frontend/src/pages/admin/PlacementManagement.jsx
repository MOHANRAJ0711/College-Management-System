import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiBriefcase,
  FiRefreshCw,
  FiTrendingUp,
  FiUsers,
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

function normalizePlacements(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.placements)) return d.placements;
  if (Array.isArray(d?.drives)) return d.drives;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

export default function PlacementManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);

  const [form, setForm] = useState({
    company: '',
    jobRole: '',
    package: '',
    minCgpa: '',
    departments: '',
    batch: '',
    driveDate: '',
    lastDate: '',
  });
  const [saving, setSaving] = useState(false);

  const [applicantsModal, setApplicantsModal] = useState(null);
  const [applicantsLoading, setApplicantsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/placements');
      setDrives(normalizePlacements({ data }));
    } catch (e) {
      toast.error(errMsg(e));
      setDrives([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = drives.length;
    const open = drives.filter((d) => {
      const s = (d.status ?? '').toString().toLowerCase();
      return !s || s === 'open' || s === 'active';
    }).length;
    const offers = drives.reduce((acc, d) => acc + (d.offersCount ?? d.selected ?? 0), 0);
    return { total, open, offers };
  }, [drives]);

  const submitDrive = async (e) => {
    e.preventDefault();
    if (!form.company.trim() || !form.jobRole.trim()) {
      toast.warn('Company and job role are required.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/placements', {
        company: form.company,
        jobRole: form.jobRole,
        package: form.package,
        eligibility: {
          minCgpa: form.minCgpa ? Number(form.minCgpa) : undefined,
          departments: form.departments
            ? form.departments.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          batch: form.batch || undefined,
        },
        driveDate: form.driveDate || undefined,
        lastDate: form.lastDate || undefined,
        status: 'open',
      });
      toast.success('Placement drive created.');
      setForm({
        company: '',
        jobRole: '',
        package: '',
        minCgpa: '',
        departments: '',
        batch: '',
        driveDate: '',
        lastDate: '',
      });
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const openApplicants = async (row) => {
    const id = row._id ?? row.id;
    setApplicantsModal({ drive: row, applicants: row.applicants ?? [] });
    if (row.applicants?.length) return;
    setApplicantsLoading(true);
    try {
      const { data } = await api.get(`/placements/${id}`);
      const applicants = data?.applicants ?? data?.data?.applicants ?? [];
      setApplicantsModal({ drive: data ?? row, applicants });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setApplicantsLoading(false);
    }
  };

  const updateApplicant = async (studentId, status) => {
    const driveId = applicantsModal?.drive?._id ?? applicantsModal?.drive?.id;
    if (!driveId || !studentId) return;
    try {
      await api.put(`/placements/${driveId}/applicant/${studentId}`, { status });
      toast.success('Applicant updated.');
      const { data } = await api.get(`/placements/${driveId}`);
      const applicants = data?.applicants ?? data?.data?.applicants ?? [];
      setApplicantsModal({ drive: data ?? applicantsModal.drive, applicants });
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const columns = [
    { key: 'company', label: 'Company', render: (v, row) => row.company ?? v ?? '—' },
    { key: 'jobRole', label: 'Role', render: (v, row) => row.jobRole ?? row.role ?? v ?? '—' },
    {
      key: 'package',
      label: 'Package',
      render: (v, row) => row.package ?? row.ctc ?? v ?? '—',
    },
    {
      key: 'driveDate',
      label: 'Drive date',
      render: (v, row) => {
        const d = row.driveDate ?? v;
        return d ? new Date(d).toLocaleDateString() : '—';
      },
    },
    {
      key: 'lastDate',
      label: 'Apply by',
      render: (v, row) => {
        const d = row.lastDate ?? row.applicationDeadline ?? v;
        return d ? new Date(d).toLocaleDateString() : '—';
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (v, row) => {
        const s = (row.status ?? v ?? 'open').toString();
        const low = s.toLowerCase();
        const cls =
          low === 'closed'
            ? 'bg-slate-200 text-slate-800'
            : low === 'open' || low === 'active'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-indigo-100 text-indigo-800';
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
            {s}
          </span>
        );
      },
    },
    {
      key: 'applicants',
      label: 'Applicants',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => openApplicants(row)}
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <FiUsers className="h-3.5 w-3.5" />
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Placement management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create drives, track applicants, and monitor hiring outcomes
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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total drives" value={stats.total} icon={FiBriefcase} color="indigo" animate />
        <StatsCard title="Active / open" value={stats.open} icon={FiTrendingUp} color="green" animate />
        <StatsCard
          title="Offers (aggregated)"
          value={stats.offers != null ? stats.offers : '—'}
          icon={FiUsers}
          color="blue"
        />
      </div>

      <form
        onSubmit={submitDrive}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <FiBriefcase className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Create placement drive</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Company</label>
            <input
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Job role</label>
            <input
              value={form.jobRole}
              onChange={(e) => setForm((f) => ({ ...f, jobRole: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Package (LPA)</label>
            <input
              value={form.package}
              onChange={(e) => setForm((f) => ({ ...f, package: e.target.value }))}
              placeholder="e.g. 12 LPA"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Min CGPA</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={form.minCgpa}
              onChange={(e) => setForm((f) => ({ ...f, minCgpa: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Departments (comma separated)</label>
            <input
              value={form.departments}
              onChange={(e) => setForm((f) => ({ ...f, departments: e.target.value }))}
              placeholder="CSE, ECE"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Batch</label>
            <input
              value={form.batch}
              onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
              placeholder="2025"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Drive date</label>
            <input
              type="date"
              value={form.driveDate}
              onChange={(e) => setForm((f) => ({ ...f, driveDate: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Last date to apply</label>
            <input
              type="date"
              value={form.lastDate}
              onChange={(e) => setForm((f) => ({ ...f, lastDate: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiBriefcase className="h-4 w-4" />}
            Create drive
          </button>
        </div>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Placement drives</h2>
        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Loading drives…" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={drives.map((d, i) => ({ ...d, id: d._id ?? d.id ?? `p-${i}` }))}
            loading={false}
            emptyMessage="No placement drives yet."
          />
        )}
      </div>

      <Modal
        isOpen={Boolean(applicantsModal)}
        onClose={() => setApplicantsModal(null)}
        title="Applicants"
        size="lg"
      >
        {applicantsModal ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                {applicantsModal.drive.company} — {applicantsModal.drive.jobRole ?? applicantsModal.drive.role}
              </p>
              <p className="text-xs text-slate-500">
                Update statuses via{' '}
                <code className="rounded bg-white px-1">PUT /api/placements/:id/applicant/:studentId</code>
              </p>
            </div>
            {applicantsLoading ? (
              <LoadingSpinner label="Loading applicants…" />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-indigo-50 text-indigo-950">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Student</th>
                      <th className="px-3 py-2 font-semibold">Roll</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                      <th className="px-3 py-2 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(applicantsModal.applicants ?? []).length ? (
                      applicantsModal.applicants.map((a, idx) => {
                        const sid = String(a.studentId ?? a.student?._id ?? a.student?.id ?? a._id ?? idx);
                        const name = a.studentName ?? a.student?.name ?? a.name ?? '—';
                        const roll = a.rollNumber ?? a.student?.rollNumber ?? '—';
                        const st = (a.status ?? 'applied').toString();
                        return (
                          <tr key={sid} className="bg-white">
                            <td className="px-3 py-2">{name}</td>
                            <td className="px-3 py-2">{roll}</td>
                            <td className="px-3 py-2">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                                {st}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="inline-flex flex-wrap justify-end gap-1">
                                {['shortlisted', 'selected', 'rejected'].map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => updateApplicant(sid, s)}
                                    className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                          No applicants found for this drive.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
