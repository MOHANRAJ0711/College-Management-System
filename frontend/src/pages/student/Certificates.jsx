import { useEffect, useState } from 'react';
import { FiDownload, FiFileText, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { apiError, formatDate } from './utils';

const TYPES = [
  { id: 'degree', label: 'Degree certificate' },
  { id: 'provisional', label: 'Provisional certificate' },
  { id: 'migration', label: 'Migration certificate' },
  { id: 'character', label: 'Character certificate' },
  { id: 'bonafide', label: 'Bonafide certificate' },
];

function statusStyle(s) {
  const x = String(s ?? '').toLowerCase();
  if (x === 'ready' || x === 'generated' || x === 'issued')
    return 'bg-emerald-100 text-emerald-900';
  if (x === 'pending' || x === 'processing') return 'bg-amber-100 text-amber-900';
  if (x === 'rejected') return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-800';
}

function normalize(res) {
  const list = res?.data ?? res;
  const arr = Array.isArray(list) ? list : list?.certificates ?? [];
  return arr.map((c, i) => ({
    id: c.id ?? c._id ?? i,
    type: c.type ?? c.certificateType ?? 'document',
    label: c.label ?? c.name ?? c.type ?? 'Certificate',
    status: c.status ?? 'pending',
    requestedAt: c.requestedAt ?? c.createdAt,
  }));
}

export default function Certificates() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [requestOpen, setRequestOpen] = useState(false);
  const [reqType, setReqType] = useState('bonafide');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/certificates/student');
      setItems(normalize(data));
    } catch (e) {
      toast.error(apiError(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function download(id) {
    try {
      const res = await api.get(`/certificates/download/${id}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: res.headers['content-type'] || 'application/pdf',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (e) {
      toast.error(apiError(e, 'Download failed'));
    }
  }

  async function submitRequest() {
    setSubmitting(true);
    try {
      await api.post('/certificates/request', { type: reqType });
      toast.success('Certificate request submitted');
      setRequestOpen(false);
      await load();
    } catch (e) {
      const msg = apiError(e);
      if (e.response?.status === 404) {
        toast.info(
          'Request endpoint not configured on server — your admin can enable POST /certificates/request.'
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading certificates…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Certificates
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Request official documents and download issued files.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700"
          >
            <FiPlus className="h-4 w-4" />
            Request certificate
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Certificate</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Type</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Requested</th>
                <th className="px-4 py-3 font-semibold text-slate-700"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-slate-500">
                    <FiFileText className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                    No certificates yet. Request one to get started.
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const canDownload =
                    String(row.status).toLowerCase() === 'ready' ||
                    String(row.status).toLowerCase() === 'generated' ||
                    String(row.status).toLowerCase() === 'issued';
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
                      <td className="px-4 py-3 capitalize text-slate-700">{row.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(row.requestedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={!canDownload}
                          onClick={() => download(row.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FiDownload className="h-3.5 w-3.5" />
                          Download
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={requestOpen}
        onClose={() => !submitting && setRequestOpen(false)}
        title="Request certificate"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Select the document you need. Processing time depends on the registrar&apos;s queue.
          </p>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Certificate type</span>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              value={reqType}
              onChange={(e) => setReqType(e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setRequestOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submitRequest}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
