import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiBook,
  FiCheck,
  FiEdit2,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiSend,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function errMsg(e) {
  return e.response?.data?.message || e.message || 'Request failed';
}

function normalizeBooks(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.books)) return d.books;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

function normalizeIssues(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.issues)) return d.issues;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

export default function LibraryManagement() {
  const { user } = useAuth();
  const [booksLoading, setBooksLoading] = useState(true);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [q, setQ] = useState('');

  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    category: '',
    copies: 1,
    shelfLocation: '',
  });
  const [savingBook, setSavingBook] = useState(false);

  const [editBook, setEditBook] = useState(null);

  const [issueForm, setIssueForm] = useState({
    bookId: '',
    studentId: '',
    dueDate: '',
  });
  const [studentQuery, setStudentQuery] = useState('');
  const [studentHits, setStudentHits] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const [returnModal, setReturnModal] = useState(null);
  const [returning, setReturning] = useState(false);

  const loadBooks = useCallback(async () => {
    setBooksLoading(true);
    try {
      const { data } = await api.get('/library/books');
      setBooks(normalizeBooks({ data }));
    } catch (e) {
      toast.error(errMsg(e));
      setBooks([]);
    } finally {
      setBooksLoading(false);
    }
  }, []);

  const loadIssues = useCallback(async () => {
    setIssuesLoading(true);
    try {
      const { data } = await api.get('/library/issues');
      setIssues(normalizeIssues({ data }));
    } catch (e) {
      toast.error(errMsg(e));
      setIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
    loadIssues();
  }, [loadBooks, loadIssues]);

  const filteredBooks = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return books;
    return books.filter((b) => {
      const blob = `${b.title} ${b.author} ${b.isbn} ${b.category}`.toLowerCase();
      return blob.includes(s);
    });
  }, [books, q]);

  const submitBook = async (e) => {
    e.preventDefault();
    if (!bookForm.title.trim() || !bookForm.author.trim()) {
      toast.warn('Title and author are required.');
      return;
    }
    setSavingBook(true);
    try {
      await api.post('/library/books', {
        ...bookForm,
        copies: Number(bookForm.copies) || 1,
      });
      toast.success('Book added.');
      setBookForm({
        title: '',
        author: '',
        isbn: '',
        publisher: '',
        category: '',
        copies: 1,
        shelfLocation: '',
      });
      await loadBooks();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSavingBook(false);
    }
  };

  const saveEditBook = async (e) => {
    e.preventDefault();
    if (!editBook?.id) return;
    setSavingBook(true);
    try {
      await api.put(`/library/books/${editBook.id}`, editBook.payload);
      toast.success('Book updated.');
      setEditBook(null);
      await loadBooks();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSavingBook(false);
    }
  };

  useEffect(() => {
    const term = studentQuery.trim();
    if (term.length < 2) {
      setStudentHits([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/students', {
          params: { search: term, limit: 10 },
        });
        const list = Array.isArray(data) ? data : data?.students ?? data?.data ?? [];
        setStudentHits(list);
        setShowDropdown(list.length > 0);
      } catch (e) {
        console.error('Search failed', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [studentQuery]);

  const selectStudent = (student) => {
    setIssueForm((f) => ({ ...f, studentId: String(student._id ?? student.id) }));
    setStudentQuery(`${student.user?.name ?? student.name} (${student.rollNumber ?? 'N/A'})`);
    setShowDropdown(false);
    setStudentHits([]);
  };

  const issueBook = async (e) => {
    e.preventDefault();
    if (!issueForm.bookId || !issueForm.studentId || !issueForm.dueDate) {
      toast.warn('Select book, student, and due date.');
      return;
    }
    setIssuing(true);
    try {
      await api.post('/library/issue', {
        bookId: issueForm.bookId,
        studentId: issueForm.studentId,
        dueDate: issueForm.dueDate,
      });
      toast.success('Book issued.');
      setIssueForm({ bookId: '', studentId: '', dueDate: '' });
      setStudentHits([]);
      setStudentQuery('');
      await loadBooks();
      await loadIssues();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setIssuing(false);
    }
  };

  const computeFine = (due, returnedAt = new Date()) => {
    const d = new Date(due);
    const r = new Date(returnedAt);
    const ms = r - d;
    const daysLate = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    const perDay = 5;
    return { daysLate, fine: daysLate * perDay };
  };

  const returnBook = async () => {
    if (!returnModal?.id) return;
    setReturning(true);
    try {
      const { fine, daysLate } = computeFine(returnModal.dueDate);
      await api.put(`/library/return/${returnModal.id}`, {
        returnedAt: new Date().toISOString(),
        fine,
        daysLate,
      });
      toast.success(`Returned. Fine: ₹${fine} (${daysLate} day(s) late).`);
      setReturnModal(null);
      await loadBooks();
      await loadIssues();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setReturning(false);
    }
  };

  const bookColumns = [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'isbn', label: 'ISBN' },
    { key: 'category', label: 'Category' },
    {
      key: 'copies',
      label: 'Copies',
      render: (v, row) => row.availableCopies ?? row.copies ?? v ?? '—',
    },
    { key: 'shelfLocation', label: 'Shelf', render: (v, row) => row.shelfLocation ?? v ?? '—' },
  ];

  const issueColumns = [
    {
      key: 'book',
      label: 'Book',
      render: (_, row) => row.bookTitle ?? row.book?.title ?? row.isbn ?? '—',
    },
    {
      key: 'student',
      label: 'Student',
      render: (_, row) =>
        row.studentName ?? row.student?.name ?? row.rollNumber ?? row.student?.rollNumber ?? '—',
    },
    {
      key: 'issuedAt',
      label: 'Issued',
      render: (v, row) => {
        const d = row.issuedAt ?? v;
        return d ? new Date(d).toLocaleDateString() : '—';
      },
    },
    {
      key: 'dueDate',
      label: 'Due',
      render: (v, row) => {
        const d = row.dueDate ?? v;
        return d ? new Date(d).toLocaleDateString() : '—';
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (v, row) => (
        <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
          {row.status ?? v ?? 'issued'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Library management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Catalog books, issue to students, and process returns
            {user?.name ? ` · ${user.name}` : ''}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            loadBooks();
            loadIssues();
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <FiRefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={submitBook}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2">
            <FiBook className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Add book</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Title</label>
              <input
                value={bookForm.title}
                onChange={(e) => setBookForm((b) => ({ ...b, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Author</label>
              <input
                value={bookForm.author}
                onChange={(e) => setBookForm((b) => ({ ...b, author: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">ISBN</label>
              <input
                value={bookForm.isbn}
                onChange={(e) => setBookForm((b) => ({ ...b, isbn: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Publisher</label>
              <input
                value={bookForm.publisher}
                onChange={(e) => setBookForm((b) => ({ ...b, publisher: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Category</label>
              <input
                value={bookForm.category}
                onChange={(e) => setBookForm((b) => ({ ...b, category: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Copies</label>
              <input
                type="number"
                min="1"
                value={bookForm.copies}
                onChange={(e) => setBookForm((b) => ({ ...b, copies: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Shelf location</label>
              <input
                value={bookForm.shelfLocation}
                onChange={(e) => setBookForm((b) => ({ ...b, shelfLocation: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingBook}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingBook ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiBook className="h-4 w-4" />}
              Save book
            </button>
          </div>
        </form>

        <form
          onSubmit={issueBook}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <div className="mb-3 flex items-center gap-2">
            <FiSend className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Issue book</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Book</label>
              <select
                value={issueForm.bookId}
                onChange={(e) => setIssueForm((f) => ({ ...f, bookId: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              >
                <option value="">Select book…</option>
                {books.map((b) => (
                  <option key={b._id ?? b.id} value={String(b._id ?? b.id)}>
                    {b.title} ({b.availableCopies ?? b.copies ?? 0} left)
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="text-xs font-semibold text-slate-600">Find student</label>
              <div className="mt-1 relative">
                <input
                  value={studentQuery}
                  onChange={(e) => {
                    setStudentQuery(e.target.value);
                    if (!e.target.value) setIssueForm(f => ({ ...f, studentId: '' }));
                  }}
                  onFocus={() => studentHits.length > 0 && setShowDropdown(true)}
                  placeholder="Type name or roll number…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
                />
                
                {showDropdown && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl animate-modal-in">
                    {studentHits.map((s) => (
                      <button
                        key={s._id ?? s.id}
                        type="button"
                        onClick={() => selectStudent(s)}
                        className="flex w-full flex-col items-start px-4 py-2.5 text-left transition hover:bg-indigo-50"
                      >
                        <span className="text-sm font-bold text-slate-900">{s.user?.name ?? s.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Roll: {s.rollNumber ?? '—'} · Email: {s.user?.email ?? '—'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Due date</label>
              <input
                type="date"
                value={issueForm.dueDate}
                onChange={(e) => setIssueForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={issuing}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {issuing ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiSend className="h-4 w-4" />}
              Issue
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900">Books catalog</h2>
          <div className="relative max-w-md flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, author, ISBN…"
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        {booksLoading ? (
          <div className="py-16">
            <LoadingSpinner label="Loading books…" />
          </div>
        ) : (
          <DataTable
            columns={bookColumns}
            data={filteredBooks.map((b, i) => ({ ...b, id: b._id ?? b.id ?? `b-${i}` }))}
            loading={false}
            onEdit={(row) =>
              setEditBook({
                id: row._id ?? row.id,
                payload: {
                  title: row.title ?? '',
                  author: row.author ?? '',
                  isbn: row.isbn ?? '',
                  publisher: row.publisher ?? '',
                  category: row.category ?? '',
                  copies: row.copies ?? 1,
                  shelfLocation: row.shelfLocation ?? '',
                },
              })
            }
          />
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <FiRotateCcw className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Issued books</h2>
        </div>
        {issuesLoading ? (
          <div className="py-16">
            <LoadingSpinner label="Loading issues…" />
          </div>
        ) : (
          <DataTable
            columns={[
              ...issueColumns,
              {
                key: 'ret',
                label: 'Return',
                render: (_, row) => {
                  const st = (row.status ?? '').toLowerCase();
                  const returned = st === 'returned';
                  return (
                    <button
                      type="button"
                      disabled={returned}
                      onClick={() =>
                        setReturnModal({
                          id: row._id ?? row.id,
                          dueDate: row.dueDate,
                          title: row.bookTitle ?? row.book?.title,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <FiRotateCcw className="h-3.5 w-3.5" />
                      {returned ? 'Returned' : 'Return'}
                    </button>
                  );
                },
              },
            ]}
            data={issues.map((r, i) => ({ ...r, id: r._id ?? r.id ?? `i-${i}` }))}
            loading={false}
            emptyMessage="No active issues."
          />
        )}
      </div>

      <Modal
        isOpen={Boolean(editBook)}
        onClose={() => !savingBook && setEditBook(null)}
        title="Edit book"
        size="lg"
      >
        {editBook ? (
          <form className="space-y-3" onSubmit={saveEditBook}>
            <div className="grid gap-3 sm:grid-cols-2">
              {['title', 'author', 'isbn', 'publisher', 'category', 'shelfLocation'].map((field) => (
                <div key={field} className={field === 'title' ? 'sm:col-span-2' : ''}>
                  <label className="text-xs font-semibold text-slate-600 capitalize">{field}</label>
                  <input
                    value={editBook.payload[field]}
                    onChange={(e) =>
                      setEditBook((eb) => ({
                        ...eb,
                        payload: { ...eb.payload, [field]: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-slate-600">Copies</label>
                <input
                  type="number"
                  min="1"
                  value={editBook.payload.copies}
                  onChange={(e) =>
                    setEditBook((eb) => ({
                      ...eb,
                      payload: { ...eb.payload, copies: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setEditBook(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingBook}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingBook ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiEdit2 className="h-4 w-4" />}
                Save
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(returnModal)}
        onClose={() => !returning && setReturnModal(null)}
        title="Return book"
        size="md"
      >
        {returnModal ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Returning <span className="font-semibold">{returnModal.title ?? 'book'}</span>. Fine is
              calculated at ₹5/day after the due date (preview only).
            </p>
            {(() => {
              const { fine, daysLate } = computeFine(returnModal.dueDate);
              return (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p>
                    Days late: <span className="font-bold">{daysLate}</span>
                  </p>
                  <p className="mt-1">
                    Estimated fine: <span className="font-bold">₹{fine}</span>
                  </p>
                </div>
              );
            })()}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturnModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={returning}
                onClick={returnBook}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {returning ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiCheck className="h-4 w-4" />}
                Confirm return
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
