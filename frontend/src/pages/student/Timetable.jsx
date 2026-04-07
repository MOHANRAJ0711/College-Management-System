import { useEffect, useMemo, useState } from 'react';
import { FiClock, FiMapPin, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { apiError } from './utils';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = str.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

function parseTime(t) {
  if (!t) return null;
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const d = new Date();
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return d;
}

function normalize(res) {
  const d = res?.data ?? res;
  let periods =
    Array.isArray(d.periods) && d.periods.length
      ? d.periods.map((p, i) =>
          typeof p === 'string'
            ? { index: i, label: p, startTime: null, endTime: null }
            : {
                index: p.index ?? i,
                label: p.label ?? p.name ?? `P${i + 1}`,
                startTime: p.startTime ?? p.start,
                endTime: p.endTime ?? p.end,
              }
        )
      : Array.from({ length: 8 }, (_, i) => ({
          index: i,
          label: `Period ${i + 1}`,
          startTime: null,
          endTime: null,
        }));

  const rawSlots = Array.isArray(d.slots)
    ? d.slots
    : Array.isArray(d.entries)
      ? d.entries
      : [];

  const grid = {};
  DAY_KEYS.forEach((day) => {
    grid[day] = {};
  });

  if (rawSlots.length) {
    rawSlots.forEach((s) => {
      const day = String(s.day ?? s.weekday ?? '').toLowerCase();
      const key = DAY_KEYS.includes(day) ? day : day.slice(0, 3);
      const mappedDay =
        {
          mon: 'monday',
          tue: 'tuesday',
          wed: 'wednesday',
          thu: 'thursday',
          fri: 'friday',
          sat: 'saturday',
        }[key] || (DAY_KEYS.includes(day) ? day : null);
      if (!mappedDay || !grid[mappedDay]) return;
      let pIdx = Number(s.period ?? s.periodIndex ?? s.slot ?? 0);
      if (pIdx >= 1 && pIdx <= periods.length) pIdx -= 1;
      if (pIdx < 0 || pIdx >= periods.length) return;
      const cell = {
        subject: s.subject ?? s.courseName ?? s.title ?? '—',
        teacher: s.teacher ?? s.faculty ?? s.instructor ?? '—',
        room: s.room ?? s.venue ?? s.hall ?? '—',
        startTime: s.startTime ?? s.start,
        endTime: s.endTime ?? s.end,
      };
      grid[mappedDay][pIdx] = cell;
    });
  } else if (d.grid && typeof d.grid === 'object') {
    DAY_KEYS.forEach((day) => {
      const col = d.grid[day] ?? d.grid[day.charAt(0).toUpperCase() + day.slice(1)];
      if (!col) return;
      if (Array.isArray(col)) {
        col.forEach((cell, idx) => {
          if (!cell) return;
          grid[day][idx] = {
            subject: cell.subject ?? cell.name ?? '—',
            teacher: cell.teacher ?? '—',
            room: cell.room ?? '—',
            startTime: cell.startTime,
            endTime: cell.endTime,
          };
        });
      } else if (typeof col === 'object') {
        Object.keys(col).forEach((k) => {
          const cell = col[k];
          const idx = Number(k) - 1;
          grid[day][idx] = {
            subject: cell.subject ?? '—',
            teacher: cell.teacher ?? '—',
            room: cell.room ?? '—',
            startTime: cell.startTime,
            endTime: cell.endTime,
          };
        });
      }
    });
  }

  return { periods, grid };
}

export default function Timetable() {
  const { user } = useAuth();
  const dept = user?.department ?? '';
  const sem = user?.semester ?? '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data: res } = await api.get('/timetable', {
          params: { department: dept, semester: sem },
        });
        if (!cancelled) setData(normalize(res));
      } catch (e) {
        if (!cancelled) {
          const msg = apiError(e);
          setError(msg);
          toast.error(msg);
          setData(normalize({ periods: [], slots: [] }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dept, sem]);

  const nowInfo = useMemo(() => {
    const now = new Date();
    const jsDay = now.getDay();
    const map = [null, 0, 1, 2, 3, 4, 5];
    const dayIndex = map[jsDay];
    const currentDayKey = dayIndex != null ? DAY_KEYS[dayIndex] : null;

    let currentPeriodIndex = null;
    const periods = data?.periods ?? [];
    periods.forEach((p, idx) => {
      const st = parseTime(p.startTime);
      const en = parseTime(p.endTime);
      if (st && en && now >= st && now <= en) currentPeriodIndex = idx;
    });

    return { currentDayKey, currentPeriodIndex, now };
  }, [data?.periods]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading timetable…" />
      </div>
    );
  }

  const periods = data?.periods ?? [];
  const grid = data?.grid ?? {};

  return (
    <div className="mx-auto max-w-[100rem] space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Timetable</h1>
          <p className="mt-1 text-sm text-slate-600">
            Weekly schedule
            {dept ? ` · ${dept}` : ''}
            {sem !== '' && sem != null ? ` · Semester ${sem}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
          <FiClock className="h-4 w-4 shrink-0" />
          <span>
            Current period is highlighted when it matches today&apos;s slot and time window.
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="sticky left-0 z-20 min-w-[100px] border-b border-r border-slate-200 px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                Period
              </th>
              {DAY_LABELS.map((label, i) => (
                <th
                  key={label}
                  className="border-b border-slate-200 px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  {label.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                  No timetable periods configured.
                </td>
              </tr>
            ) : (
              periods.map((p, pi) => (
                <tr key={p.index ?? pi} className="border-b border-slate-100">
                  <td className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                    <div>{p.label}</div>
                    {p.startTime && p.endTime ? (
                      <div className="mt-0.5 text-[10px] font-normal text-slate-500">
                        {p.startTime}–{p.endTime}
                      </div>
                    ) : null}
                  </td>
                  {DAY_KEYS.map((dk) => {
                    const cell = grid[dk]?.[pi] ?? grid[dk]?.[pi + 1];
                    const isCurrent =
                      nowInfo.currentDayKey === dk &&
                      nowInfo.currentPeriodIndex === pi &&
                      cell;
                    const subj = cell?.subject ?? '';
                    const hue = subj ? hashHue(subj) : 210;
                    return (
                      <td
                        key={`${dk}-${pi}`}
                        className={`align-top border-l border-slate-100 px-1 py-1 ${
                          isCurrent ? 'ring-2 ring-indigo-500 ring-inset' : ''
                        }`}
                      >
                        {cell ? (
                          <div
                            className="flex min-h-[88px] flex-col justify-between rounded-lg px-2 py-2 text-xs shadow-sm"
                            style={{
                              background: `linear-gradient(135deg, hsla(${hue},70%,96%,1), hsla(${hue},65%,88%,1))`,
                              border: `1px solid hsla(${hue},50%,70%,0.5)`,
                            }}
                          >
                            <div>
                              <p className="font-bold leading-tight text-slate-900 line-clamp-2">
                                {cell.subject}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-700">
                                <FiUser className="h-3 w-3 shrink-0 opacity-70" />
                                <span className="line-clamp-1">{cell.teacher}</span>
                              </p>
                            </div>
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-800">
                              <FiMapPin className="h-3 w-3 shrink-0" />
                              {cell.room}
                            </p>
                          </div>
                        ) : (
                          <div className="min-h-[88px] rounded-lg bg-slate-50/80" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
