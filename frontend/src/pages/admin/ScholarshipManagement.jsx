import { useEffect, useState } from 'react';
import { 
  FiAward, FiCheck, FiX, FiInfo, FiUser, FiDollarSign, FiClock
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ScholarshipManagement() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      const res = await api.get('/lifecycle/scholarship');
      setScholarships(res.data);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await api.patch(`/lifecycle/scholarship/${id}`, { status });
      toast.success(`Application ${status}`);
      fetchScholarships();
    } catch {
      toast.error('Action failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-modal-in">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Endowment Control</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Institutional schemes, grants, and applicant governance</p>
      </div>

      <div className="grid gap-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium dark:border-slate-800 dark:bg-slate-900">
           <table className="w-full text-left text-sm font-bold">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[10px] dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4">Scheme</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {scholarships.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs">
                             <FiUser className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-white truncate">{app.student?.user?.name || 'Academic Scholar'}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{app.student?.rollNumber}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 uppercase text-[10px] font-black tracking-widest text-slate-600 dark:text-slate-400 truncate max-w-xs">{app.schemeName}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white">₹{app.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                       <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleAction(app._id, 'approved')}
                            className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 transition shadow-brand-500/10"
                            title="Approve"
                          >
                             <FiCheck className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(app._id, 'rejected')}
                            className="bg-rose-500 text-white p-2 rounded-xl hover:bg-rose-600 transition shadow-rose-500/10"
                            title="Reject"
                          >
                             <FiX className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(app._id, 'disbursed')}
                            className="bg-brand-600 text-white p-2 rounded-xl hover:bg-brand-700 transition"
                            title="Disburse"
                          >
                             <FiDollarSign className="h-4 w-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
                {scholarships.length === 0 && (
                   <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400 uppercase text-[10px] tracking-widest">No active applications found</td>
                   </tr>
                )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
    const styles = {
      applied: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
      'submitted-to-govt': 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
      approved: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
      rejected: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
      disbursed: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    };
    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>
        {status.replace(/-/g, ' ')}
      </span>
    );
}
