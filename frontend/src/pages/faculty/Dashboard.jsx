import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiEdit, FiBell, FiCheckSquare, FiClipboard, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AttendanceChart from '../../components/analytics/AttendanceChart';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/faculty/dashboard');
        setData(res.data.data || res.data);
      } catch {
        toast.error('Failed to load dashboard');
        setData({});
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;

  const stats = [
    { label: 'Total Students', value: data?.totalStudents ?? 0, icon: FiUsers, color: 'bg-indigo-500' },
    { label: 'Classes Today', value: data?.classesToday ?? 0, icon: FiCalendar, color: 'bg-green-500' },
    { label: 'Pending Marks', value: data?.pendingMarks ?? 0, icon: FiEdit, color: 'bg-amber-500' },
    { label: 'Notifications', value: data?.notificationCount ?? 0, icon: FiBell, color: 'bg-rose-500' },
  ];

  const quickActions = [
    { label: 'Mark Attendance', to: '/faculty/attendance', icon: FiCheckSquare, color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'Enter Marks', to: '/faculty/marks', icon: FiClipboard, color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'View Timetable', to: '/faculty/timetable', icon: FiClock, color: 'bg-blue-600 hover:bg-blue-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name || 'Faculty'}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s your dashboard overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
            <div className={`${s.color} text-white p-3 rounded-lg`}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className={`${a.color} text-white rounded-xl p-5 flex items-center gap-3 transition shadow hover:shadow-lg`}
          >
            <a.icon size={22} />
            <span className="font-semibold">{a.label}</span>
          </Link>
        ))}
      </div>

      {data?.attendanceStats?.length > 0 && (
        <AttendanceChart 
          data={data.attendanceStats} 
          title="My Course Attendance" 
          color="rose"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Schedule</h2>
          {data?.todaySchedule?.length > 0 ? (
            <div className="space-y-3">
              {data.todaySchedule.map((slot, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-indigo-600 w-24">
                    {slot.startTime} - {slot.endTime}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{slot.courseName || slot.course?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Room: {slot.room || 'TBD'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No classes scheduled for today</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h2>
          {data?.recentNotifications?.length > 0 ? (
            <div className="space-y-3">
              {data.recentNotifications.slice(0, 5).map((n, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No recent notifications</p>
          )}
        </div>
      </div>
    </div>
  );
}
