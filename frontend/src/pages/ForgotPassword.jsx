import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur-sm">
            🔑
          </div>
          <h1 className="text-3xl font-bold text-white">Forgot Password</h1>
          <p className="mt-2 text-white/60">Enter your email to receive a recovery link</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          {sent ? (
            <div className="text-center space-y-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white/80">
                Check your inbox! We've sent a password reset link to <strong>{email}</strong>.
              </p>
              <Link
                to="/login"
                className="block w-full rounded-xl bg-white/10 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">Email Address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/30 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
                  placeholder="name@email.edu"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Sending link…
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <Link
                to="/login"
                className="block text-center text-sm text-white/40 hover:text-white/70 transition"
              >
                Wait, I remember my password!
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
