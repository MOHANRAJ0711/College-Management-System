import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';

const SERVICES = [
  { type: 'bonafide', label: 'Bonafide Certificate', icon: '📜', desc: 'For bank accounts, passport, scholarships etc.' },
  { type: 'transfer_certificate', label: 'Transfer Certificate', icon: '📋', desc: 'Required when joining another institution' },
  { type: 'course_completion', label: 'Course Completion', icon: '🎓', desc: 'Certificate of course completion' },
  { type: 'id_card_reissue', label: 'ID Card Reissue', icon: '🪪', desc: 'Lost or damaged ID card replacement' },
  { type: 'migration_certificate', label: 'Migration Certificate', icon: '🔄', desc: 'For university or state migration' },
  { type: 'provisional_certificate', label: 'Provisional Certificate', icon: '📄', desc: 'Temporary degree certificate' },
  { type: 'character_certificate', label: 'Character Certificate', icon: '⭐', desc: 'Certifying conduct and character' },
  { type: 'fee_receipt', label: 'Fee Receipt', icon: '🧾', desc: 'Duplicate fee payment receipt' },
  { type: 'transcript', label: 'Official Transcript', icon: '📊', desc: 'Academic transcript with grades' },
  { type: 'other', label: 'Other Request', icon: '📝', desc: 'Any other administrative service' },
];

export default function ServiceRequest() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ purpose: '', remarks: '', urgency: 'normal', copies: 1 });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!selected) { toast.error('Select a service type'); return; }
    setSaving(true);
    try {
      await api.post('/service-requests', { type: selected, ...form });
      toast.success('Request submitted! Track it under Request Status.');
      navigate('/student/request-status');
    } catch (err) { toast.error(err.response?.data?.message ?? 'Failed to submit'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Request Services</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Request certificates, documents and administrative services</p>
      </header>

      {/* Service grid */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          1. Choose service type
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <button
              key={s.type}
              type="button"
              onClick={() => setSelected(s.type)}
              className={`relative flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                selected === s.type
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-400 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700'
              }`}
            >
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">{s.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.desc}</p>
              </div>
              {selected === s.type && (
                <FiCheckCircle className="absolute top-3 right-3 h-4 w-4 text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Request form */}
      {selected && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            2. Fill request details
          </p>
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Purpose / Reason</span>
              <input value={form.purpose} onChange={(e) => setForm(f => ({...f, purpose: e.target.value}))}
                placeholder="e.g. Required for bank account opening"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Urgency</span>
                <select value={form.urgency} onChange={(e) => setForm(f => ({...f, urgency: e.target.value}))}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400">
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Copies Required</span>
                <input type="number" min="1" max="10" value={form.copies}
                  onChange={(e) => setForm(f => ({...f, copies: Number(e.target.value)}))}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400" />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Additional Remarks</span>
              <textarea rows={2} value={form.remarks} onChange={(e) => setForm(f => ({...f, remarks: e.target.value}))}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
                placeholder="Any additional information..." />
            </label>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60">
                {saving ? 'Submitting...' : <><FiArrowRight className="h-4 w-4" /> Submit Request</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
