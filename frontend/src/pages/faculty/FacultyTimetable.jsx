import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiClock, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function refId(x) {
  if (!x) return null;
  if (typeof x === 'object' && x._id) return x._id;
  return x;
}

function formatCourse(course) {
  if (!course) return '—';
  if (typeof course === 'object' && course.name) {
    return course.code ? `${course.name} (${course.code})` : course.name;
  }
  return '—';
}

export default function FacultyTimetable() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [facultyId, setFacultyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: me } = await api.get('/auth/me');
      const fp = me?.facultyProfile;
      const dept = refId(fp?.department);
      const fid = refId(fp?._id);
      setFacultyId(fid ? String(fid) : null);

      if (!dept) {
        setRows([]);
        toast.error('Department not set on your profile');
        return;
      }

      const { data } = await api.get('/timetable', {
        params: { department: dept },
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load timetable');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const map = Object.fromEntries(DAYS.map((d) => [d, []]));
    if (!facultyId) return map;

    rows.forEach((row) => {
      const day = row.day;
      if (!day || !map[day]) return;
      (row.periods || []).forEach((p) => {
        const pf = p.faculty;
        const pid = pf && typeof pf === 'object' ? refId(pf._id || pf) : refId(pf);
        if (pid && String(pid) === String(facultyId)) {
          map[day].push({
            id: `${row._id}-${p.periodNumber}-${p.startTime}`,
            periodNumber: p.periodNumber,
            startTime: p.startTime,
            endTime: p.endTime,
            course: formatCourse(p.course),
            section: row.section || '—',
            semester: row.semester,
            room: p.room || '—',
            academicYear: row.academicYear,
          });
        }
      });
    });

    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0));
    });

    return map;
  }, [rows, facultyId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Loading timetable…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Timetable</h1>
        <p className="mt-1 text-sm text-slate-600">
          Weekly view of classes assigned to you ({user?.name}).
        </p>
      </div>

      {!facultyId ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Could not resolve faculty profile. Ensure your account is linked to a
          faculty record.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {DAYS.map((day) => {
            const slots = byDay[day] || [];
            return (
              <section
                key={day}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-indigo-100 bg-indigo-600 px-4 py-3">
                  <h2 className="text-base font-semibold text-white">{day}</h2>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  {slots.length === 0 ? (
                    <p className="text-sm text-slate-500">No classes</p>
                  ) : (
                    slots.map((slot) => (
                      <article
                        key={slot.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                          <FiClock className="h-3.5 w-3.5" />
                          {slot.startTime} – {slot.endTime}
                          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-600">
                            P{slot.periodNumber}
                          </span>
                        </div>
                        <p className="mt-2 font-semibold text-slate-900">
                          {slot.course}
                        </p>
                        <p className="text-sm text-slate-600">
                          Semester {slot.semester} · Section {slot.section}
                        </p>
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-700">
                          <FiMapPin className="h-4 w-4 shrink-0 text-indigo-500" />
                          Room {slot.room}
                          {slot.academicYear ? (
                            <span className="text-slate-500">
                              · {slot.academicYear}
                            </span>
                          ) : null}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
