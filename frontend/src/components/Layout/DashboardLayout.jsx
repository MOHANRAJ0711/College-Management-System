import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, Outlet } from 'react-router-dom';
import {
  FiBell,
  FiChevronDown,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiSun,
  FiUser,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { useDarkMode } from '../../context/DarkModeContext';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Poll unread notifications every 60 seconds
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await import('../../services/api').then((m) => m.default.get('/notifications/unread-count'));
      setUnreadCount(data?.unread ?? 0);
    } catch {
      // silently ignore
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const roleLabel = () => {
    if (user?.role === 'admin') return 'System Administrator';
    if (user?.role === 'student') return 'Student Portal';
    if (user?.role === 'faculty') return user?.designation === 'HOD' || user?.isHOD ? 'Department Head' : 'Faculty Member';
    return '';
  };

  const profilePath =
    user?.role === 'student' ? '/student/profile'
    : user?.role === 'faculty' ? ((user?.designation === 'HOD' || user?.isHOD) ? '/hod/profile' : '/faculty/profile')
    : user?.role === 'admin' ? '/admin/profile'
    : '/login';

  const roleBadgeColor =
    user?.role === 'admin' ? 'bg-violet-100/80 text-violet-700 ring-violet-700/10'
    : (user?.designation === 'HOD' || user?.isHOD) ? 'bg-indigo-100/80 text-indigo-700 ring-indigo-700/10'
    : user?.role === 'faculty' ? 'bg-blue-100/80 text-blue-700 ring-blue-700/10'
    : 'bg-emerald-100/80 text-emerald-700 ring-emerald-700/10';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors">
      <div className="flex min-h-screen">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} className="print:hidden z-40" />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 sm:px-6 print:hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/50 p-2 text-slate-700 shadow-sm transition hover:bg-white lg:hidden dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Open sidebar"
                  onClick={() => setSidebarOpen(true)}
                >
                  <FiMenu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {roleLabel()}
                  </p>
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-lg">
                    {user?.name ?? 'Guest User'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                {/* Role badge */}
                <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset sm:inline ${roleBadgeColor}`}>
                  {roleLabel()}
                </span>

                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={toggleDark}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/50 text-slate-600 transition-all hover:bg-white hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Toggle theme"
                >
                  {dark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
                </button>

                {/* Notifications Bell */}
                <Link
                  to={user?.role === 'faculty' ? '/faculty/notifications' : user?.role === 'student' ? '/student/notifications' : '/admin/notifications'}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/50 text-slate-600 transition-all hover:bg-white hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Notifications"
                  onClick={() => setUnreadCount(0)}
                >
                  <FiBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/50 px-2.5 shadow-sm transition-all hover:border-indigo-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-[10px] font-black text-white">
                      {(user?.name || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <FiChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-3 w-64 origin-top-right overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                      <div className="px-4 py-3 mb-1 border-b border-slate-100 dark:border-slate-700/50">
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.email}</p>
                      </div>
                      <Link
                        to={profilePath}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-indigo-400"
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          <FiUser className="h-4 w-4" />
                        </div>
                        My Profile
                      </Link>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                        onClick={() => { setMenuOpen(false); logout(); }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
                          <FiLogOut className="h-4 w-4" />
                        </div>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 print:p-0">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
