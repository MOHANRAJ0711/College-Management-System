import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed or token expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur-sm">
            🛡️
          </div>
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="mt-2 text-white/60">Choose a strong new password</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/50">New Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
                placeholder="••••••••"
                minLength={6}
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/50">Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
                placeholder="••••••••"
                minLength={6}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Updating password…
                </span>
              ) : (
                'Reset Password'
              )}
            </button>

            <Link
              to="/login"
              className="block text-center text-sm text-white/40 hover:text-white/70 transition"
            >
              Cancel reset and go back
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
