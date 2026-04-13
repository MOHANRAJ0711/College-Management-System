import { useEffect, useState } from 'react';
import { FiCamera, FiLoader, FiMail, FiPhone, FiSave, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { loadModels, detectSingleFace } from '../../utils/faceApi';
import { apiError, formatDate } from './utils';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  bloodGroup: '',
  gender: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  guardianName: '',
  guardianPhone: '',
  guardianRelation: '',
};

function toInputDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function Profile() {
  const { user, updateProfile, updateProfileImage, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: user.name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? user.phoneNumber ?? '',
      dateOfBirth: toInputDate(user.dateOfBirth ?? user.dob),
      bloodGroup: user.bloodGroup ?? user.blood_group ?? '',
      gender: user.gender ?? '',
      addressLine1: user.addressLine1 ?? user.address?.line1 ?? '',
      addressLine2: user.addressLine2 ?? user.address?.line2 ?? '',
      city: user.city ?? user.address?.city ?? '',
      state: user.state ?? user.address?.state ?? '',
      postalCode: user.postalCode ?? user.pincode ?? user.address?.postalCode ?? '',
      country: user.country ?? user.address?.country ?? '',
      guardianName: user.guardianName ?? user.guardian?.name ?? '',
      guardianPhone: user.guardianPhone ?? user.guardian?.phone ?? '',
      guardianRelation: user.guardianRelation ?? user.guardian?.relation ?? '',
    }));
  }, [user]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Please select an image file');
    }

    setUploading(true);
    const loadingToast = toast.info('Processing face data...', { autoClose: false });

    try {
      // 1. Load models
      await loadModels();

      // 2. Create image element to run face-api on
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 3. Detect face and get descriptor
      const detection = await detectSingleFace(img);
      URL.revokeObjectURL(img.src);

      if (!detection) {
        toast.dismiss(loadingToast);
        return toast.error('No face detected. Please use a clear, front-facing photo of yourself.');
      }

      // 4. Upload photo and descriptor
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('descriptor', JSON.stringify(Array.from(detection.descriptor)));

      await updateProfileImage(formData);
      toast.dismiss(loadingToast);
      toast.success('Profile picture updated successfully');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(apiError(err, 'Could not upload profile picture'));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || undefined,
        bloodGroup: form.bloodGroup || undefined,
        gender: form.gender || undefined,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
        guardianName: form.guardianName,
        guardianPhone: form.guardianPhone,
        guardianRelation: form.guardianRelation,
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(apiError(err, 'Could not save profile'));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading && !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading profile…" />
      </div>
    );
  }

  const academic = {
    department: user?.department ?? '—',
    course: user?.course ?? user?.program ?? '—',
    semester: user?.semester ?? '—',
    section: user?.section ?? '—',
    registrationNumber: user?.registrationNumber ?? user?.rollNumber ?? user?.roll_no ?? '—',
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your personal details. Academic identifiers are maintained by the office.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white/20 ring-2 ring-white/30 transition hover:ring-white">
            {user?.avatar ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL || ''}${user.avatar}`}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold uppercase">
                {(user?.name || '?').slice(0, 1)}
              </div>
            )}
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? (
                <FiLoader className="h-6 w-6 animate-spin" />
              ) : (
                <FiCamera className="h-6 w-6" />
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
              />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-bold uppercase">{user?.name ?? 'Student'}</h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-indigo-100">
              <span>Roll: {user?.rollNumber ?? user?.roll_no ?? '—'}</span>
              <span className="hidden sm:inline">·</span>
              <span>{academic.department}</span>
              <span className="hidden sm:inline">·</span>
              <span>Batch: {user?.batch ?? user?.batchYear ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Personal information</h3>
          <p className="mt-1 text-sm text-slate-500">Editable fields are saved to your account.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <div className="relative mt-1">
                <FiUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none ring-indigo-500/0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <div className="relative mt-1">
                <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="email"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none ring-indigo-500/0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <div className="relative mt-1">
                <FiPhone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none ring-indigo-500/0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Date of birth</span>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                value={form.dateOfBirth}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Blood group</span>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                value={form.bloodGroup}
                onChange={(e) => updateField('bloodGroup', e.target.value)}
              >
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Gender</span>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value)}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Academic information</h3>
          <p className="mt-1 text-sm text-slate-500">Provided by the institution (read-only).</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ['Department', academic.department],
              ['Course / Program', academic.course],
              ['Semester', String(academic.semester)],
              ['Section', String(academic.section)],
              ['Registration number', String(academic.registrationNumber)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Address</h3>
          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Address line 1</span>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                value={form.addressLine1}
                onChange={(e) => updateField('addressLine1', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Address line 2</span>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                value={form.addressLine2}
                onChange={(e) => updateField('addressLine2', e.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">City</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">State</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={form.state}
                  onChange={(e) => updateField('state', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Postal code</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={form.postalCode}
                  onChange={(e) => updateField('postalCode', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Country</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={form.country}
                  onChange={(e) => updateField('country', e.target.value)}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Guardian</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Guardian name</span>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                value={form.guardianName}
                onChange={(e) => updateField('guardianName', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Guardian phone</span>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                value={form.guardianPhone}
                onChange={(e) => updateField('guardianPhone', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Relation</span>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="e.g. Father"
                value={form.guardianRelation}
                onChange={(e) => updateField('guardianRelation', e.target.value)}
              />
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <FiSave className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <p className="text-center text-xs text-slate-400">
        Last profile sync: {user?.updatedAt ? formatDate(user.updatedAt) : '—'}
      </p>
    </div>
  );
}
