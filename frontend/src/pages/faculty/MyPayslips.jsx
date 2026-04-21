import { useEffect, useState } from 'react';
import { 
  FiFileText, FiDownload, FiDollarSign, FiClock, FiCheckCircle, FiInfo
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function MyPayslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/my-payslips');
      setPayslips(res.data);
    } catch {
      toast.error('Failed to fetch payslips');
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = (slip) => {
    toast.info(`Downloading payslip for ${slip.month}...`);
    // Logic for PDF generation or download from server
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-modal-in">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase text-balance truncate">Salary Archive</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Institutional remuneration records and tax statements</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {payslips.map((slip) => (
          <div key={slip._id} className="glass dark:glass-dark rounded-3xl p-6 shadow-premium transition-transform hover:scale-[1.02] border border-slate-200/60 dark:border-slate-800/60">
             <div className="mb-6 flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center">
                   <FiFileText className="h-6 w-6" />
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Net Disbursed</p>
                   <p className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">₹{slip.netPay.toLocaleString()}</p>
                </div>
             </div>
             
             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Batch {slip.month}</h3>
             
             <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs font-bold">
                   <span className="text-slate-400 uppercase tracking-tighter">Status</span>
                   <span className="text-emerald-600 uppercase tracking-widest">{slip.status}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                   <span className="text-slate-400 uppercase tracking-tighter">Settled On</span>
                   <span className="text-slate-700 dark:text-slate-300">{new Date(slip.paymentDate).toLocaleDateString()}</span>
                </div>
             </div>

             <button 
               onClick={() => downloadPayslip(slip)}
               className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold py-3 rounded-2xl hover:opacity-90 transition shadow-premium"
             >
                <FiDownload className="h-4 w-4" /> Download Statement
             </button>
          </div>
        ))}

        {payslips.length === 0 && (
          <div className="col-span-full py-20 text-center">
             <FiInfo className="h-12 w-12 mx-auto text-slate-300 mb-4" />
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No settled records found</p>
          </div>
        )}
      </div>
    </div>
  );
}
