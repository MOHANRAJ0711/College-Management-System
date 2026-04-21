import { useEffect, useState } from 'react';
import { 
  FiAward, FiPlus, FiClock, FiCheckCircle, FiInfo, FiFileText, FiSend
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export default function ScholarshipPortal() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const [form, setForm] = useState({
    schemeName: '',
    type: 'government',
    amount: 0,
    remarks: '',
  });

  useEffect(() => {
    fetchApplications();
  // eslint-disable-next-line
  }, [user]);

  const fetchApplications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/lifecycle/scholarship');
      // Filter for current student is handled on backend or here
      const studentId = user?.id || user?._id;
      const myApps = res.data.filter(s => s.student?.user?._id === studentId || s.student?._id === studentId);
      setScholarships(myApps);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lifecycle/scholarship', form);
      toast.success('Scholarship application transmitted');
      setShowModal(false);
      setForm({ schemeName: '', type: 'government', amount: 0, remarks: '' });
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-modal-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Endowment Portal</h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Institutional schemes and scholarship tracking</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-premium transition hover:bg-indigo-700 hover:scale-[1.02] active:scale-95"
        >
          <FiPlus className="h-4 w-4" /> Apply for Scheme
        </button>
      </div>

      <div className="grid gap-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium dark:border-slate-800 dark:bg-slate-900">
           <table className="w-full text-left text-sm font-bold">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[10px] dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Scheme Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Quantum (₹)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Applied On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {scholarships.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <FiAward className="text-indigo-600 h-4 w-4" />
                          <span className="text-slate-900 dark:text-white truncate">{app.schemeName}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-widest text-slate-500">{app.type}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white">
                       ₹{app.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                       <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 text-xs">
                       {new Date(app.applicationDate).toLocaleDateString()}
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

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-6">Scheme Application</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Scheme/Provider Name</label>
                <input type="text" value={form.schemeName} onChange={(e) => setForm({...form, schemeName: e.target.value})} className="form-input" required placeholder="e.g. National Merit Scholarship" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Scheme Type</label>
                  <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="form-input">
                    <option value="government">Government</option>
                    <option value="institutional">Institutional</option>
                    <option value="private">Private NGO</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Grant Amount (₹)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: Number(e.target.value)})} className="form-input" required />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Justification/Remarks</label>
                <textarea 
                  value={form.remarks} 
                  onChange={(e) => setForm({...form, remarks: e.target.value})} 
                  placeholder="Birefly explain your eligibility..." 
                  className="form-input min-h-[100px]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-premium uppercase tracking-widest text-sm">Transmist Application</button>
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
