import { useEffect, useState } from 'react';
import { 
  FiCalendar, FiPlus, FiMapPin, FiClock, FiCheckCircle, FiInfo, FiTag, FiSearch
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CampusEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'seminar',
    venue: '',
    startDate: '',
    endDate: '',
    description: '',
    capacity: 100,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/lifecycle/event');
      setEvents(res.data);
    } catch (err) {
      toast.error('Failed to load campus events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lifecycle/event', form);
      toast.success('Event proposal submitted to registrar');
      setShowModal(false);
      setForm({ title: '', type: 'seminar', venue: '', startDate: '', endDate: '', description: '', capacity: 100 });
      fetchEvents();
    } catch (err) {
      toast.error('Proposal failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-modal-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Engagement Hub</h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Campus symposia, workshops, and venue orchestration</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-premium transition hover:bg-orange-700 hover:scale-[1.02] active:scale-95"
        >
          <FiCalendar className="h-4 w-4" /> Book Venue
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div key={event._id} className="glass dark:glass-dark rounded-3xl p-6 shadow-premium transition-transform hover:scale-[1.02] border border-slate-200/60 dark:border-slate-800/60">
             <div className="mb-4 flex items-center justify-between">
                <div className={`rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                  event.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                  event.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                }`}>
                   {event.status}
                </div>
                <FiTag className="text-slate-300" />
             </div>
             
             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 truncate">{event.title}</h3>
             
             <div className="space-y-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                   <FiMapPin className="text-brand-600" />
                   <span className="uppercase text-slate-700 dark:text-white">{event.venue}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                   <FiClock className="text-brand-600" />
                   <span>{new Date(event.startDate).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-brand-600 uppercase tracking-widest pt-2">
                   {event.type}
                </div>
             </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-20 text-center">
             <FiCalendar className="h-12 w-12 mx-auto text-slate-300 mb-4 opacity-20" />
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No scheduled engagements</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-in overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium-xl border border-slate-200 dark:border-slate-800 my-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-6">Venue Proposal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Event Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="form-input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Engagement Type</label>
                  <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="form-input">
                    <option value="seminar">Seminar</option>
                    <option value="workshop">Workshop</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Target Venue</label>
                   <input type="text" value={form.venue} onChange={(e) => setForm({...form, venue: e.target.value})} className="form-input" required placeholder="e.g. Auditorium A" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Commences</label>
                  <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} className="form-input" required />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Concludes</label>
                  <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} className="form-input" required />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Outcome Goals</label>
                <textarea 
                  value={form.description} 
                  onChange={(e) => setForm({...form, description: e.target.value})} 
                  placeholder="Describe the purpose and orchestration of the event..." 
                  className="form-input min-h-[100px]"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-orange-600 text-white font-black py-4 rounded-xl hover:bg-orange-700 transition-colors shadow-premium uppercase tracking-widest text-sm">Deploy Proposal</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
