import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiBook, FiSave, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function deptLabel(dept) {
  if (!dept) return '—';
  if (typeof dept === 'object') return dept.name || dept.code || '—';
  return '—';
}

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPin, setAddrPin] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/me');
      setMe(data);
      const fp = data.facultyProfile || {};
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(fp.phone ?? '');
      setQualification(fp.qualification ?? '');
      setSpecialization(fp.specialization ?? '');
      setExperience(
        fp.experience != null && fp.experience !== '' && !Number.isNaN(Number(fp.experience))
          ? String(fp.experience)
          : ''
      );
      const a = fp.address;
      if (a && typeof a === 'object') {
        setAddrStreet(a.street ?? '');
        setAddrCity(a.city ?? '');
        setAddrState(a.state ?? '');
        setAddrPin(a.pincode ?? '');
      } else {
        setAddrStreet('');
        setAddrCity('');
        setAddrState('');
        setAddrPin('');
      }
    } catch (e) {
      toast.error(
        e.response?.data?.message || e.message || 'Could not load profile'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fp = me?.facultyProfile || user?.facultyProfile || {};
  const employeeId = fp.employeeId || '—';
  const department = deptLabel(fp.department);
  const designation = fp.designation || '—';
  const subjects = useMemo(() => {
    const list = fp.subjects;
    if (!Array.isArray(list)) return [];
    return list;
  }, [fp.subjects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const expNum = experience.trim() === '' ? undefined : Number(experience);
      const payload = {
        name: name.trim(),
        facultyProfile: {
          phone: phone.trim() || undefined,
          qualification: qualification.trim() || undefined,
          specialization: specialization.trim() || undefined,
          experience:
            expNum !== undefined && !Number.isNaN(expNum) ? expNum : undefined,
          address: {
            street: addrStreet.trim() || undefined,
            city: addrCity.trim() || undefined,
            state: addrState.trim() || undefined,
            pincode: addrPin.trim() || undefined,
          },
        },
      };
      if (
        !payload.facultyProfile.address.street &&
        !payload.facultyProfile.address.city &&
        !payload.facultyProfile.address.state &&
        !payload.facultyProfile.address.pincode
      ) {
        delete payload.facultyProfile.address;
      }
      const updated = await updateProfile(payload);
      setMe(updated);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Could not save profile'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading && !me) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Loading profile…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-blue-800 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
              <FiUser className="h-8 w-8" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {me?.name || user?.name || 'Faculty'}
              </h1>
              <p className="mt-1 text-indigo-100">{designation}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-white/15 px-3 py-1 font-medium">
                  ID: {employeeId}
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 font-medium">
                  {department}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Personal information
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Update your contact and academic details. Email is managed by
            administration.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none ring-indigo-500/0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              value={email}
              readOnly
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Qualification
            <input
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Specialization
            <input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Experience (years)
            <input
              type="number"
              min={0}
              step={0.5}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              placeholder="e.g. 5"
            />
          </label>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900">Address</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Street
              <textarea
                rows={2}
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              City
              <input
                value={addrCity}
                onChange={(e) => setAddrCity(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              State
              <input
                value={addrState}
                onChange={(e) => setAddrState(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              PIN code
              <input
                value={addrPin}
                onChange={(e) => setAddrPin(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
            </label>
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <FiBook className="h-5 w-5 text-indigo-600" />
            Assigned subjects
          </h3>
          {subjects.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              No subjects assigned yet.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {subjects.map((s) => (
                <li
                  key={s._id || s.code}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                >
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="text-slate-600">
                    {s.code ? `${s.code} · ` : ''}
                    Sem {s.semester ?? '—'} · {s.credits ?? '—'} credits
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiSave className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
