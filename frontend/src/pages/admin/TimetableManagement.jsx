import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiCalendar,
  FiClock,
  FiEdit2,
  FiGrid,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function errMsg(e) {
  return e.response?.data?.message || e.message || 'Request failed';
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function normalizeEntries(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.timetables)) return d.timetables;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

function deptName(row) {
  const d = row?.department ?? row?.departmentName;
  if (!d) return '';
  if (typeof d === 'string') return d;
  return d.name ?? d.title ?? '';
}

export default function TimetableManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);

  const [meta, setMeta] = useState({
    department: '',
    semester: '',
    section: 'A',
    day: 'Monday',
  });
  const [periods, setPeriods] = useState([
    { timeSlot: '09:00 - 10:00', course: '', faculty: '', room: '' },
  ]);

  const [editModal, setEditModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/timetable');
      setEntries(normalizeEntries({ data }));
    } catch (e) {
      toast.error(errMsg(e));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addPeriod = () => {
    setPeriods((p) => [...p, { timeSlot: '', course: '', faculty: '', room: '' }]);
  };

  const updatePeriod = (index, field, value) => {
    setPeriods((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removePeriod = (index) => {
    setPeriods((prev) => prev.filter((_, i) => i !== index));
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!meta.department || !meta.semester || !meta.section || !meta.day) {
      toast.warn('Fill department, semester, section, and day.');
      return;
    }
    const clean = periods.filter((p) => p.timeSlot && (p.course || p.faculty || p.room));
    if (!clean.length) {
      toast.warn('Add at least one period with a time slot.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/timetable', {
        ...meta,
        semester: Number(meta.semester) || meta.semester,
        periods: clean,
      });
      toast.success('Timetable saved.');
      setPeriods([{ timeSlot: '09:00 - 10:00', course: '', faculty: '', room: '' }]);
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (row) => {
    const id = row._id ?? row.id;
    if (!id) return;
    if (!window.confirm('Delete this timetable block?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      toast.success('Deleted.');
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const openEdit = (row) => {
    setEditModal({
      id: row._id ?? row.id,
      department: deptName(row),
      semester: String(row.semester ?? ''),
      section: row.section ?? 'A',
      day: row.day ?? 'Monday',
      timeSlot: row.timeSlot ?? row.slot ?? '',
      course: row.course ?? row.courseName ?? '',
      faculty: row.faculty ?? row.facultyName ?? '',
      room: row.room ?? row.roomNo ?? '',
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editModal?.id) return;
    setSaving(true);
    try {
      await api.put(`/timetable/${editModal.id}`, {
        department: editModal.department,
        semester: Number(editModal.semester) || editModal.semester,
        section: editModal.section,
        day: editModal.day,
        timeSlot: editModal.timeSlot,
        course: editModal.course,
        faculty: editModal.faculty,
        room: editModal.room,
      });
      toast.success('Updated.');
      setEditModal(null);
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const gridByDay = useMemo(() => {
    const map = {};
    DAYS.forEach((d) => {
      map[d] = [];
    });
    entries.forEach((row) => {
      const day = row.day ?? row.weekday;
      if (day && map[day]) map[day].push(row);
      else if (day && !map[day]) {
        map[day] = [row];
      }
    });
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => String(a.timeSlot ?? a.slot).localeCompare(String(b.timeSlot ?? b.slot)));
    });
    return map;
  }, [entries]);

  const daysToShow = useMemo(() => {
    const keys = Object.keys(gridByDay);
    return keys.length ? keys.sort() : DAYS;
  }, [gridByDay]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Timetable management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Build weekly schedules with periods, courses, faculty, and rooms
            {user?.name ? ` · ${user.name}` : ''}.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <FiRefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <form
        onSubmit={submitCreate}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <FiCalendar className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Create timetable</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Department</label>
            <input
              value={meta.department}
              onChange={(e) => setMeta((m) => ({ ...m, department: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              placeholder="e.g. CSE"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Semester</label>
            <input
              value={meta.semester}
              onChange={(e) => setMeta((m) => ({ ...m, semester: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              placeholder="e.g. 4"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Section</label>
            <input
              value={meta.section}
              onChange={(e) => setMeta((m) => ({ ...m, section: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              placeholder="A / B"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Day</label>
            <select
              value={meta.day}
              onChange={(e) => setMeta((m) => ({ ...m, day: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FiClock className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Periods</h3>
            </div>
            <button
              type="button"
              onClick={addPeriod}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
            >
              <FiPlus className="h-4 w-4" />
              Add period
            </button>
          </div>
          {periods.map((p, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-5"
            >
              <input
                placeholder="Time slot (e.g. 10:00 - 11:00)"
                value={p.timeSlot}
                onChange={(e) => updatePeriod(idx, 'timeSlot', e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <input
                placeholder="Course"
                value={p.course}
                onChange={(e) => updatePeriod(idx, 'course', e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <input
                placeholder="Faculty"
                value={p.faculty}
                onChange={(e) => updatePeriod(idx, 'faculty', e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <input
                placeholder="Room"
                value={p.room}
                onChange={(e) => updatePeriod(idx, 'room', e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => removePeriod(idx)}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  aria-label="Remove period"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiPlus className="h-4 w-4" />}
            Save timetable
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <FiGrid className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Existing timetables (grid)</h2>
        </div>
        {loading ? (
          <div className="py-16">
            <LoadingSpinner label="Loading timetables…" />
          </div>
        ) : (
          <div className="space-y-6 overflow-x-auto">
            {daysToShow.map((day) => (
              <div key={day} className="min-w-[640px]">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-indigo-800">
                  {day}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(gridByDay[day] ?? []).length ? (
                    (gridByDay[day] ?? []).map((row, i) => (
                      <div
                        key={row._id ?? row.id ?? `${day}-${i}`}
                        className="rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40 p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-indigo-700">
                              {row.timeSlot ?? row.slot ?? 'Slot'}
                            </p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {row.course ?? row.courseName ?? 'Course'}
                            </p>
                            <p className="text-sm text-slate-600">
                              {row.faculty ?? row.facultyName ?? 'Faculty'}
                            </p>
                            <p className="text-sm text-slate-500">
                              Room {row.room ?? row.roomNo ?? '—'}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                              {deptName(row) || 'Dept'} · Sem {row.semester ?? '—'} · Sec{' '}
                              {row.section ?? '—'}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="rounded-lg p-2 text-indigo-700 hover:bg-indigo-100"
                              aria-label="Edit"
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteEntry(row)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              aria-label="Delete"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No entries for {day}.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(editModal)}
        onClose={() => !saving && setEditModal(null)}
        title="Edit timetable entry"
        size="lg"
      >
        {editModal ? (
          <form className="space-y-3" onSubmit={saveEdit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Department</label>
                <input
                  value={editModal.department}
                  onChange={(e) => setEditModal((m) => ({ ...m, department: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Semester</label>
                <input
                  value={editModal.semester}
                  onChange={(e) => setEditModal((m) => ({ ...m, semester: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Section</label>
                <input
                  value={editModal.section}
                  onChange={(e) => setEditModal((m) => ({ ...m, section: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Day</label>
                <select
                  value={editModal.day}
                  onChange={(e) => setEditModal((m) => ({ ...m, day: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Time slot</label>
                <input
                  value={editModal.timeSlot}
                  onChange={(e) => setEditModal((m) => ({ ...m, timeSlot: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Course</label>
                <input
                  value={editModal.course}
                  onChange={(e) => setEditModal((m) => ({ ...m, course: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Faculty</label>
                <input
                  value={editModal.faculty}
                  onChange={(e) => setEditModal((m) => ({ ...m, faculty: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Room</label>
                <input
                  value={editModal.room}
                  onChange={(e) => setEditModal((m) => ({ ...m, room: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiEdit2 className="h-4 w-4" />}
                Save changes
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
