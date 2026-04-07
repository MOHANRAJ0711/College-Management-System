import { useCallback, useEffect, useState } from 'react';
import { FiAlertTriangle, FiBook, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { apiError, formatDate } from './utils';

function normalizeBooks(res) {
  const list = res?.data ?? res;
  const arr = Array.isArray(list) ? list : list?.books ?? [];
  return arr.map((b, i) => ({
    id: b.id ?? b._id ?? i,
    title: b.title ?? 'Untitled',
    author: b.author ?? b.authors ?? '—',
    category: b.category ?? b.subject ?? 'General',
    available: Number(b.available ?? b.copiesAvailable ?? b.stock ?? 0),
    total: Number(b.totalCopies ?? b.total ?? 0),
  }));
}

function normalizeIssues(res) {
  const list = res?.data ?? res;
  const arr = Array.isArray(list) ? list : list?.issues ?? [];
  return arr.map((x, i) => ({
    id: x.id ?? x._id ?? i,
    title: x.title ?? x.bookTitle ?? 'Book',
    author: x.author ?? '—',
    issuedOn: x.issuedOn ?? x.issueDate ?? x.borrowedAt,
    dueDate: x.dueDate ?? x.returnBy,
    fine: Number(x.fine ?? x.penalty ?? 0),
    status: x.status ?? 'issued',
  }));
}

function daysUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function Library() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);

  const fetchBooks = useCallback(async () => {
    setLoadingBooks(true);
    try {
      const { data } = await api.get('/library/books', {
        params: {
          q: q.trim() || undefined,
          category: category.trim() || undefined,
          author: author.trim() || undefined,
        },
      });
      setBooks(normalizeBooks(data));
    } catch (e) {
      toast.error(apiError(e));
      setBooks([]);
    } finally {
      setLoadingBooks(false);
    }
  }, [q, category, author]);

  const fetchIssues = useCallback(async () => {
    setLoadingIssues(true);
    try {
      const { data } = await api.get('/library/student-issues');
      setIssues(normalizeIssues(data));
    } catch (e) {
      toast.error(apiError(e));
      setIssues([]);
    } finally {
      setLoadingIssues(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    const t = setTimeout(() => fetchBooks(), 300);
    return () => clearTimeout(t);
  }, [fetchBooks]);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Library</h1>
        <p className="mt-1 text-sm text-slate-600">
          Search the catalog and manage books issued to you.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Search books</h2>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="block flex-1">
            <span className="text-sm font-medium text-slate-700">Title or keyword</span>
            <div className="relative mt-1">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Search…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </label>
          <label className="block w-full lg:w-48">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="e.g. CS"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>
          <label className="block w-full lg:w-48">
            <span className="text-sm font-medium text-slate-700">Author</span>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <FiBook className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Catalog</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loadingBooks ? (
            <div className="flex min-h-[200px] items-center justify-center py-12">
              <LoadingSpinner label="Searching…" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700">Title</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Author</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Category</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                        No books match your search.
                      </td>
                    </tr>
                  ) : (
                    books.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-900">{b.title}</td>
                        <td className="px-4 py-3 text-slate-700">{b.author}</td>
                        <td className="px-4 py-3 text-slate-600">{b.category}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              b.available > 0
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {b.available > 0
                              ? `${b.available} available${b.total ? ` / ${b.total}` : ''}`
                              : 'Unavailable'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">My issued books</h2>
        <p className="mt-1 text-sm text-slate-600">
          Return books on time to avoid fines. Overdue items are highlighted.
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loadingIssues ? (
            <div className="flex min-h-[160px] items-center justify-center py-10">
              <LoadingSpinner label="Loading issues…" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700">Book</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Issued</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Due</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                        No books issued to you.
                      </td>
                    </tr>
                  ) : (
                    issues.map((row) => {
                      const dLeft = daysUntil(row.dueDate);
                      const overdue = dLeft != null && dLeft < 0;
                      const warn = dLeft != null && dLeft >= 0 && dLeft <= 3;
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{row.title}</div>
                            <div className="text-xs text-slate-500">{row.author}</div>
                            {overdue || warn ? (
                              <div
                                className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${
                                  overdue ? 'text-red-700' : 'text-amber-700'
                                }`}
                              >
                                <FiAlertTriangle className="h-3.5 w-3.5" />
                                {overdue
                                  ? `Overdue by ${Math.abs(dLeft)} day(s)`
                                  : `Due in ${dLeft} day(s)`}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{formatDate(row.issuedOn)}</td>
                          <td className="px-4 py-3 text-slate-700">{formatDate(row.dueDate)}</td>
                          <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">
                            {row.fine > 0 ? `₹${row.fine}` : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
