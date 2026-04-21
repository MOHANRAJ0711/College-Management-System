import { useEffect, useState } from 'react';
import { 
  FiDollarSign, FiPlus, FiClock, FiCheckCircle, FiInfo, FiFileText, FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PayrollManagement() {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batchMonth, setBatchMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/all');
      setPayroll(res.data);
    } catch {
      toast.error('Failed to fetch payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      await api.post('/payroll/generate', { month: batchMonth });
      toast.success(`Payroll generated for ${batchMonth}`);
      fetchPayroll();
    } catch {
      toast.error('Generation failed');
    }
  };

  const handlePay = async (id) => {
    try {
      await api.patch(`/payroll/${id}/pay`);
      toast.success('Payment disbursed');
      fetchPayroll();
    } catch {
      toast.error('Disbursement failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-modal-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Finance Core</h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Institutional payroll orchestration and disbursements</p>
        </div>
        <div className="flex items-center gap-3">
           <input 
             type="month" 
             value={batchMonth}
             onChange={(e) => setBatchMonth(e.target.value)}
             className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white shadow-premium"
           />
           <button 
             onClick={handleGenerate}
             className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-premium transition hover:bg-brand-700"
           >
             <FiRefreshCw className="h-4 w-4" /> Generate Batch
           </button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium dark:border-slate-800 dark:bg-slate-900">
           <table className="w-full text-left text-sm font-bold">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[10px] dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Faculty</th>
                  <th className="px-6 py-4">Cycle</th>
                  <th className="px-6 py-4">Net Salary</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payroll.map((pay) => (
                  <tr key={pay._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xs">
                             <FiDollarSign className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-white truncate">{pay.faculty?.user?.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Educator Rank</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                       {pay.month}
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white">
                       ₹{pay.netPay.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                         pay.status === 'paid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                         'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                       }`}>
                         {pay.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       {pay.status !== 'paid' && (
                         <button 
                           onClick={() => handlePay(pay._id)}
                           className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-700 transition"
                         > Disburse Fund </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
