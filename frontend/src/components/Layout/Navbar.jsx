import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiAward, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

function GradCapIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6.09L12 12.72 5.18 9.09 12 5.45l6.82 3.64zM11 19.16l-4-2.18v-3.63l4 2.17 4-2.17v3.63l-4 2.18z" />
    </svg>
  );
}

const linkBase =
  'rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const roleLabel =
    user?.role && typeof user.role === 'string'
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
      : '';

  return (
    <header className="sticky top-0 z-50 border-b border-indigo-800/30 bg-indigo-700 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          onClick={close}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white shadow-inner">
            <GradCapIcon className="h-6 w-6" />
          </span>
          <span className="text-lg sm:text-xl">EduManager</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {!isAuthenticated ? (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) => `${linkBase} ${isActive ? 'bg-white/20' : ''}`}
              >
                Home
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) => `${linkBase} ${isActive ? 'bg-white/20' : ''}`}
              >
                About
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) => `${linkBase} ${isActive ? 'bg-white/20' : ''}`}
              >
                Contact
              </NavLink>
              <Link
                to="/login"
                className="ml-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow transition hover:bg-indigo-50"
              >
                Register
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">{user?.name}</p>
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-indigo-100">
                  <FiAward className="h-3 w-3" />
                  {roleLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  close();
                }}
                className="rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
              >
                Logout
              </button>
            </div>
          )}
        </nav>

        <button
          type="button"
          className="inline-flex rounded-lg border border-white/30 p-2 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-indigo-600/50 bg-indigo-700 px-4 py-4 md:hidden">
          {!isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <NavLink
                to="/"
                end
                className="rounded-lg px-3 py-2 hover:bg-white/10"
                onClick={close}
              >
                Home
              </NavLink>
              <NavLink
                to="/about"
                className="rounded-lg px-3 py-2 hover:bg-white/10"
                onClick={close}
              >
                About
              </NavLink>
              <NavLink
                to="/contact"
                className="rounded-lg px-3 py-2 hover:bg-white/10"
                onClick={close}
              >
                Contact
              </NavLink>
              <Link
                to="/login"
                className="mt-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-center font-semibold"
                onClick={close}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-white px-4 py-2 text-center font-semibold text-indigo-700"
                onClick={close}
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-medium">{user?.name}</p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs">
                  <FiAward className="h-3 w-3" />
                  {roleLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  close();
                }}
                className="rounded-lg border border-white/40 bg-white/10 px-4 py-2 font-semibold"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
