import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  {
    id: 'admin',
    label: 'Admin',
    icon: '👑',
    desc: 'Full system control',
    color: 'from-violet-600 to-purple-700',
    ring: 'ring-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    hint: { email: 'admin@college.edu', password: 'admin123' },
  },
  {
    id: 'faculty',
    label: 'Faculty',
    icon: '👩‍🏫',
    desc: 'Teaching staff & HOD',
    color: 'from-indigo-600 to-blue-700',
    ring: 'ring-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    hint: { email: 'faculty1@college.edu', password: 'faculty123' },
    subRoles: [
      { id: 'hod', label: 'HOD Login', icon: '🏛️', desc: 'Head of Department' },
      { id: 'regular', label: 'Faculty Login', icon: '📚', desc: 'Teaching faculty' },
    ],
  },
  {
    id: 'student',
    label: 'Student',
    icon: '🎓',
    desc: 'View results, attendance & more',
    color: 'from-emerald-600 to-teal-700',
    ring: 'ring-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    hint: { email: 'student1@college.edu', password: 'student123' },
  },
];

function dashboardForUser(user) {
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'student') return '/student/dashboard';
  if (user.role === 'faculty') return user.isHOD ? '/hod/dashboard' : '/faculty/dashboard';
  return '/';
}

export default function Login() {
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedSubRole, setSelectedSubRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState('');

  const activeRole = ROLES.find((r) => r.id === selectedRole);

  const selectRole = (roleId) => {
    setSelectedRole(roleId);
    setSelectedSubRole(null);
    setError('');
    const role = ROLES.find((r) => r.id === roleId);
    if (role && !role.subRoles) {
      setEmail(role.hint?.email ?? '');
      setPassword(role.hint?.password ?? '');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const selectSubRole = (subId) => {
    setSelectedSubRole(subId);
    setError('');
    const hint = subId === 'hod'
      ? { email: 'hod@college.edu', password: 'faculty123' }
      : { email: 'faculty1@college.edu', password: 'faculty123' };
    setEmail(hint.email);
    setPassword(hint.password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await login(email, password);
      // If OTP is required, backend returns otpRequired: true
      if (resp.otpRequired) {
        setOtpRequired(true);
        setError('');
        return;
      }
      
      const { user } = resp;
      let target = dashboardForUser(user);
      if (from && from !== '/login') {
        const isProtectedPath = ['/admin', '/faculty', '/hod', '/student'].some(p => from.startsWith(p));
        const isCompatible = 
          (user.role === 'admin' && from.startsWith('/admin')) ||
          (user.role === 'student' && from.startsWith('/student')) ||
          (user.role === 'faculty' && (from.startsWith('/faculty') || from.startsWith('/hod')));
          
        if (!isProtectedPath || isCompatible) {
          target = from;
        }
      }
      navigate(target, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials.';
      setError(typeof msg === 'string' ? msg : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await verifyOtp(email, otp);
      let target = dashboardForUser(user);
      if (from && from !== '/login') {
        const isProtectedPath = ['/admin', '/faculty', '/hod', '/student'].some(p => from.startsWith(p));
        const isCompatible = 
          (user.role === 'admin' && from.startsWith('/admin')) ||
          (user.role === 'student' && from.startsWith('/student')) ||
          (user.role === 'faculty' && (from.startsWith('/faculty') || from.startsWith('/hod')));
          
        if (!isProtectedPath || isCompatible) {
          target = from;
        }
      }
      navigate(target, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'OTP verification failed.';
      setError(typeof msg === 'string' ? msg : 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const showForm = selectedRole && (selectedRole !== 'faculty' || selectedSubRole);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur-sm">
            🎓
          </div>
          <h1 className="text-3xl font-bold text-white">CampusOne</h1>
          <p className="mt-1 text-sm text-white/60">College Management System</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
          {/* Step 1: Role Selection */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
              {selectedRole ? 'Role' : 'Select your role'}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => selectRole(role.id)}
                  className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all duration-200 ${
                    selectedRole === role.id
                      ? `border-white/30 bg-white/15 ring-2 ${role.ring} shadow-lg`
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl">{role.icon}</span>
                  <span className="text-xs font-semibold text-white">{role.label}</span>
                  <span className="hidden text-[10px] text-white/50 sm:block">{role.desc}</span>
                  {selectedRole === role.id && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] text-indigo-700 font-bold shadow">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Sub-role (Faculty only) */}
          {selectedRole === 'faculty' && !selectedSubRole && (
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                Select faculty type
              </p>
              <div className="grid grid-cols-2 gap-3">
                {activeRole.subRoles.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => selectSubRole(sub.id)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10 hover:border-white/20"
                  >
                    <span className="text-3xl">{sub.icon}</span>
                    <span className="text-sm font-semibold text-white">{sub.label}</span>
                    <span className="text-xs text-white/50">{sub.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Login form */}
          {showForm && (
            otpRequired ? (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-white/80 font-medium">Enter the 6-digit code sent to your email</p>
                  <p className="text-xs text-white/40 mt-1">{email}</p>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/50">One-Time Password</span>
                  <input
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder-white/10 outline-none transition focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
                    placeholder="000000"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => setOtpRequired(false)}
                  className="w-full text-center text-xs text-white/40 hover:text-white/70 transition"
                >
                  Go back to login
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className={`mb-4 flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 ${activeRole?.bg ?? ''}`}>
                  <span className="text-base">{activeRole?.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-white/80">
                      Signing in as{' '}
                      <span className="text-white">
                        {selectedRole === 'faculty' && selectedSubRole === 'hod' ? 'HOD' : activeRole?.label}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => { setSelectedRole(null); setSelectedSubRole(null); }}
                      className="text-[10px] text-white/40 hover:text-white/70 underline"
                    >
                      Change role
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/50">Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
                    placeholder="your@email.edu"
                  />
                </label>

                <div>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-white/50">Password</span>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
                      placeholder="••••••••"
                    />
                  </label>
                  <div className="mt-2 text-right">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-white/40 hover:text-white/70 transition"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`flex w-full items-center justify-center rounded-xl bg-gradient-to-r ${activeRole?.color ?? 'from-indigo-600 to-blue-600'} py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            )
          )}

          {!selectedRole && (
            <p className="mt-2 text-center text-xs text-white/40">
              Choose your role above to continue
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-white/30">
          © 2025 CampusOne · College Management System
        </p>
      </div>
    </div>
  );
}
