import { useEffect, useState } from 'react';
import { 
  FiTruck, FiMapPin, FiClock, FiDollarSign, FiCheckCircle, FiInfo
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function StudentTransport() {
  const [routes, setRoutes] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedStop, setSelectedStop] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        api.get('/transport'),
        api.get('/transport/subscriptions')
      ]);
      setRoutes(rRes.data);
      const studentId = JSON.parse(localStorage.getItem('user'))?.id;
      const current = sRes.data.find(s => s.student?.user?._id === studentId);
      setMySubscription(current);
    } catch (err) {
      toast.error('Failed to fetch transport data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transport/subscriptions', {
        route: selectedRoute,
        stop: selectedStop
      });
      toast.success('Transport subscription active');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    }
  };

  const activeRoute = routes.find(r => r._id === selectedRoute);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-modal-in">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase text-center">Fleet Enrollment</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 text-center">Campus transit and route management</p>
      </div>

      {mySubscription ? (
        <div className="glass dark:glass-dark rounded-3xl p-8 shadow-premium-lg border border-slate-200 dark:border-slate-800">
           <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-32 w-32 rounded-3xl bg-violet-600 flex items-center justify-center text-white shadow-violet-500/30">
                <FiTruck className="h-16 w-16" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                   <label className="text-[10px] font-black uppercase text-violet-600 tracking-widest block mb-1">Active Route</label>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{mySubscription.route?.routeName}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                   <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <FiMapPin className="h-3 w-3" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Pickup Point</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">{mySubscription.stop}</p>
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <FiClock className="h-3 w-3" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Status</span>
                      </div>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase">{mySubscription.status}</p>
                   </div>
                </div>
              </div>
           </div>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="glass dark:glass-dark rounded-3xl p-8 shadow-premium-lg border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Select Bus Route</label>
              <select 
                value={selectedRoute} 
                onChange={(e) => { setSelectedRoute(e.target.value); setSelectedStop(''); }}
                className="form-input"
                required
              >
                <option value="">Select a route</option>
                {routes.map(r => <option key={r._id} value={r._id}>{r.routeName} (₹{r.fee})</option>)}
              </select>
            </div>
            {selectedRoute && (
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Select Pickup Point</label>
                <select 
                  value={selectedStop} 
                  onChange={(e) => setSelectedStop(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select stop</option>
                  {activeRoute?.stops.map((s, i) => <option key={i} value={s.name}>{s.name} at {s.time}</option>)}
                </select>
              </div>
            )}
          </div>

          {selectedRoute && (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 animate-modal-in">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <FiInfo className="h-5 w-5 text-brand-600" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Route Summary</span>
                  </div>
                  <span className="text-xl font-black text-brand-600 tracking-tighter">₹{activeRoute.fee}/Year</span>
               </div>
               <p className="mt-4 text-xs font-bold text-slate-500 uppercase leading-loose">
                 Vehicle: {activeRoute.vehicleNumber} <br />
                 Driver: {activeRoute.driverName} <br />
                 Capacity: {activeRoute.capacity} Passengers
               </p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={!selectedStop}
            className="w-full bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-700 transition-all shadow-premium uppercase tracking-widest text-sm disabled:opacity-50"
          >
            Enroll in Transport Fleet
          </button>
        </form>
      )}
    </div>
  );
}
