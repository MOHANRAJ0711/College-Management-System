import { useEffect, useState } from 'react';
import { 
  FiUploadCloud, FiPlus, FiFileText, FiLink, FiBook, FiTrash2, FiInfo, FiLayers
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function MaterialUpload() {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    fileType: 'pdf',
    fileUrl: '',
    description: '',
    targetSemester: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        api.get('/lms/materials'),
        api.get('/hod/courses') // Using existing course endpoint
      ]);
      setMaterials(mRes.data);
      setCourses(cRes.data);
    } catch {
      toast.error('Failed to fetch learning materials');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lms/materials', form);
      toast.success('Material deployed to student portal');
      setShowModal(false);
      setForm({ title: '', subject: '', fileType: 'pdf', fileUrl: '', description: '', targetSemester: 1 });
      fetchData();
    } catch {
      toast.error('Deployment failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-modal-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase text-balance truncate">Content Forge</h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Digital asset distribution for courses and outcomes</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-premium transition hover:bg-brand-700 hover:scale-[1.02] active:scale-95"
        >
          <FiUploadCloud className="h-4 w-4" /> Deploy Material
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {materials.map((item) => (
          <div key={item._id} className="glass dark:glass-dark rounded-3xl p-6 shadow-premium transition-transform hover:scale-[1.02] border border-slate-200/60 dark:border-slate-800/60">
             <div className="mb-4 flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400 flex items-center justify-center">
                   {item.fileType === 'link' ? <FiLink /> : <FiFileText />}
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Sem {item.targetSemester}</span>
             </div>
             <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{item.title}</h3>
             <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-4">Subject: {item.subject?.name}</p>
             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[32px]">{item.description}</p>
             
             <div className="mt-6 flex items-center justify-between">
                <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-900 dark:text-white hover:underline flex items-center gap-1">
                  View Asset <FiLink className="h-3 w-3" />
                </a>
                <button className="text-slate-400 hover:text-rose-500 transition">
                  <FiTrash2 className="h-4 w-4" />
                </button>
             </div>
          </div>
        ))}
        {materials.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400">
             <FiLayers className="h-12 w-12 mx-auto mb-4 opacity-20" />
             <p className="text-sm font-bold uppercase tracking-widest">No assets deployed yet</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-modal-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-6">Asset Discovery</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Asset Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="form-input" required placeholder="e.g. Thermodynamics Lec-01" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Link to Course</label>
                <select value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className="form-input" required>
                  <option value="">Select Subject</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Format</label>
                  <select value={form.fileType} onChange={(e) => setForm({...form, fileType: e.target.value})} className="form-input">
                    <option value="pdf">PDF Doc</option>
                    <option value="ppt">Slides (PPT)</option>
                    <option value="link">Cloud Link</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Semester</label>
                  <input type="number" min="1" value={form.targetSemester} onChange={(e) => setForm({...form, targetSemester: Number(e.target.value)})} className="form-input" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Resource URL (Cloud Link)</label>
                <input type="url" value={form.fileUrl} onChange={(e) => setForm({...form, fileUrl: e.target.value})} className="form-input" required placeholder="https://drive.google.com/..." />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">LMS Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="form-input min-h-[80px]" placeholder="Briefly explain the contents..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-brand-600 text-white font-bold py-3.5 rounded-xl hover:bg-brand-700 transition-colors shadow-premium">Deploy Asset</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
