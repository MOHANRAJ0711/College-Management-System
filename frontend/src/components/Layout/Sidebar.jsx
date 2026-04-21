import { NavLink } from 'react-router-dom';
import {
  FiAlertCircle, FiAward, FiBarChart2, FiBell, FiBook, FiBookOpen,
  FiBriefcase, FiCalendar, FiCamera, FiClipboard, FiDollarSign,
  FiFile, FiFileText, FiGrid, FiHome, FiInbox, FiMapPin,
  FiPackage, FiSettings, FiTruck, FiUploadCloud, FiUserCheck, FiUsers, FiX,
  FiLayers, FiActivity, FiSearch, FiMonitor, FiCheckCircle,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const SidebarSection = ({ title, items, onClose }) => (
  <div className="mb-8">
    <h3 className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/80 dark:text-slate-500/80">
      {title}
    </h3>
    <ul className="space-y-1">
      {items.map((item) => {
        const ItemIcon = item.icon;
        return (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg ring-1 ring-brand-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
              onClick={() => onClose?.()}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center transition-transform group-hover:scale-110">
                <ItemIcon className="h-5 w-5" />
              </div>
              <span className="truncate tracking-tight">{item.label}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  </div>
);

export default function Sidebar({ isOpen, onClose, className = '' }) {
  const { user } = useAuth();
  const role = user?.role;
  const isHOD = user?.designation === 'HOD' || user?.isHOD;

  const getCategorizedItems = () => {
    if (role === 'admin') {
      return [
        {
          title: 'Core Insights',
          items: [
            { to: '/admin/dashboard', label: 'Control Center', icon: FiGrid },
            { to: '/admin/profile', label: 'My Profile', icon: FiUsers },
            { to: '/admin/reports', label: 'Analytics', icon: FiBarChart2 },
          ],
        },
        {
          title: 'Academic Ops',
          items: [
            { to: '/admin/students', label: 'Students', icon: FiUsers },
            { to: '/admin/faculty', label: 'Faculty', icon: FiBook },
            { to: '/admin/departments', label: 'Departments', icon: FiSettings },
            { to: '/admin/courses', label: 'Curriculum', icon: FiBookOpen },
            { to: '/admin/attendance', label: 'Attendance', icon: FiUserCheck },
            { to: '/admin/exams', label: 'Exams', icon: FiLayers },
            { to: '/admin/results', label: 'Results', icon: FiAward },
            { to: '/admin/timetable', label: 'Timetable', icon: FiCalendar },
            { to: '/admin/result-upload', label: 'Result Upload', icon: FiUploadCloud },
          ],
        },
        {
          title: 'Logistics & Estate',
          items: [
            { to: '/admin/hostel', label: 'Hostel', icon: FiHome },
            { to: '/admin/transport', label: 'Transport', icon: FiTruck },
            { to: '/admin/library', label: 'Library', icon: FiBook },
            { to: '/admin/placements', label: 'Placements', icon: FiBriefcase },
          ],
        },
        {
          title: 'Finance & Governance',
          items: [
            { to: '/admin/fees', label: 'Fees', icon: FiDollarSign },
            { to: '/admin/payroll', label: 'Payroll', icon: FiDollarSign },
            { to: '/admin/leave-approvals', label: 'Leave Approvals', icon: FiClipboard },
            { to: '/admin/admissions', label: 'Admissions', icon: FiFileText },
            { to: '/admin/notifications', label: 'Notifications', icon: FiBell },
          ],
        },
      ];
    }

    if (role === 'faculty') {
      const sections = [
        {
          title: 'Operations',
          items: [
            { to: '/faculty/dashboard', label: 'Dashboard', icon: FiGrid },
            { to: '/faculty/profile', label: 'Profile', icon: FiUsers },
            { to: '/faculty/timetable', label: 'Timetable', icon: FiCalendar },
            { to: '/faculty/notifications', label: 'Notifications', icon: FiBell },
          ],
        },
        {
          title: 'Academic Flow',
          items: [
            { to: '/faculty/face-attendance', label: 'Face Attendance', icon: FiCamera },
            { to: '/faculty/attendance', label: 'Mark Attendance', icon: FiUserCheck },
            { to: '/faculty/marks', label: 'Enter Marks', icon: FiClipboard },
            { to: '/faculty/assignments', label: 'Assignments', icon: FiLayers },
            { to: '/faculty/result-upload', label: 'Result Upload', icon: FiUploadCloud },
            { to: '/faculty/lms-upload', label: 'Study Materials', icon: FiBookOpen },
            { to: '/faculty/students', label: 'My Students', icon: FiUsers },
          ],
        },
        {
          title: 'Governance',
          items: [
            { to: '/faculty/leave-request', label: 'Leave Request', icon: FiFileText },
            { to: '/faculty/my-payslips', label: 'My Payslips', icon: FiDollarSign },
          ],
        },
      ];

      if (isHOD) {
        sections.unshift({
          title: 'HOD Management',
          items: [
            { to: '/hod/dashboard', label: 'HOD Console', icon: FiActivity },
            { to: '/hod/faculty', label: 'Dept Faculty', icon: FiUsers },
            { to: '/hod/students', label: 'Dept Overview', icon: FiGrid },
            { to: '/hod/courses', label: 'Courses', icon: FiBookOpen },
            { to: '/hod/timetable', label: 'Timetable', icon: FiCalendar },
            { to: '/hod/leave-approvals', label: 'Leave Approvals', icon: FiCheckCircle },
            { to: '/hod/notifications', label: 'Notifications', icon: FiBell },
          ],
        });
      }
      return sections;
    }

    // Default: Student
    return [
      {
        title: 'Academic Path',
        items: [
          { to: '/student/dashboard', label: 'Dashboard', icon: FiGrid },
          { to: '/student/profile', label: 'Profile', icon: FiUsers },
          { to: '/student/attendance', label: 'Attendance', icon: FiUserCheck },
          { to: '/student/timetable', label: 'Timetable', icon: FiCalendar },
          { to: '/student/results', label: 'Results', icon: FiAward },
          { to: '/student/fees', label: 'Fees', icon: FiDollarSign },
        ],
      },
      {
        title: 'Learning Lab',
        items: [
          { to: '/student/materials', label: 'Study Materials', icon: FiBookOpen },
          { to: '/student/library', label: 'Library', icon: FiBook },
          { to: '/student/placements', label: 'Placements', icon: FiBriefcase },
          { to: '/student/certificates', label: 'Certificates', icon: FiFileText },
        ],
      },
      {
        title: 'Campus Life',
        items: [
          { to: '/student/hostel', label: 'Hostel', icon: FiHome },
          { to: '/student/transport', label: 'Transport', icon: FiTruck },
          { to: '/student/notifications', label: 'Notifications', icon: FiBell },
        ],
      },
      {
        title: 'Support Desk',
        items: [
          { to: '/student/face-register', label: 'Face ID Register', icon: FiCamera },
          { to: '/student/complaints', label: 'Complaints', icon: FiAlertCircle },
          { to: '/student/service-request', label: 'Service Request', icon: FiInbox },
          { to: '/student/request-status', label: 'Request Status', icon: FiPackage },
          { to: '/student/documents', label: 'Documents', icon: FiFile },
        ],
      },
    ];
  };

  const sections = getCategorizedItems();
  const accentColor =
    role === 'admin'
      ? 'from-violet-600 to-purple-700'
      : role === 'faculty' && isHOD
      ? 'from-indigo-600 to-blue-700'
      : role === 'faculty'
      ? 'from-blue-600 to-indigo-700'
      : 'from-emerald-600 to-teal-700';

  const brandSub =
    role === 'admin'
      ? 'Administration'
      : role === 'faculty' && isHOD
      ? 'HOD Portal'
      : role === 'faculty'
      ? 'Faculty Portal'
      : 'Student Portal';

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 shadow-xl transition-all duration-300 ease-in-out lg:static lg:z-0 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${className}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accentColor} text-white shadow-lg`}>
              <FiMonitor className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-black tracking-tighter text-slate-900 dark:text-white uppercase">CampusOne</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{brandSub}</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          {sections.map((section, idx) => (
            <SidebarSection
              key={idx}
              title={section.title}
              items={section.items}
              onClose={onClose}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-400/60 dark:text-slate-600">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em]">System Online</p>
          </div>
        </div>
      </aside>
    </>
  );
}
