import { useEffect, useState } from 'react';
import { 
  FiFileText, FiPlus, FiClock, FiCheckCircle, FiXCircle, FiInfo, FiCalendar
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function LeaveApplication() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'sick',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leave');
      setLeaves(res.data);
    } catch (err) {
      toast.error('Failed to fetch leave history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leave', form);
      toast.success('Leave application submitted');
      setShowModal(false);
      setForm({ leaveType: 'sick', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-modal-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase text-balance truncate">Absence Registry</h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Formal leave applications and governance</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-premium transition hover:bg-brand-700 hover:scale-[1.02] active:scale-95"
        >
          <FiPlus className="h-4 w-4" /> Apply for Leave
        </button>
      </div>

      <div className="grid gap-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium dark:border-slate-800 dark:bg-slate-900">
           <table className="w-full text-left text-sm font-bold">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[10px] dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                          <FiCalendar className="text-slate-300" />
                          <span>{new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-widest text-slate-500">{leave.leaveType}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{leave.reason}</td>
                    <td className="px-6 py-4 text-center">
                       <StatusBadge status={leave.status} />
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                   <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-400 uppercase text-[10px] tracking-widest">No leave records registered</td>
                   </tr>
                )}
              </tbody>
           </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-6">File Application</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Leave Category</label>
                <select 
                  value={form.leaveType}
                  onChange={(e) => setForm({...form, leaveType: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500"
                  required
                >
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Start Date</label>
                  <input 
                    type="date" 
                    value={form.startDate}
                    onChange={(e) => setForm({...form, startDate: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">End Date</label>
                  <input 
                    type="date" 
                    value={form.endDate}
                    onChange={(e) => setForm({...form, endDate: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Justification</label>
                <textarea 
                  value={form.reason}
                  onChange={(e) => setForm({...form, reason: e.target.value})}
                  placeholder="Explain the purpose of your leave..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 min-h-[100px]"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-brand-600 text-white font-bold py-3.5 rounded-xl hover:bg-brand-700 transition-colors shadow-premium">Transmit Request</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
