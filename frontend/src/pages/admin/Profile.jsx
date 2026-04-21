import { useState } from 'react';
import { FiSave, FiUser, FiMail, FiLock, FiCheck, FiCamera, FiLoader, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ImageCropperModal from '../../components/common/ImageCropperModal';

export default function AdminProfile() {
  const { user, updateProfile, updateProfileImage, removeProfileImage, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Basic info states
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Please select an image file');
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setSelectedImage(reader.result);
      setShowCropper(true);
    });
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  }

  async function handleCropComplete(croppedBlob) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', croppedBlob, 'profile.jpg');
      await updateProfileImage(formData);
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload image');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveImage() {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
    
    setUploading(true);
    try {
      await removeProfileImage();
      toast.success('Profile picture removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove image');
    } finally {
      setUploading(false);
    }
  }

  async function handleUpdateInfo(e) {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');
    
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('Please fill all password fields');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setChangingPass(true);
    try {
      const { default: api } = await import('../../services/api');
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setChangingPass(false);
    }
  }

  if (authLoading && !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading profile…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Admin Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your account information and security settings.
        </p>
      </div>

      {/* Profile Header Card */}
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
            {user?.avatar && !uploading && (
              <button
                type="button"
                onClick={handleRemoveImage}
                title="Remove photo"
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-rose-600 text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-700"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-bold uppercase">{user?.name}</h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-indigo-100">
              <span className="flex items-center gap-1.5 uppercase">
                <FiMail className="h-3.5 w-3.5" />
                {user?.email}
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                System Administrator
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Basic Information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FiUser className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Personal Info</h2>
          </div>

          <form onSubmit={handleUpdateInfo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-500 outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                  Read Only
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || name === user?.name}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <LoadingSpinner size="sm" color="white" /> : <FiSave className="h-4 w-4" />}
              Save Changes
            </button>
          </form>
        </section>

        {/* Security Settings */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <FiLock className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Security</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                placeholder="••••••••"
              />
            </div>

            <div className="border-t border-slate-100 my-2 pt-2"></div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={changingPass}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-700 disabled:opacity-50"
            >
              {changingPass ? <LoadingSpinner size="sm" color="white" /> : <FiLock className="h-4 w-4" />}
              Update Password
            </button>
          </form>
        </section>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <FiCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900">Admin Account Verified</h3>
            <p className="mt-1 text-sm text-emerald-700">
              Your account has full administrative privileges. You can manage students, faculty, departments, and system configurations.
            </p>
          </div>
        </div>
      </div>
      <ImageCropperModal
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
