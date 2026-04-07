import { useEffect, useState } from 'react';
import { 
  FiBookOpen, FiDownload, FiLink, FiFileText, FiClock, FiSearch, FiFilter, FiLayers
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SubjectMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/lms/materials');
      setMaterials(res.data);
    } catch (err) {
      toast.error('Failed to access library resources');
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.subject?.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-modal-in">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Vault Access</h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Institutional knowledge base and curated study assets</p>
        </div>
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Search by subject or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 shadow-premium"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.map((item) => (
          <div key={item._id} className="group glass dark:glass-dark rounded-3xl p-6 shadow-premium transition-all hover:shadow-brand-500/10 border border-slate-200/60 dark:border-slate-800/60">
             <div className="mb-6 flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                   {item.fileType === 'link' ? <FiLink className="h-5 w-5" /> : <FiBookOpen className="h-5 w-5" />}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-brand-600 tracking-widest leading-none">Sem {item.targetSemester}</p>
                </div>
             </div>
             
             <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1 group-hover:text-brand-600 transition-colors">{item.title}</h3>
             <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 truncate">{item.subject?.name}</p>
             
             <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                   <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {(item.faculty?.user?.name || '?').slice(0, 1)}
                   </div>
                   <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Curated by Prof. {item.faculty?.user?.name}</span>
                </div>
                
                <a 
                  href={item.fileUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-3 rounded-2xl hover:bg-brand-700 transition shadow-premium"
                >
                  <FiDownload className="h-4 w-4" /> Download Asset
                </a>
             </div>
          </div>
        ))}

        {filteredMaterials.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400">
             <FiLayers className="h-12 w-12 mx-auto mb-4 opacity-10" />
             <p className="text-sm font-bold uppercase tracking-widest">No matching assets in the vault</p>
          </div>
        )}
      </div>
    </div>
  );
}
