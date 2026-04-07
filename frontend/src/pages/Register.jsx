import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function dashboardForRole(role) {
  if (role === 'student') return '/student/dashboard';
  if (role === 'faculty') return '/faculty/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/';
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [rollNumber, setRollNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { name, email, password, role };
      if (role === 'student') {
        payload.studentProfile = { rollNumber };
      } else if (role === 'faculty') {
        payload.facultyProfile = { employeeId };
      }
      const { user: nextUser } = await register(payload);
      navigate(dashboardForRole(nextUser?.role), { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Could not create your account. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-blue-50/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-600">Join EduManager to access your campus portal.</p>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-indigo-100/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                placeholder="Jane Doe"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                placeholder="you@campus.edu"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                placeholder="At least 6 characters"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            {role === 'student' ? (
              <label className="block text-sm font-medium text-slate-700">
                Roll number
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                  placeholder="e.g. CS2024001"
                />
              </label>
            ) : null}

            {role === 'faculty' ? (
              <label className="block text-sm font-medium text-slate-700">
                Employee ID
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                  placeholder="Faculty employee ID"
                />
              </label>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-400/30 transition hover:from-indigo-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating account…
                </span>
              ) : (
                'Register'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
