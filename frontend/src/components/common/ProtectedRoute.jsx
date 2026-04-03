import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-50">
        <LoadingSpinner label="Checking session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length && user?.role && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-8 py-10 shadow-sm">
          <h1 className="text-xl font-bold text-red-800">Access Denied</h1>
          <p className="mt-2 max-w-md text-sm text-red-700">
            You don&apos;t have permission to view this page. Contact an administrator if you
            believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
