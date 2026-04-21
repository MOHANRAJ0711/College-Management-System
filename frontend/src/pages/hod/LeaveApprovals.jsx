import { useEffect, useState, useCallback } from 'react';
import { 
  FiCheck, FiX, FiInfo, FiUser, FiCalendar, FiFileText
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLeaves = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const endpoint = user.isHOD ? '/leave/department' : '/leave/all';
      const res = await api.get(endpoint);
      setLeaves(res.data);
    } catch {
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleAction = async (id, status) => {
    try {
      await api.patch(`/leave/${id}`, { status });
      toast.success(`Leave ${status.replace('-', ' ')}`);
      fetchLeaves();
    } catch {
      toast.error('Action failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-modal-in">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Governance Console</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Review and orchestrate faculty leave requests</p>
      </div>

      <div className="grid gap-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium dark:border-slate-800 dark:bg-slate-900">
           <table className="w-full text-left text-sm font-bold">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[10px] dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Faculty</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4 text-right">Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-black text-xs">
                             {(leave.faculty?.user?.name || '?').slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-white truncate">{leave.faculty?.user?.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{leave.leaveType}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                       <p className="text-slate-600 dark:text-slate-400">{new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{leave.reason}</td>
                    <td className="px-6 py-4">
                       <StatusBadge status={leave.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleAction(leave._id, user.isHOD ? 'hod-approved' : 'admin-approved')}
                            className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 transition shadow-brand-500/10"
                            title="Approve"
                          >
                             <FiCheck className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(leave._id, 'rejected')}
                            className="bg-rose-500 text-white p-2 rounded-xl hover:bg-rose-600 transition shadow-rose-500/10"
                            title="Reject"
                          >
                             <FiX className="h-4 w-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                   <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400 uppercase text-[10px] tracking-widest">No pending decisions</td>
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
      pending: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
      'hod-approved': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
      'admin-approved': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
      rejected: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
    };
    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>
        {status.replace('-', ' ')}
      </span>
    );
}
