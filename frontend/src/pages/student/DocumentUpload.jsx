import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiDownload, FiFile, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import api from '../../services/api';

const DOC_TYPES = ['assignment', 'certificate', 'project', 'report', 'id_proof', 'other'];
const typeIcon = { assignment: '📝', certificate: '🏆', project: '💡', report: '📊', id_proof: '🪪', other: '📄' };

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function DocumentUpload() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'other', description: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/student-documents/my'); setDocs(data); }
    catch { setDocs([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (!form.title) setForm(prev => ({ ...prev, title: f.name.replace(/\.[^/.]+$/, '') }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', form.title);
      fd.append('type', form.type);
      fd.append('description', form.description);
      await api.post('/student-documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded successfully');
      setFile(null); setForm({ title: '', type: 'other', description: '' });
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) { toast.error(err.response?.data?.message ?? 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try { await api.delete(`/student-documents/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Upload</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Upload assignments, certificates, and other documents</p>
      </header>

      {/* Upload form */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <FiUpload className="h-5 w-5 text-indigo-600" /> Upload New Document
        </h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition cursor-pointer ${file ? 'border-indigo-300 bg-indigo-50/50 dark:border-indigo-700 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-700'}`}
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <>
                <FiFile className="h-8 w-8 text-indigo-600" />
                <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
              </>
            ) : (
              <>
                <FiUpload className="h-8 w-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to select file</p>
                <p className="text-xs text-slate-400">PDF, images, DOC up to 10 MB</p>
              </>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Title *</span>
              <input required value={form.title} onChange={(e) => setForm(f => ({...f, title: e.target.value}))}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Type</span>
              <select value={form.type} onChange={(e) => setForm(f => ({...f, type: e.target.value}))}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400">
                {DOC_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Description</span>
            <input value={form.description} onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
              placeholder="Optional note"
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400" />
          </label>
          <button type="submit" disabled={uploading || !file} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60">
            {uploading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Uploading...</> : <><FiUpload className="h-4 w-4" /> Upload Document</>}
          </button>
        </form>
      </div>

      {/* Document list */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-700 px-5 py-3">
          <h2 className="font-semibold text-slate-900 dark:text-white">My Documents ({docs.length})</h2>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-slate-500">Loading...</div>
        ) : docs.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-slate-400">
            <FiFile className="h-8 w-8 opacity-30" />
            <p className="text-sm">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {docs.map((d) => (
              <div key={d._id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                <span className="text-2xl">{typeIcon[d.type] ?? '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{d.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {d.type} · {formatSize(d.fileSize)} · {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={d.fileUrl} target="_blank" rel="noreferrer"
                    className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                    <FiDownload className="h-4 w-4" />
                  </a>
                  <button onClick={() => handleDelete(d._id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30">
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
