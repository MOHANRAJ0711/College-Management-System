import { useEffect, useState } from 'react';
import { 
  FiCheck, FiX, FiInfo, FiUser, FiCalendar, FiMapPin, FiClock
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function EventApprovals() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/lifecycle/event');
      setEvents(res.data);
    } catch (err) {
      toast.error('Failed to load event proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await api.patch(`/lifecycle/event/${id}`, { status });
      toast.success(`Event ${status}`);
      fetchEvents();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-modal-in">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Venue Governance</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Review and orchestrate campus engagements and hall bookings</p>
      </div>

      <div className="grid gap-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium dark:border-slate-800 dark:bg-slate-900">
           <table className="w-full text-left text-sm font-bold">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[10px] dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">Event & Organizer</th>
                  <th className="px-6 py-4">Venue</th>
                  <th className="px-6 py-4">Schedule</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Sanction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                             <FiCalendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-slate-900 dark:text-white truncate uppercase tracking-tight">{event.title}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{event.organizerModel} ID: {event.organizer?._id.slice(-6)}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-black">
                         <FiMapPin className="text-orange-600" />
                         {event.venue}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                       <p className="text-slate-600 dark:text-slate-400">{new Date(event.startDate).toLocaleDateString()}</p>
                       <p className="text-[10px] text-slate-400">{new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                         event.status === 'approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                         event.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                         'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                       }`}>
                         {event.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleAction(event._id, 'approved')}
                            className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 transition"
                            title="Approve"
                          >
                             <FiCheck className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(event._id, 'rejected')}
                            className="bg-rose-500 text-white p-2 rounded-xl hover:bg-rose-600 transition"
                            title="Reject"
                          >
                             <FiX className="h-4 w-4" />
                          </button>
                       </div>
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
