import { useEffect, useState } from 'react';
import { FiBriefcase, FiCalendar, FiCheck, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { apiError, formatCurrency, formatDate } from './utils';

const TABS = [
  { id: 'drives', label: 'Available drives' },
  { id: 'mine', label: 'My applications' },
];

function normalizeDrives(res) {
  const list = res?.data ?? res;
  const arr = Array.isArray(list) ? list : list?.placements ?? [];
  return arr.map((d, i) => ({
    id: d.id ?? d._id ?? i,
    company: d.company ?? d.companyName ?? 'Company',
    role: d.role ?? d.title ?? 'Role',
    package: d.package ?? d.ctc ?? d.salary,
    lastDate: d.lastDate ?? d.deadline ?? d.applyBy,
    eligibility: d.eligibility ?? d.criteria ?? 'As per institute policy',
    eligible: d.eligible !== false,
  }));
}

function normalizeApps(res) {
  const list = res?.data ?? res;
  const arr = Array.isArray(list) ? list : list?.applications ?? [];
  return arr.map((a, i) => ({
    id: a.id ?? a._id ?? i,
    company: a.company ?? a.companyName ?? 'Company',
    role: a.role ?? 'Role',
    status: a.status ?? 'Applied',
    appliedAt: a.appliedAt ?? a.createdAt,
  }));
}

function statusColor(s) {
  const x = String(s).toLowerCase();
  if (x.includes('shortlist') || x.includes('select')) return 'bg-emerald-100 text-emerald-900';
  if (x.includes('reject')) return 'bg-red-100 text-red-800';
  if (x.includes('pending') || x.includes('applied')) return 'bg-amber-100 text-amber-900';
  return 'bg-slate-100 text-slate-800';
}

export default function Placements() {
  const [tab, setTab] = useState('drives');
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [apps, setApps] = useState([]);
  const [applying, setApplying] = useState(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [dRes, aRes] = await Promise.all([
        api.get('/placements'),
        api.get('/placements/student-applications'),
      ]);
      setDrives(normalizeDrives(dRes.data));
      setApps(normalizeApps(aRes.data));
    } catch (e) {
      toast.error(apiError(e));
      setDrives([]);
      setApps([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function apply(id) {
    setApplying(id);
    try {
      await api.post(`/placements/${id}/apply`);
      toast.success('Application submitted');
      await loadAll();
    } catch (e) {
      toast.error(apiError(e, 'Could not apply'));
    } finally {
      setApplying(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading placements…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Placements
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Explore drives and track your applications.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
              tab === t.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'drives' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {drives.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center text-slate-500">
              No open placement drives right now.
            </div>
          ) : (
            drives.map((d) => (
              <article
                key={d.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <FiBriefcase className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-slate-900">{d.company}</h2>
                    <p className="text-sm font-medium text-indigo-700">{d.role}</p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Package</dt>
                    <dd className="font-semibold text-slate-900">
                      {d.package != null && d.package !== ''
                        ? typeof d.package === 'number'
                          ? formatCurrency(d.package)
                          : String(d.package)
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1 text-slate-500">
                      <FiCalendar className="h-4 w-4" /> Last date
                    </dt>
                    <dd className="font-medium text-slate-800">{formatDate(d.lastDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Eligibility</dt>
                    <dd className="mt-1 text-slate-700">{d.eligibility}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={!d.eligible || applying === d.id}
                    onClick={() => apply(d.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {applying === d.id ? (
                      'Applying…'
                    ) : (
                      <>
                        <FiSend className="h-4 w-4" />
                        Apply
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Company</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Role</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                      You haven&apos;t applied to any drives yet.
                    </td>
                  </tr>
                ) : (
                  apps.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">{a.company}</td>
                      <td className="px-4 py-3 text-slate-700">{a.role}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(a.status)}`}
                        >
                          <FiCheck className="h-3 w-3 opacity-70" />
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(a.appliedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
