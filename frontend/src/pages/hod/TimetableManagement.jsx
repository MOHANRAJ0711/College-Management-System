import React, { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import { FiCalendar, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

function toastApiError(err, fallback) {
  const msg = err.response?.data?.message ?? err.message;
  toast.error(typeof msg === 'string' && msg.trim() ? msg : fallback);
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PERIOD_SLOTS = [
  { periodNumber: 1, startTime: '09:30 AM', endTime: '10:15 AM' },
  { periodNumber: 2, startTime: '10:15 AM', endTime: '11:00 AM' },
  { periodNumber: 3, startTime: '11:15 AM', endTime: '12:00 PM' },
  { periodNumber: 4, startTime: '12:00 PM', endTime: '12:45 PM' },
  { periodNumber: 5, startTime: '01:25 PM', endTime: '02:10 PM' },
  { periodNumber: 6, startTime: '02:10 PM', endTime: '02:55 PM' },
  { periodNumber: 7, startTime: '03:10 PM', endTime: '03:55 PM' },
  { periodNumber: 8, startTime: '03:55 PM', endTime: '04:40 PM' },
];

function unwrapList(res) {
  const d = res?.data?.data ?? res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.rows)) return d.rows;
  return [];
}

const emptyForm = {
  semester: '1',
  section: 'A',
  day: 'Monday',
  academicYear: new Date().getFullYear().toString(),
  periods: PERIOD_SLOTS.map(s => ({
    ...s,
    course: '',
    faculty: '',
    room: ''
  }))
};

export default function HODTimetableManagement() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semFilter, setSemFilter] = useState('');
  
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (semFilter) params.semester = semFilter;
    try {
      const { data } = await api.get('/timetable', { params });
      setEntries(unwrapList({ data }));
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [semFilter]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  useEffect(() => {
    Promise.all([api.get('/courses'), api.get('/faculty')])
      .then(([cRes, fRes]) => {
        setCourses(unwrapList(cRes));
        setFaculties(unwrapList(fRes));
      })
      .catch(console.error);
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row._id ?? row.id);
    
    // Merge existing periods with structural slots
    const mergedPeriods = PERIOD_SLOTS.map(slot => {
      const existing = (row.periods || []).find(p => p.periodNumber === slot.periodNumber);
      return {
        ...slot,
        course: existing?.course?._id ?? existing?.course ?? '',
        faculty: existing?.faculty?._id ?? existing?.faculty ?? '',
        room: existing?.room ?? ''
      };
    });

    setForm({
      semester: row.semester ? String(row.semester) : '1',
      section: row.section || 'A',
      day: row.day || 'Monday',
      academicYear: row.academicYear || new Date().getFullYear().toString(),
      periods: mergedPeriods
    });
    setModalOpen(true);
  };

  const setPeriodField = (index, field, value) => {
    setForm(f => {
      const newPeriods = [...f.periods];
      newPeriods[index] = { ...newPeriods[index], [field]: value };
      return { ...f, periods: newPeriods };
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const activePeriods = form.periods.filter(p => p.course).map(p => ({
        periodNumber: p.periodNumber,
        startTime: p.startTime,
        endTime: p.endTime,
        course: p.course,
        faculty: p.faculty || undefined,
        room: p.room || undefined
      }));

      const payload = {
        semester: Number(form.semester),
        section: form.section,
        day: form.day,
        academicYear: form.academicYear || undefined,
        periods: activePeriods
      };

      if (editId) {
        await api.put(`/timetable/${editId}`, payload);
        toast.success('Timetable updated');
      } else {
        await api.post('/timetable', payload);
        toast.success('Timetable scheduled');
      }
      setModalOpen(false);
      await loadTimetable();
    } catch (err) {
      toastApiError(err, 'Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/timetable/${deleteTarget._id ?? deleteTarget.id}`);
      toast.success('Timetable schedule block removed');
      setDeleteTarget(null);
      await loadTimetable();
    } catch (err) {
      toastApiError(err, 'Could not delete timetable');
    } finally {
      setDeleting(false);
    }
  };

  const grouped = useMemo(() => {
    return DAYS.reduce((acc, day) => {
      acc[day] = entries.filter(e => e.day?.toLowerCase() === day.toLowerCase());
      return acc;
    }, {});
  }, [entries]);

  const getPeriodData = (day, pNum) => {
    const dayEntry = grouped[day]?.[0]; 
    if (!dayEntry) return null;
    return (dayEntry.periods || []).find(p => p.periodNumber === pNum);
  };

  return (
    <div className="mx-auto max-w-[95%] space-y-6 pb-20 print:m-0 print:max-w-full">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase tracking-tighter">Weekly Time Table</h1>
          <div className="mt-2 flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-indigo-500"></div> Schedule Optimizer</span>
            <span className="hidden sm:block">·</span>
            <span className="hidden sm:block">Department Management System</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={semFilter} onChange={e => setSemFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/15">
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
          </select>
          <button onClick={() => window.print()} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50">
            Print Table
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:translate-y-0">
            <FiPlus className="h-4 w-4" /> Add Day Block
          </button>
        </div>
      </header>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .mx-auto { margin: 0 !important; max-width: 100% !important; border: none !important; }
          .rounded-3xl { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
          table { width: 100% !important; font-size: 10pt !important; border-collapse: collapse !important; border: 1px solid #e2e8f0 !important; }
          th, td { border: 1px solid #e2e8f0 !important; }
          .sticky { position: static !important; }
          tbody tr { break-inside: avoid; }
        }
      ` }} />
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-3xl border-2 border-dashed border-slate-100 bg-white/50">
          <LoadingSpinner label="Compiling weekly matrix..." />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-100 bg-white dark:bg-slate-800/50 text-slate-400">
          <FiCalendar className="h-12 w-12 opacity-20" />
          <div className="text-center">
            <p className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Grid Empty</p>
            <p className="text-xs text-slate-400 mt-1 uppercase">No schedule data available for this selection</p>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden hover:shadow-indigo-500/5 transition-shadow">
          <div className="w-full">
            <table className="w-full border-collapse text-left table-fixed">
              <thead>
                <tr className="bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800">
                  <th className="py-4 px-2 w-[80px] font-black uppercase tracking-tighter text-[10px] text-center sticky left-0 z-20 bg-slate-900 dark:bg-slate-950 border-r border-slate-800">Day</th>
                  {PERIOD_SLOTS.map((slot, idx) => (
                    <React.Fragment key={idx}>
                      {idx === 2 && <th className="w-[20px] py-4 bg-slate-800/50 text-[8px] font-black uppercase text-slate-500 text-center border-x border-slate-800">S.B</th>}
                      {idx === 4 && <th className="w-[20px] py-4 bg-slate-800/80 text-[8px] font-black uppercase text-slate-400 text-center border-x border-slate-800">L</th>}
                      {idx === 6 && <th className="w-[20px] py-4 bg-slate-800/50 text-[8px] font-black uppercase text-slate-500 text-center border-x border-slate-800">S.B</th>}
                      <th className="py-4 px-1 text-center border-x border-slate-800 group relative">
                        <div className="text-indigo-400 font-extrabold text-[10px] mb-0.5">P{slot.periodNumber}</div>
                        <div className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter tabular-nums leading-none">{slot.startTime.split(' ')[0]}<br/>{slot.endTime.split(' ')[0]}</div>
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {DAYS.map((day, dayIdx) => {
                  const dayEntry = grouped[day]?.[0];
                  return (
                    <tr key={day} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-6 px-6 font-bold text-slate-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-slate-900 shadow-[2px_0_10px_rgba(0,0,0,0.02)] border-r border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="uppercase text-xs tracking-widest">{day}</span>
                          {dayEntry && (
                            <div className="flex gap-1 group-hover:opacity-100 opacity-0 transition-opacity ml-4">
                              <button onClick={() => openEdit(dayEntry)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><FiEdit2 className="w-3 h-3" /></button>
                              <button onClick={() => setDeleteTarget(dayEntry)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"><FiTrash2 className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      </td>
                      {PERIOD_SLOTS.map((slot, pIdx) => {
                        const pData = getPeriodData(day, slot.periodNumber);
                        
                        return (
                          <React.Fragment key={pIdx}>
                            {pIdx === 2 && <td className="bg-slate-50/30 dark:bg-slate-800/10 border-x border-slate-50 dark:border-slate-800 italic"></td>}
                            {pIdx === 4 && <td className="bg-slate-50/50 dark:bg-slate-800/20 border-x border-slate-100 dark:border-slate-800"></td>}
                            {pIdx === 6 && <td className="bg-slate-50/30 dark:bg-slate-800/10 border-x border-slate-50 dark:border-slate-800 italic"></td>}
                            <td className={`py-4 px-3 text-center border-x border-slate-50 dark:border-slate-800 ${pData ? 'relative' : 'opacity-20'}`}>
                              {pData ? (
                                <div className="space-y-1 group">
                                  <div className="text-[11px] font-black text-slate-900 dark:text-white truncate leading-snug px-1" title={pData.course?.name}>{pData.course?.name ?? '—'}</div>
                                  <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter truncate">{pData.faculty?.user?.name ?? '—'}</div>
                                  {pData.room && (
                                    <div className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest">{pData.room}</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[10px] font-mono text-slate-300 dark:text-slate-700 select-none">—</div>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             <div className="flex gap-4">
               <span>P1-P8: Academic Periods</span>
               <span>HOD Verified</span>
             </div>
             <div>Semester {semFilter || 'All'} · Academic Schedule Grid</div>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} title={editId ? 'Edit Schedule Block' : 'Add Schedule Block'} size="4xl">
        <form onSubmit={onSubmit} className="flex flex-col max-h-[80vh]">
          
          <div className="shrink-0 grid grid-cols-3 gap-3 mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-slate-100">
            <label>
              <span className="text-xs font-semibold text-slate-600">Day</span>
              <select required value={form.day} onChange={e => setForm(f => ({...f, day: e.target.value}))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-500/15">
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold text-slate-600">Semester</span>
              <select required value={form.semester} onChange={e => setForm(f => ({...f, semester: e.target.value}))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-500/15">
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold text-slate-600">Section</span>
              <input required value={form.section} onChange={e => setForm(f => ({...f, section: e.target.value}))} placeholder="A, B, C..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-500/15" />
            </label>
          </div>

          <div className="overflow-y-auto min-h-[400px] flex-1 pr-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
               {form.periods.map((p, idx) => {
                 const isBreak1 = idx === 2; // after period 2
                 const isLunch = idx === 4;  // after period 4
                 const isBreak2 = idx === 6; // after period 6
                 
                 return (
                   <div key={idx} className="contents">
                     {isBreak1 && <div className="col-span-full text-center py-2 text-[10px] font-bold font-mono tracking-widest text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl my-1">11:00 AM - 11:15 AM — SHORT BREAK</div>}
                     {isLunch && <div className="col-span-full text-center py-3 text-[10px] font-bold font-mono tracking-widest text-slate-500 bg-indigo-50/30 border border-dashed border-indigo-100 rounded-xl my-1">12:45 PM - 01:25 PM — LUNCH BREAK</div>}
                     {isBreak2 && <div className="col-span-full text-center py-2 text-[10px] font-bold font-mono tracking-widest text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl my-1">02:55 PM - 03:10 PM — SHORT BREAK</div>}
                     
                     <div className={`relative group flex flex-col p-4 rounded-2xl border transition-all duration-200 ${p.course ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-50/50 border-slate-100'}`}>
                       <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2">
                           <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold ${p.course ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                             P{p.periodNumber}
                           </span>
                           <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                             {p.startTime} - {p.endTime}
                           </span>
                         </div>
                         {p.course && (
                           <button type="button" onClick={() => setPeriodField(idx, 'course', '')} className="text-[10px] font-bold text-rose-500 hover:text-rose-600">
                             Clear
                           </button>
                         )}
                       </div>

                       <div className="space-y-3">
                         <label className="block">
                           <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Subject</span>
                           <select 
                             value={p.course} 
                             onChange={e => setPeriodField(idx, 'course', e.target.value)}
                             className="mt-1 w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-500/15"
                           >
                             <option value="">-- Select Subject --</option>
                             {courses.map(c => <option key={c._id ?? c.id} value={c._id ?? c.id}>{c.name} ({c.code})</option>)}
                           </select>
                         </label>

                         <label className="block">
                           <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Faculty</span>
                           <select 
                             value={p.faculty} 
                             onChange={e => setPeriodField(idx, 'faculty', e.target.value)} 
                             disabled={!p.course}
                             className="mt-1 w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-500/15 disabled:opacity-50 disabled:bg-slate-50"
                           >
                             <option value="">-- Optional: Assign Faculty --</option>
                             {faculties.map(fac => (
                               <option key={fac._id ?? fac.id} value={fac._id ?? fac.id}>
                                 {fac.user?.name ?? fac.name} {fac.designation ? `(${fac.designation})` : ''}
                               </option>
                             ))}
                           </select>
                         </label>

                         <label className="block pt-1">
                           <div className="flex items-center gap-2 px-1">
                             <div className="h-px flex-1 bg-slate-100"></div>
                             <span className="text-[9px] font-bold text-slate-300 uppercase">Location</span>
                             <div className="h-px flex-1 bg-slate-100"></div>
                           </div>
                           <input 
                             value={p.room} 
                             onChange={e => setPeriodField(idx, 'room', e.target.value)} 
                             placeholder="Room Number / Lab" 
                             disabled={!p.course}
                             className="mt-2 w-full text-center rounded-lg border border-transparent bg-slate-50 px-3 py-1 text-xs outline-none focus:border-indigo-200 focus:bg-white disabled:opacity-30" 
                           />
                         </label>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>

          <div className="shrink-0 flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
            <button type="button" disabled={saving} onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
               {saving ? 'Saving...' : editId ? 'Verify & Update' : 'Publish Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} title="Delete Schedule Block?" size="sm">
        <p className="text-sm text-slate-600">Are you sure you want to remove the timetable for <span className="font-semibold text-slate-900">{deleteTarget?.day}</span> (Sem {deleteTarget?.semester} {deleteTarget?.section})?</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Cancel</button>
          <button type="button" disabled={deleting} onClick={confirmDelete} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">{deleting ? 'Deleting...' : 'Delete'}</button>
        </div>
      </Modal>
    </div>
  );
}
