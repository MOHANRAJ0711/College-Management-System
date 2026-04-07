import { NavLink } from 'react-router-dom';
import {
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
  const { user } = useAuth();
  const role = user?.role;
  const isHOD = user?.isHOD;

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
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      <aside
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
            onClick={onClose}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

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
        </div>
      </aside>
    </>
  );
}

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
