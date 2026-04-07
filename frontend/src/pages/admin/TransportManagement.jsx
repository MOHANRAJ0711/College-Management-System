import { useEffect, useState } from 'react';
import { 
  FiTruck, FiPlus, FiMapPin, FiUsers, FiDollarSign, FiClock, FiTrash2, FiEdit3, FiInfo
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function TransportManagement() {
  const [routes, setRoutes] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('routes'); // routes, subscriptions
  
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeForm, setRouteForm] = useState({
    routeName: '',
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    capacity: 40,
    fee: 5000,
    stops: [{ name: '', time: '' }]
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        api.get('/transport'),
        api.get('/transport/subscriptions')
      ]);
      setRoutes(rRes.data);
      setSubscriptions(sRes.data);
    } catch (err) {
      toast.error('Failed to fetch transport data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transport', routeForm);
      toast.success('Transport route established');
      setShowRouteModal(false);
      setRouteForm({
        routeName: '', vehicleNumber: '', driverName: '', driverPhone: '',
        capacity: 40, fee: 5000, stops: [{ name: '', time: '' }]
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding route');
    }
  };

  const handleAddStop = () => {
    setRouteForm({...routeForm, stops: [...routeForm.stops, { name: '', time: '' }]});
  };

  const handleStopChange = (index, field, value) => {
    const newStops = [...routeForm.stops];
    newStops[index][field] = value;
    setRouteForm({...routeForm, stops: newStops});
  };

  const updateSubStatus = async (id, status) => {
    try {
      await api.patch(`/transport/subscriptions/${id}`, { status });
      toast.success('Subscription updated');
      fetchData();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-modal-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Fleet Console</h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Manage transport logistics, routes, and subscriptions</p>
        </div>
        <button 
          onClick={() => setShowRouteModal(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-premium transition hover:bg-brand-700"
        >
          <FiPlus className="h-4 w-4" /> New Route
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'routes', label: 'Bus Routes', icon: FiTruck },
          { id: 'subscriptions', label: 'Subscriptions', icon: FiUsers },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6">
        {activeTab === 'routes' && (
          <div className="grid gap-6 sm:grid-cols-2">
            {routes.map((route) => (
              <div key={route._id} className="glass dark:glass-dark rounded-3xl p-6 shadow-premium transition-transform hover:scale-[1.01]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    <FiTruck className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Vehicle</p>
                    <p className="font-bold text-sm text-slate-900 dark:text-white uppercase">{route.vehicleNumber}</p>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{route.routeName}</h3>
                <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5"><FiMapPin className="h-3 w-3" /> {route.stops?.length || 0} Stops</span>
                  <span className="flex items-center gap-1.5"><FiDollarSign className="h-3 w-3" /> ₹{route.fee}/sem</span>
                  <span className="flex items-center gap-1.5"><FiUsers className="h-3 w-3" /> Cap: {route.capacity}</span>
                </div>
                
                <div className="mt-6 space-y-3">
                   {route.stops?.slice(0, 3).map((stop, idx) => (
                     <div key={idx} className="flex items-center gap-3 text-xs">
                        <div className="h-2 w-2 rounded-full bg-brand-500 shadow-brand-500/50" />
                        <span className="flex-1 text-slate-600 dark:text-slate-400">{stop.name}</span>
                        <span className="text-slate-400 font-bold tracking-tighter">{stop.time}</span>
                     </div>
                   ))}
                   {route.stops?.length > 3 && <p className="text-[10px] text-brand-500 font-bold uppercase pl-5">+{route.stops.length - 3} more stops</p>}
                </div>
              </div>
            ))}
            {routes.length === 0 && <EmptyState label="No fleet routes defined" />}
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm font-bold">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[10px] dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Pickup Point</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subscriptions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-slate-900 dark:text-white">{sub.student?.rollNumber}</td>
                    <td className="px-6 py-4">{sub.route?.routeName}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{sub.stop}</td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase font-black ${
                        sub.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => updateSubStatus(sub._id, sub.status === 'active' ? 'inactive' : 'active')} className="text-xs text-brand-600 hover:underline">Toggle Active</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium-xl border border-slate-200 dark:border-slate-800 my-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-6">New Link Path</h2>
            <form onSubmit={handleAddRoute} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Route Name</label>
                  <input type="text" value={routeForm.routeName} onChange={(e) => setRouteForm({...routeForm, routeName: e.target.value})} className="form-input" required />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Vehicle Plate</label>
                  <input type="text" value={routeForm.vehicleNumber} onChange={(e) => setRouteForm({...routeForm, vehicleNumber: e.target.value})} className="form-input" required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Driver Name</label>
                  <input type="text" value={routeForm.driverName} onChange={(e) => setRouteForm({...routeForm, driverName: e.target.value})} className="form-input" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Phone</label>
                  <input type="text" value={routeForm.driverPhone} onChange={(e) => setRouteForm({...routeForm, driverPhone: e.target.value})} className="form-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Capacity</label>
                  <input type="number" value={routeForm.capacity} onChange={(e) => setRouteForm({...routeForm, capacity: Number(e.target.value)})} className="form-input" required />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Fee (₹)</label>
                  <input type="number" value={routeForm.fee} onChange={(e) => setRouteForm({...routeForm, fee: Number(e.target.value)})} className="form-input" required />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-400">Waypoints (Stops)</label>
                  <button type="button" onClick={handleAddStop} className="text-[10px] font-bold text-brand-600 transition hover:scale-105">+ ADD STOP</button>
                </div>
                {routeForm.stops.map((stop, i) => (
                  <div key={i} className="flex gap-2 animate-modal-in">
                    <input placeholder="Stop name" value={stop.name} onChange={(e) => handleStopChange(i, 'name', e.target.value)} className="form-input" required />
                    <input type="time" value={stop.time} onChange={(e) => handleStopChange(i, 'time', e.target.value)} className="form-input w-32" required />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-6">
                <button type="submit" className="flex-1 bg-brand-600 text-white font-bold py-3.5 rounded-xl hover:bg-brand-700 transition-colors shadow-premium">Save New Route</button>
                <button type="button" onClick={() => setShowRouteModal(false)} className="px-6 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-400">
      <FiInfo className="h-12 w-12 mb-4 opacity-10" />
      <p className="font-bold text-sm tracking-widest uppercase">{label}</p>
    </div>
  );
}
