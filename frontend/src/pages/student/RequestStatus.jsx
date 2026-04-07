import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import { FiCheckCircle, FiClock, FiPackage, FiXCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const statusConfig = {
  pending:    { label: 'Pending',    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',   icon: FiClock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',       icon: FiClock },
  ready:      { label: 'Ready',      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', icon: FiCheckCircle },
  delivered:  { label: 'Delivered',  color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',      icon: FiPackage },
  rejected:   { label: 'Rejected',   color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',       icon: FiXCircle },
};

const typeLabel = (t) => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const steps = ['pending', 'processing', 'ready', 'delivered'];

export default function RequestStatus() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/service-requests/my'); setRequests(data); }
    catch { setRequests([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Request Status</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Track your service requests</p>
        </div>
        <Link to="/student/service-request" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          + New Request
        </Link>
      </header>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-16">
          <FiPackage className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400">No requests submitted yet.</p>
          <Link to="/student/service-request" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Make a Request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const cfg = statusConfig[req.status] ?? statusConfig.pending;
            const StatusIcon = cfg.icon;
            const stepIndex = steps.indexOf(req.status);
            return (
              <div key={req._id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{typeLabel(req.type)}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Submitted {new Date(req.createdAt).toLocaleDateString()}
                      {req.urgency === 'urgent' && <span className="ml-2 rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold">URGENT</span>}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${cfg.color}`}>
                    <StatusIcon className="h-3 w-3" /> {cfg.label}
                  </span>
                </div>

                {/* Progress bar */}
                {req.status !== 'rejected' && (
                  <div className="mb-4">
                    <div className="flex justify-between">
                      {steps.map((s, i) => (
                        <div key={s} className="flex flex-col items-center gap-1" style={{ width: `${100 / steps.length}%` }}>
                          <div className={`h-2.5 w-2.5 rounded-full ${i <= stepIndex ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`} />
                          <span className={`text-[10px] font-medium capitalize ${i <= stepIndex ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`}>
                            {statusConfig[s]?.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="relative mt-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700 -mx-0">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${Math.max(0, (stepIndex / (steps.length - 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {req.purpose && <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-medium">Purpose:</span> {req.purpose}</p>}
                {req.adminNote && (
                  <div className="mt-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 text-xs text-indigo-800 dark:text-indigo-300">
                    <span className="font-semibold">Admin note:</span> {req.adminNote}
                  </div>
                )}
                {req.deliveryDate && (
                  <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    📅 Expected delivery: {new Date(req.deliveryDate).toLocaleDateString()}
                  </p>
                )}
                {req.documentUrl && (
<<<<<<< HEAD
                  <a href={req.documentUrl} target="_blank" rel="noreferrer"
=======
                  <a href={`http://localhost:5000${req.documentUrl}`} target="_blank" rel="noreferrer"
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
                    className="mt-3 inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100">
                    ⬇ Download Document
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
