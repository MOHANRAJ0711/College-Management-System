import { NavLink } from 'react-router-dom';
import {
<<<<<<< HEAD
  FiAlertCircle, FiAward, FiBarChart2, FiBell, FiBook, FiBookOpen, 
  FiBriefcase, FiCalendar, FiCamera, FiClipboard, FiDollarSign, 
  FiFile, FiFileText, FiGrid, FiHome, FiInbox, FiMapPin, 
  FiPackage, FiSettings, FiTruck, FiUploadCloud, FiUserCheck, FiUsers, FiX, FiLayers, FiActivity, FiSearch, FiMonitor
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
                    ? 'bg-brand-600 text-white shadow-premium ring-1 ring-brand-500/10'
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
=======
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
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
  const { user } = useAuth();
  const role = user?.role;
  const isHOD = user?.isHOD;

<<<<<<< HEAD
  const getCategorizedItems = () => {
    if (role === 'admin') {
      return [
        {
          title: 'Core Insights',
          items: [
            { to: '/admin/dashboard', label: 'Control Center', icon: FiGrid },
            { to: '/admin/reports', label: 'Matrix Analytics', icon: FiBarChart2 },
          ]
        },
        {
          title: 'Academic Ops',
          items: [
            { to: '/admin/students', label: 'Students', icon: FiUsers },
            { to: '/admin/faculty', label: 'Faculty', icon: FiBook },
            { to: '/admin/departments', label: 'Departments', icon: FiSettings },
            { to: '/admin/courses', label: 'Curriculum', icon: FiBookOpen },
            { to: '/admin/attendance', label: 'Attendance', icon: FiUserCheck },
          ]
        },
        {
          title: 'Logistics & Estate',
          items: [
            { to: '/admin/hostel', label: 'Hostel Matrix', icon: FiHome },
            { to: '/admin/transport', label: 'Transport Fleet', icon: FiTruck },
          ]
        },
        {
          title: 'Governance & Finance',
          items: [
            { to: '/admin/leave-approvals', label: 'Leave Sanction', icon: FiClipboard },
            { to: '/admin/payroll', label: 'Finance Core', icon: FiDollarSign },
            { to: '/admin/scholarship', label: 'Endowments', icon: FiAward },
            { to: '/admin/exams', label: 'Exams Portal', icon: FiLayers },
            { to: '/admin/results', label: 'Grading Engine', icon: FiAward },
          ]
        },
        {
          title: 'Lifestyle & Support',
          items: [
            { to: '/admin/events', label: 'Venue Bookings', icon: FiCalendar },
            { to: '/admin/library', label: 'Library ERP', icon: FiBook },
            { to: '/admin/notifications', label: 'Bulletins', icon: FiBell },
          ]
        }
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
          ]
        },
        {
          title: 'Academic Flow',
          items: [
            { to: '/faculty/face-attendance', label: 'Face Attendance', icon: FiCamera },
            { to: '/faculty/attendance', label: 'Mark Presence', icon: FiUserCheck },
            { to: '/faculty/marks', label: 'Grading', icon: FiClipboard },
            { to: '/faculty/assignments', label: 'Assignments', icon: FiLayers },
            { to: '/faculty/lms-upload', label: 'Material Forge', icon: FiUploadCloud },
          ]
        },
        {
          title: 'Governance',
          items: [
            { to: '/faculty/leave-request', label: 'Absence Registry', icon: FiFileText },
            { to: '/faculty/my-payslips', label: 'Salary Archive', icon: FiDollarSign },
          ]
        }
      ];

      if (isHOD) {
        sections.unshift({
          title: 'Cluster Mgmt',
          items: [
            { to: '/hod/dashboard', label: 'HOD Console', icon: FiActivity },
            { to: '/hod/leave-approvals', label: 'Dept Sanction', icon: FiCheckCircle },
          ]
        });
      }
      return sections;
    }

    // Default: Student
    return [
      {
        title: 'Academic Path',
        items: [
          { to: '/student/dashboard', label: 'My Console', icon: FiGrid },
          { to: '/student/profile', label: 'Profile', icon: FiUsers },
          { to: '/student/attendance', label: 'Presence', icon: FiUserCheck },
          { to: '/student/timetable', label: 'Timetable', icon: FiCalendar },
          { to: '/student/results', label: 'Outcomes', icon: FiAward },
        ]
      },
      {
        title: 'Learning Lab',
        items: [
          { to: '/student/materials', label: 'Vault Access', icon: FiBookOpen },
          { to: '/student/feedback', label: 'Voice Portal', icon: FiStar || FiLayers },
          { to: '/student/library', label: 'Library', icon: FiBook },
        ]
      },
      {
        title: 'Campys Life',
        items: [
          { to: '/student/hostel', label: 'Hostel Portal', icon: FiHome },
          { to: '/student/transport', label: 'Fleet Portal', icon: FiTruck },
          { to: '/student/scholarship', label: 'Endowments', icon: FiAward },
          { to: '/student/events', label: 'Engagement', icon: FiCalendar },
        ]
      },
      {
        title: 'Support Desk',
        items: [
          { to: '/student/face-register', label: 'Face ID Biometrics', icon: FiCamera },
          { to: '/student/complaints', label: 'Disputes', icon: FiAlertCircle },
          { to: '/student/service-request', label: 'Concierge', icon: FiInbox },
        ]
      }
    ];
  };

  const sections = getCategorizedItems();
  let brandSub = role === 'admin' ? 'Governance' : role === 'faculty' ? 'Educator' : 'Learner';
  let accentColor = role === 'admin' ? 'from-violet-600 to-brand-700' : 'from-brand-600 to-indigo-700';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden ${
=======
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
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      <aside
<<<<<<< HEAD
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col glass dark:glass-dark border-r border-slate-200/60 dark:border-slate-800/60 shadow-premium-xl transition-all duration-500 ease-in-out lg:static lg:z-0 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${className}`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-8 border-b border-slate-200/40 dark:border-slate-800/40">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accentColor} text-white shadow-premium ring-4 ring-brand-500/10`}>
              <FiMonitor className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <p className="text-base font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-tight">CampusOne</p>
              <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em]">{brandSub} ERP</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
=======
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
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
            onClick={onClose}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

<<<<<<< HEAD
        {/* Navigation Categories */}
        <nav className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
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
        <div className="px-8 py-6 border-t border-slate-200/40 dark:border-slate-800/40">
          <div className="flex items-center gap-3 text-slate-400/60 dark:text-slate-600">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-emerald-500/20" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">
              Precision Core PRO
            </p>
          </div>
=======
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
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
        </div>
      </aside>
    </>
  );
}
<<<<<<< HEAD

function FiStar(props) {
  return (
    <svg 
      stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  );
}
=======
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
