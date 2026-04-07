import { useCallback, useEffect, useState } from 'react';
import {
  FiAward,
  FiDownload,
  FiEye,
  FiRefreshCw,
  FiSearch,
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

function normalizeCerts(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.certificates)) return d.certificates;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

const TYPES = [
  { value: 'degree', label: 'Degree' },
  { value: 'provisional', label: 'Provisional' },
  { value: 'migration', label: 'Migration' },
  { value: 'character', label: 'Character' },
  { value: 'bonafide', label: 'Bonafide' },
];

export default function CertificateManagement() {
  const { user } = useAuth();
  const [listLoading, setListLoading] = useState(true);
  const [certs, setCerts] = useState([]);

  const [studentQuery, setStudentQuery] = useState('');
  const [hits, setHits] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [certType, setCertType] = useState('degree');
  const [generating, setGenerating] = useState(false);

  const [preview, setPreview] = useState(null);

  const loadCerts = useCallback(async () => {
    setListLoading(true);
    try {
      const { data } = await api.get('/certificates');
      setCerts(normalizeCerts({ data }));
    } catch (e) {
      toast.error(errMsg(e));
      setCerts([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCerts();
  }, [loadCerts]);

  const searchStudents = async () => {
    if (!studentQuery.trim()) {
      toast.warn('Enter name or roll number.');
      return;
    }
    try {
      const { data } = await api.get('/students', {
        params: { search: studentQuery.trim(), limit: 20 },
      });
      const list = Array.isArray(data) ? data : data?.students ?? data?.data ?? [];
      setHits(list);
      if (list[0]) setStudentId(String(list[0]._id ?? list[0].id));
      if (!list.length) toast.info('No students found.');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const generate = async (e) => {
    e.preventDefault();
    if (!studentId) {
      toast.warn('Select a student.');
      return;
    }
    setGenerating(true);
    try {
      const { data } = await api.post('/certificates/generate', {
        studentId,
        type: certType,
      });
      toast.success('Certificate generated.');
      setPreview(data);
      await loadCerts();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setGenerating(false);
    }
  };

  const download = async (row) => {
    const id = row._id ?? row.id;
    if (!id) return;
    try {
      const res = await api.get(`/certificates/download/${id}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started.');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const previewCert = (row) => {
    const id = row._id ?? row.id;
    setPreview({
      id,
      studentName: row.studentName ?? row.student?.name,
      type: row.type,
      issuedAt: row.issuedAt ?? row.createdAt,
      message: row.previewUrl
        ? 'Open preview URL in new tab if provided by API.'
        : 'Preview: use download for PDF output.',
    });
  };

  const columns = [
    {
      key: 'student',
      label: 'Student',
      render: (_, row) => row.studentName ?? row.student?.name ?? row.rollNumber ?? '—',
    },
    {
      key: 'type',
      label: 'Type',
      render: (v, row) => row.type ?? v ?? '—',
    },
    {
      key: 'issuedAt',
      label: 'Issued',
      render: (v, row) => {
        const d = row.issuedAt ?? row.createdAt ?? v;
        return d ? new Date(d).toLocaleString() : '—';
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="inline-flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => previewCert(row)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            <FiEye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => download(row)}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            <FiDownload className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Certificate generation</h1>
          <p className="mt-1 text-sm text-slate-600">
            Issue official certificates and manage downloads
            {user?.name ? ` · ${user.name}` : ''}.
          </p>
        </div>
        <button
          type="button"
          onClick={loadCerts}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <FiRefreshCw className="h-4 w-4" />
          Refresh list
        </button>
      </div>

      <form
        onSubmit={generate}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <FiAward className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Generate certificate</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Find student</label>
            <div className="mt-1 flex gap-2">
              <input
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder="Name or roll number"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={searchStudents}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <FiSearch className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
          {hits.length > 0 ? (
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Select student</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
              >
                {hits.map((s) => (
                  <option key={s._id ?? s.id} value={String(s._id ?? s.id)}>
                    {s.name} ({s.rollNumber ?? s.roll})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="text-xs font-semibold text-slate-600">Certificate type</label>
            <select
              value={certType}
              onChange={(e) => setCertType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-end">
            <button
              type="submit"
              disabled={generating || !studentId}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
            >
              {generating ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiAward className="h-4 w-4" />}
              Generate certificate
            </button>
          </div>
        </div>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Generated certificates</h2>
        {listLoading ? (
          <div className="py-16">
            <LoadingSpinner label="Loading certificates…" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={certs.map((c, i) => ({ ...c, id: c._id ?? c.id ?? `c-${i}` }))}
            loading={false}
            emptyMessage="No certificates generated yet."
          />
        )}
      </div>

      <Modal
        isOpen={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Certificate preview"
        size="md"
      >
        {preview ? (
          <div className="space-y-3 text-sm text-slate-700">
            {preview.message ? <p>{preview.message}</p> : null}
            {preview.studentName ? (
              <p>
                <span className="font-semibold text-slate-900">Student:</span> {preview.studentName}
              </p>
            ) : null}
            {preview.type ? (
              <p>
                <span className="font-semibold text-slate-900">Type:</span> {preview.type}
              </p>
            ) : null}
            {preview.issuedAt ? (
              <p>
                <span className="font-semibold text-slate-900">Issued:</span>{' '}
                {new Date(preview.issuedAt).toLocaleString()}
              </p>
            ) : null}
            {preview.previewUrl ? (
              <a
                href={preview.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-semibold text-indigo-700 hover:text-indigo-900"
              >
                <FiEye className="h-4 w-4" />
                Open preview
              </a>
            ) : null}
            {preview.id ? (
              <button
                type="button"
                onClick={() => download({ _id: preview.id })}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <FiDownload className="h-4 w-4" />
                Download PDF
              </button>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
