import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiBookOpen, FiUser } from 'react-icons/fi';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function HODFacultyManagement() {
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState({ open: false, facultyId: null, name: '' });
  const [selectedCourse, setSelectedCourse] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/hod/faculty'), api.get('/hod/courses')])
      .then(([fRes, cRes]) => { setFaculty(fRes.data); setCourses(cRes.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openAssign = (f) => {
    setAssignModal({ open: true, facultyId: f._id, name: f.user?.name ?? 'Faculty' });
    setSelectedCourse('');
  };

  const assignSubject = async () => {
    if (!selectedCourse) { toast.error('Select a course'); return; }
    setSaving(true);
    try {
      await api.post('/hod/assign-subject', { facultyId: assignModal.facultyId, courseId: selectedCourse });
      toast.success('Subject assigned successfully');
      setAssignModal({ open: false, facultyId: null, name: '' });
      const fRes = await api.get('/hod/faculty');
      setFaculty(fRes.data);
    } catch (err) { toast.error(err.response?.data?.message ?? 'Failed'); }
    finally { setSaving(false); }
  };

  const desigColor = { HOD: 'bg-violet-100 text-violet-800', Professor: 'bg-indigo-100 text-indigo-800', 'Associate Professor': 'bg-blue-100 text-blue-800', 'Assistant Professor': 'bg-sky-100 text-sky-800', Lecturer: 'bg-cyan-100 text-cyan-800' };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Faculty Management</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">View and manage faculty in your department</p>
      </header>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>
      ) : faculty.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-slate-400"><FiUser className="h-8 w-8 opacity-30" /><p>No faculty found in your department</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {faculty.map(f => (
            <div key={f._id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 font-bold text-sm">
                  {(f.user?.name ?? 'F').slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{f.user?.name ?? '—'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{f.user?.email ?? '—'}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${desigColor[f.designation] ?? 'bg-slate-100 text-slate-600'}`}>{f.designation ?? '—'}</span>
              </div>
              <div className="mb-3 flex flex-wrap gap-1">
                {f.subjects?.map(s => (
                  <span key={s._id} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 text-xs text-indigo-700 dark:text-indigo-300">
                    <FiBookOpen className="h-3 w-3" />{s.code}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${f.user?.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {f.user?.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => openAssign(f)}
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100">
                  <FiBookOpen className="h-3 w-3" /> Assign Subject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={assignModal.open} onClose={() => setAssignModal({ open: false, facultyId: null, name: '' })} title={`Assign Subject to ${assignModal.name}`} size="sm">
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select Course</span>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400">
              <option value="">Choose course</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.code} — {c.name}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAssignModal({ open: false, facultyId: null, name: '' })} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
            <button onClick={assignSubject} disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
