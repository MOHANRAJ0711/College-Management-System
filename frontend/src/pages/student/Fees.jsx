import { useEffect, useState } from 'react';
import {
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiRefreshCw,
  FiSmartphone,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { apiError, formatCurrency, formatDate } from './utils';

const TABS = [
  { id: 'records', label: 'Fee records' },
  { id: 'history', label: 'Payment history' },
];

function statusStyle(status) {
  const s = String(status ?? '').toLowerCase();
  if (s === 'paid' || s === 'completed')
    return 'bg-emerald-100 text-emerald-800 ring-emerald-600/15';
  if (s === 'pending' || s === 'due' || s === 'overdue')
    return 'bg-amber-100 text-amber-900 ring-amber-600/15';
  return 'bg-slate-100 text-slate-700 ring-slate-500/15';
}

function normalize(res) {
  const d = res?.data ?? res;
  const summary = d.summary ?? d;
  return {
    summary: {
      total: Number(summary.total ?? summary.totalAmount ?? 0),
      paid: Number(summary.paid ?? summary.paidAmount ?? 0),
      pending: Number(summary.pending ?? summary.pendingAmount ?? summary.due ?? 0),
    },
    records: Array.isArray(d.records) ? d.records : Array.isArray(d.fees) ? d.fees : [],
    history: Array.isArray(d.history) ? d.history : Array.isArray(d.payments) ? d.payments : [],
  };
}

function mapRecord(r, i) {
  return {
    id: r.id ?? r._id ?? i,
    feeType: r.feeType ?? r.type ?? r.name ?? 'Fee',
    amount: Number(r.amount ?? 0),
    dueDate: r.dueDate ?? r.due_date,
    paidAt: r.paidAt ?? r.paid_at ?? r.paymentDate,
    status: r.status ?? 'pending',
    paymentMethod: r.paymentMethod ?? r.method ?? '—',
  };
}

export default function Fees() {
  const [tab, setTab] = useState('records');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [method, setMethod] = useState('upi');
  const [paying, setPaying] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await api.get('/fees/student');
      const n = normalize(res);
      n.records = n.records.map(mapRecord);
      n.history = n.history.map(mapRecord);
      setData(n);
    } catch (e) {
      const msg = apiError(e);
      setError(msg);
      toast.error(msg);
      setData({ summary: { total: 0, paid: 0, pending: 0 }, records: [], history: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePay() {
    if (!payModal) return;
    setPaying(true);
    try {
      await api.put(`/fees/pay/${payModal.id}`, { paymentMethod: method });
      toast.success('Payment recorded successfully');
      setPayModal(null);
      await load();
    } catch (e) {
      toast.error(apiError(e, 'Payment failed'));
    } finally {
      setPaying(false);
    }
  }

  function placeholderReceipt() {
    toast.info('Receipt download will be available after payment confirmation.');
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading fees…" />
      </div>
    );
  }

  const summary = data?.summary ?? { total: 0, paid: 0, pending: 0 };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Fees</h1>
        <p className="mt-1 text-sm text-slate-600">
          Summary, dues, and payment history for your program.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total', value: summary.total, color: 'from-indigo-600 to-blue-600' },
          { label: 'Paid', value: summary.paid, color: 'from-emerald-500 to-teal-600' },
          { label: 'Pending', value: summary.pending, color: 'from-amber-500 to-orange-500' },
        ].map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl bg-gradient-to-br ${c.color} p-5 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/90">{c.label}</p>
              <FiDollarSign className="h-5 w-5 opacity-80" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{formatCurrency(c.value)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {tab === 'records' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Fee type</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Amount</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Due date</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Method</th>
                  <th className="px-4 py-3 font-semibold text-slate-700"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.records?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      No fee records.
                    </td>
                  </tr>
                ) : (
                  data.records.map((row) => {
                    const pending =
                      String(row.status).toLowerCase() === 'pending' ||
                      String(row.status).toLowerCase() === 'due' ||
                      String(row.status).toLowerCase() === 'overdue';
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.feeType}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-800">
                          {formatCurrency(row.amount)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{formatDate(row.dueDate)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusStyle(row.status)}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.paymentMethod}</td>
                        <td className="px-4 py-3 text-right">
                          {pending ? (
                            <button
                              type="button"
                              onClick={() => {
                                setMethod('upi');
                                setPayModal(row);
                              }}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                            >
                              Pay
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={placeholderReceipt}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <FiDownload className="h-3.5 w-3.5" />
                              Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Fee type</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Amount</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Method</th>
                  <th className="px-4 py-3 font-semibold text-slate-700"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.history?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      No payment history yet.
                    </td>
                  </tr>
                ) : (
                  data.history.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">{row.feeType}</td>
                      <td className="px-4 py-3 tabular-nums">{formatCurrency(row.amount)}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDate(row.paidAt ?? row.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.paymentMethod}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={placeholderReceipt}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <FiDownload className="h-3.5 w-3.5" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(payModal)}
        onClose={() => !paying && setPayModal(null)}
        title="Complete payment"
        size="sm"
      >
        {payModal ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Pay <strong>{formatCurrency(payModal.amount)}</strong> for{' '}
              <strong>{payModal.feeType}</strong>.
            </p>
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">Payment method</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[
                  { id: 'upi', label: 'UPI', icon: FiSmartphone },
                  { id: 'card', label: 'Card', icon: FiCreditCard },
                  { id: 'netbanking', label: 'Net banking', icon: FiRefreshCw },
                  { id: 'cash', label: 'Cash (counter)', icon: FiDollarSign },
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      method === m.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pm"
                      value={m.id}
                      checked={method === m.id}
                      onChange={() => setMethod(m.id)}
                      className="text-indigo-600"
                    />
                    <m.icon className="h-4 w-4 text-slate-500" />
                    {m.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={paying}
                onClick={() => setPayModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={paying}
                onClick={handlePay}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {paying ? 'Processing…' : 'Confirm pay'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
