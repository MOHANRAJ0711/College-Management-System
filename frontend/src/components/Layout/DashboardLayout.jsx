import { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleLabel = () => {
<<<<<<< HEAD
    if (user?.role === 'admin') return 'System Administrator';
    if (user?.role === 'student') return 'Student Portal';
    if (user?.role === 'faculty') return user?.isHOD ? 'Department Head' : 'Faculty Member';
=======
    if (user?.role === 'admin') return 'Admin';
    if (user?.role === 'student') return 'Student';
    if (user?.role === 'faculty') return user?.isHOD ? 'HOD' : 'Faculty';
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
    return '';
  };

  const profilePath =
    user?.role === 'student' ? '/student/profile'
    : user?.role === 'faculty' ? (user?.isHOD ? '/hod/profile' : '/faculty/profile')
    : user?.role === 'admin' ? '/admin/profile'
    : '/login';

  const roleBadgeColor =
<<<<<<< HEAD
    user?.role === 'admin' ? 'bg-violet-100/80 text-violet-700 ring-violet-700/10'
    : user?.isHOD ? 'bg-indigo-100/80 text-indigo-700 ring-indigo-700/10'
    : user?.role === 'faculty' ? 'bg-blue-100/80 text-blue-700 ring-blue-700/10'
    : 'bg-emerald-100/80 text-emerald-700 ring-emerald-700/10';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-brand-500/30 selection:text-brand-900 transition-colors">
      <div className="flex min-h-screen">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} className="print:hidden z-40" />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 glass dark:glass-dark border-b border-slate-200/60 dark:border-slate-800/60 px-4 py-3 sm:px-6 print:hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/50 p-2 text-slate-700 shadow-premium transition hover:bg-white hover:shadow-brand-500/10 lg:hidden dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Open sidebar"
                  onClick={() => setSidebarOpen(true)}
                >
                  <FiMenu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {roleLabel()}
                  </p>
                  <p className="text-balance truncate text-sm font-bold text-slate-900 dark:text-white sm:text-lg">
                    {user?.name ?? 'Guest User'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={toggleDark}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/50 text-slate-600 transition-all hover:border-brand-300 hover:bg-white hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                  aria-label="Toggle theme"
                >
                  {dark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
                </button>

                {/* Notifications */}
                <button
                  type="button"
                  className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/50 text-slate-600 transition-all hover:border-brand-300 hover:bg-white hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                  aria-label="Notifications"
                >
                  <FiBell className="h-5 w-5" />
                  <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-500"></span>
                  </span>
                </button>

                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/50 px-2.5 shadow-premium transition-all hover:border-brand-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-[10px] font-black text-white shadow-brand-500/40">
                      {(user?.name || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <FiChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-3 w-64 origin-top-right overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-1.5 shadow-premium-xl animate-modal-in dark:border-slate-700 dark:bg-slate-800">
                      <div className="px-4 py-3 mb-1 border-b border-slate-100 dark:border-slate-700/50">
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Connected as</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.email}</p>
                      </div>
                      <Link
                        to={profilePath}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-brand-400"
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-white">
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
=======
    user?.role === 'admin' ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300'
    : user?.isHOD ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
    : user?.role === 'faculty' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors">
      <div className="flex min-h-screen">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-sm sm:px-6 transition-colors">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 lg:hidden"
                aria-label="Open sidebar"
                onClick={() => setSidebarOpen(true)}
              >
                <FiMenu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Welcome back
                </p>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                  {user?.name ?? 'User'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline ${roleBadgeColor}`}>
                {roleLabel()}
              </span>

              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={toggleDark}
                className="rounded-full p-2 text-slate-600 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Toggle dark mode"
              >
                {dark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
              </button>

              <button
                type="button"
                className="relative rounded-full p-2 text-slate-600 dark:text-slate-400 transition hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400"
                aria-label="Notifications"
              >
                <FiBell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-800" />
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-left text-sm shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20 sm:px-3"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {(user?.name || '?').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[140px] truncate font-medium text-slate-800 dark:text-slate-200 sm:inline">
                    {user?.name}
                  </span>
                  <FiChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-500 transition ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 shadow-lg ring-1 ring-black/5"
                    role="menu"
                  >
                    <Link
                      to={profilePath}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiUser className="h-4 w-4 text-indigo-600" />
                      Profile
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); logout(); }}
                    >
                      <FiLogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
              </div>
            </div>
          </header>

<<<<<<< HEAD
          <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 print:p-0">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
=======
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
>>>>>>> 5bf96afa4b78a77bcb7e78c540f952f867f72d09
          </main>
        </div>
      </div>
    </div>
  );
}
