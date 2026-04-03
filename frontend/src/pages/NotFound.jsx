import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-blue-50/30 px-4 py-16 text-center">
      <p className="text-8xl font-black tracking-tighter text-indigo-600 sm:text-9xl">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">Page not found</h1>
      <p className="mt-3 max-w-md text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-400/30 transition hover:from-indigo-500 hover:to-blue-500"
      >
        Back to home
      </Link>
    </div>
  );
}
