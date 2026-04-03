import { NavLink } from 'react-router-dom';
import {
  FiAlertCircle,
  FiAward,
  FiBarChart2,
  FiBell,
  FiBook,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCamera,
  FiClipboard,
  FiDollarSign,
  FiFile,
  FiFileText,
  FiGrid,
  FiHome,
  FiInbox,
  FiPackage,
  FiSettings,
  FiUploadCloud,
  FiUserCheck,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const itemClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/20'
      : 'text-indigo-100 hover:bg-white/10 hover:text-white'
  }`;

const studentItems = [
  { to: '/student/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/student/profile', label: 'Profile', icon: FiUsers },
  { to: '/student/attendance', label: 'Attendance', icon: FiUserCheck },
  { to: '/student/results', label: 'Results', icon: FiAward },
  { to: '/student/fees', label: 'Fees', icon: FiDollarSign },
  { to: '/student/timetable', label: 'Timetable', icon: FiCalendar },
  { to: '/student/notifications', label: 'Notifications', icon: FiBell },
  { to: '/student/placements', label: 'Placements', icon: FiBriefcase },
  { to: '/student/library', label: 'Library', icon: FiBookOpen },
  { to: '/student/certificates', label: 'Certificates', icon: FiFileText },
  { to: '/student/service-request', label: 'Request Service', icon: FiInbox },
  { to: '/student/request-status', label: 'Request Status', icon: FiPackage },
  { to: '/student/complaints', label: 'Complaints', icon: FiAlertCircle },
  { to: '/student/documents', label: 'Documents', icon: FiFile },
  { to: '/student/face-register', label: 'Face Register', icon: FiCamera },
];

const facultyItems = [
  { to: '/faculty/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/faculty/profile', label: 'Profile', icon: FiUsers },
  { to: '/faculty/face-attendance', label: 'Face Attendance', icon: FiCamera },
  { to: '/faculty/attendance', label: 'Mark Attendance', icon: FiUserCheck },
  { to: '/faculty/marks', label: 'Enter Marks', icon: FiClipboard },
  { to: '/faculty/result-upload', label: 'Result Upload', icon: FiUploadCloud },
  { to: '/faculty/assignments', label: 'Assignments', icon: FiBookOpen },
  { to: '/faculty/students', label: 'Student List', icon: FiUsers },
  { to: '/faculty/timetable', label: 'Timetable', icon: FiCalendar },
  { to: '/faculty/notifications', label: 'Notifications', icon: FiBell },
];

const hodItems = [
  { to: '/hod/dashboard', label: 'HOD Dashboard', icon: FiHome },
  { to: '/hod/faculty', label: 'Faculty', icon: FiUsers },
  { to: '/hod/students', label: 'Department Overview', icon: FiGrid },
  { to: '/hod/courses', label: 'Courses', icon: FiBookOpen },
  { to: '/hod/timetable', label: 'Timetable', icon: FiCalendar },
  { to: '/hod/notifications', label: 'Notifications', icon: FiBell },
];

const adminItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/admin/students', label: 'Students', icon: FiUsers },
  { to: '/admin/faculty', label: 'Faculty', icon: FiBook },
  { to: '/admin/departments', label: 'Departments', icon: FiSettings },
  { to: '/admin/courses', label: 'Courses', icon: FiBookOpen },
  { to: '/admin/admissions', label: 'Admissions', icon: FiFileText },
  { to: '/admin/attendance', label: 'Attendance', icon: FiUserCheck },
  { to: '/admin/exams', label: 'Exams', icon: FiClipboard },
  { to: '/admin/results', label: 'Results', icon: FiAward },
  { to: '/admin/fees', label: 'Fees', icon: FiDollarSign },
  { to: '/admin/timetable', label: 'Timetable', icon: FiCalendar },
  { to: '/admin/notifications', label: 'Notifications', icon: FiBell },
  { to: '/admin/library', label: 'Library', icon: FiBook },
  { to: '/admin/placements', label: 'Placements', icon: FiBriefcase },
  { to: '/admin/certificates', label: 'Certificates', icon: FiFileText },
  { to: '/admin/result-upload', label: 'Result Upload', icon: FiUploadCloud },
  { to: '/admin/reports', label: 'Reports', icon: FiBarChart2 },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role;
  const isHOD = user?.isHOD;

  let items = studentItems;
  let brandLabel = 'CampusOne';
  let brandSub = 'Student Portal';
  let gradientClass = 'from-emerald-700 to-teal-800';

  if (role === 'admin') {
    items = adminItems;
    brandSub = 'Admin Panel';
    gradientClass = 'from-violet-700 to-purple-800';
  } else if (role === 'faculty' && isHOD) {
    items = hodItems;
    brandSub = 'HOD Portal';
    gradientClass = 'from-indigo-700 to-blue-800';
  } else if (role === 'faculty') {
    items = facultyItems;
    brandSub = 'Faculty Portal';
    gradientClass = 'from-indigo-700 to-blue-800';
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b ${gradientClass} text-white shadow-2xl transition-transform duration-200 ease-out lg:static lg:z-0 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-base font-bold tracking-tight">{brandLabel}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">{brandSub}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-white/10">
          <ul className="space-y-0.5">
            {items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink to={item.to} className={itemClass} onClick={() => onClose?.()}>
                    <ItemIcon className="h-4 w-4 shrink-0 opacity-90" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-4 py-3">
          <p className="text-[10px] text-white/30">© 2025 CampusOne</p>
        </div>
      </aside>
    </>
  );
}
