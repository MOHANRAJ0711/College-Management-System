import { useEffect, useState, useCallback } from 'react';
import { 
  FiHome, FiCheckCircle, FiClock, FiInfo, FiMapPin, FiCreditCard
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export default function StudentHostel() {
  const [hostels, setHostels] = useState([]);
  const [myAllocation, setMyAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [messPreference, setMessPreference] = useState('veg');
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [hRes, aRes] = await Promise.all([
        api.get('/hostel'),
        api.get('/hostel/allocations')
      ]);
      setHostels(hRes.data);
      const studentId = user?.id || user?._id;
      const current = aRes.data.find(a => a.student?.user?._id === studentId || a.student?._id === studentId);
      setMyAllocation(current);
    } catch {
      toast.error('Failed to fetch hostel data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hostel/allocations', {
        hostel: selectedHostel,
        messPreference
      });
      toast.success('Room request submitted to warden');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-modal-in">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase text-center">Accommodation Portal</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 text-center">Request and manage your residential status</p>
      </div>

      {myAllocation ? (
        <div className="glass dark:glass-dark rounded-3xl p-8 shadow-premium-lg border border-slate-200 dark:border-slate-800">
           <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-32 w-32 rounded-3xl bg-brand-600 flex items-center justify-center text-white shadow-brand-500/30">
                <FiHome className="h-16 w-16" />
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <label className="text-[10px] font-black uppercase text-brand-600 tracking-widest block mb-1">Status: {myAllocation.status}</label>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {myAllocation.hostel?.name} 
                    {myAllocation.room && ` — Room ${myAllocation.room.roomNumber}`}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <DetailItem label="Mess Type" value={myAllocation.messPreference} icon={FiCheckCircle} />
                  <DetailItem label="Payment" value={myAllocation.feeStatus} icon={FiCreditCard} />
                  <DetailItem label="Requested On" value={new Date(myAllocation.allocationDate).toLocaleDateString()} icon={FiClock} />
                </div>
              </div>
           </div>
           
           {myAllocation.status === 'requested' && (
             <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl flex items-center gap-3">
                <FiClock className="h-5 w-5 text-amber-600" />
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Your request is currently awaiting warden approval. You will be notified once a room is assigned.</p>
             </div>
           )}
        </div>
      ) : (
        <form onSubmit={handleRequest} className="glass dark:glass-dark rounded-3xl p-8 shadow-premium-lg border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Primary Hostel Choice</label>
              <select 
                value={selectedHostel} 
                onChange={(e) => setSelectedHostel(e.target.value)}
                className="form-input"
                required
              >
                <option value="">Choose a hostel</option>
                {hostels.map(h => <option key={h._id} value={h._id}>{h.name} ({h.type})</option>)}
              </select>
            </div>
            <div>
               <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Catering Preference</label>
               <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setMessPreference('veg')}
                    className={`p-3 rounded-xl text-xs font-bold transition-all border ${messPreference === 'veg' ? 'bg-brand-600 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}
                  >VEGETARIAN</button>
                  <button 
                    type="button" 
                    onClick={() => setMessPreference('non-veg')}
                    className={`p-3 rounded-xl text-xs font-bold transition-all border ${messPreference === 'non-veg' ? 'bg-brand-600 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}
                  >NON-VEG</button>
               </div>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-start gap-3">
            <FiInfo className="h-5 w-5 text-brand-600 mt-1" />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              By submitting this request, you agree to the institution's residential policies. 
              Allocations are subject to availability and administrative approval.
            </p>
          </div>

          <button type="submit" className="w-full bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-700 transition-all shadow-premium uppercase tracking-widest text-sm">
            Submit Residency Request
          </button>
        </form>
      )}
    </div>
  );
}

function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate">{value}</p>
    </div>
  );
}
