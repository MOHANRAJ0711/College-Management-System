import { useEffect, useState } from 'react';
import { 
  FiStar, FiUsers, FiLock, FiCheckCircle, FiInfo, FiLayers
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function FacultyFeedback() {
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [targetFaculty, setTargetFaculty] = useState(null);
  
  const [form, setForm] = useState({
    faculty: '',
    subject: '',
    ratings: {
      teaching: 5,
      punctuality: 5,
      delivery: 5,
      support: 5,
    },
    comment: '',
    semester: 1,
    academicYear: '2025-26',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, cRes] = await Promise.all([
        api.get('/admin/faculty'),
        api.get('/hod/courses')
      ]);
      setFaculties(fRes.data);
      setCourses(cRes.data);
    } catch {
      toast.error('Failed to load faculty directory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lms/feedback', form);
      toast.success('Feedback recorded anonymously');
      setShowModal(false);
      setForm({
        faculty: '', subject: '', comment: '', semester: 1, academicYear: '2025-26',
        ratings: { teaching: 5, punctuality: 5, delivery: 5, support: 5 }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Feedback entry failed');
    }
  };

  const handleRating = (key, value) => {
    setForm({ ...form, ratings: { ...form.ratings, [key]: value } });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-modal-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase text-balance truncate">Voice Portal</h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Anonymous academic quality reviews and outcome analytics</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
           <FiLock className="h-4 w-4 text-indigo-600" />
           <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-widest">Privacy Secured</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {faculties.map((fac) => (
          <div key={fac._id} className="glass dark:glass-dark rounded-3xl p-6 shadow-premium transition-transform hover:scale-[1.02] border border-slate-200/60 dark:border-slate-800/60 flex flex-col justify-between">
             <div>
                <div className="h-20 w-20 rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center font-black text-2xl mb-6 shadow-xl">
                   {fac.user?.name.slice(0, 1)}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{fac.user?.name}</h3>
                <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-1 mb-4">{fac.department?.name || 'Faculty Member'}</p>
             </div>
             
             <button 
               onClick={() => { setForm({...form, faculty: fac._id}); setShowModal(true); setTargetFaculty(fac); }}
               className="w-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold py-3.5 rounded-2xl hover:opacity-90 transition shadow-premium flex items-center justify-center gap-2"
             >
                <FiStar className="h-4 w-4" /> Evaluate Outcome
             </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-in overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium-xl border border-slate-200 dark:border-slate-800 my-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-2">Outcome Review</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Evaluating Prof. {targetFaculty?.user?.name}</p>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Relevant Course</label>
                  <select value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className="form-input" required>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Semester</label>
                   <input type="number" min="1" value={form.semester} onChange={(e) => setForm({...form, semester: Number(e.target.value)})} className="form-input" required />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                 <RatingInput label="Teaching Methodology" value={form.ratings.teaching} onChange={(v) => handleRating('teaching', v)} />
                 <RatingInput label="Punctuality & Presence" value={form.ratings.punctuality} onChange={(v) => handleRating('punctuality', v)} />
                 <RatingInput label="Delivery Precision" value={form.ratings.delivery} onChange={(v) => handleRating('delivery', v)} />
                 <RatingInput label="Support & Guidance" value={form.ratings.support} onChange={(v) => handleRating('support', v)} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Written Constructive Feedback</label>
                <textarea 
                  value={form.comment} 
                  onChange={(e) => setForm({...form, comment: e.target.value})} 
                  placeholder="Your views contribute to institutional excellence..." 
                  className="form-input min-h-[100px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-700 transition-colors shadow-premium uppercase tracking-widest text-sm">Transmit Securely</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RatingInput({ label, value, onChange }) {
   return (
     <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 block leading-none">{label}</label>
        <div className="flex gap-1.5">
           {[1, 2, 3, 4, 5].map((s) => (
             <button 
               key={s} 
               type="button" 
               onClick={() => onChange(s)}
               className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                 s <= value ? 'bg-brand-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300 dark:bg-slate-800'
               }`}
             >
                <FiStar className={`h-4 w-4 ${s <= value ? 'fill-white' : ''}`} />
             </button>
           ))}
        </div>
     </div>
   );
}
