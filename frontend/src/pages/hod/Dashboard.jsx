import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiBell, FiUsers, FiGrid, FiCalendar } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function HODDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hod/dashboard').then(({ data }) => setData(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const dept = data?.department;
  const stats = data?.stats ?? {};

  const quickLinks = [
    { to: '/hod/faculty', label: 'Faculty', icon: FiUsers, color: 'from-blue-500 to-indigo-600', count: stats.faculty },
    { to: '/hod/students', label: 'Students', icon: FiGrid, color: 'from-emerald-500 to-teal-600', count: stats.students },
    { to: '/hod/courses', label: 'Courses', icon: FiBookOpen, color: 'from-amber-500 to-orange-500', count: stats.courses },
    { to: '/hod/timetable', label: 'Timetable', icon: FiCalendar, color: 'from-violet-500 to-purple-600', count: null },
    { to: '/hod/notifications', label: 'Notifications', icon: FiBell, color: 'from-rose-500 to-red-600', count: null },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-700 to-blue-600 p-6 text-white shadow-lg">
        <p className="text-sm font-medium text-indigo-200">HOD Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold">Welcome, {user?.name ?? 'HOD'}!</h1>
        {dept && (
          <p className="mt-1 text-indigo-200">
            Department of <span className="font-semibold text-white">{dept.name}</span> ({dept.code})
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Faculty Members', value: stats.faculty ?? 0, icon: '👩‍🏫', color: 'from-blue-500 to-indigo-600' },
          { label: 'Students Enrolled', value: stats.students ?? 0, icon: '🎓', color: 'from-emerald-500 to-teal-600' },
          { label: 'Courses Offered', value: stats.courses ?? 0, icon: '📚', color: 'from-amber-500 to-orange-500' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.color} p-5 text-white shadow`}>
            <p className="text-3xl">{s.icon}</p>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
            <p className="mt-1 text-sm font-medium text-white/80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick access */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Quick Access</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map(({ to, label, icon: Icon, color, count }) => (
            <Link key={to} to={to}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
                {count !== null && count !== undefined && <p className="text-sm text-slate-500 dark:text-slate-400">{count} records</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
