import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../lib/api';
import './Profile.css';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { push } = useToast();
  const [form, setForm] = useState({ full_name: user?.full_name || '', organization: user?.organization || '' });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await apiClient.updateProfile(form);
      setUser(updated);
      push('Profile updated', 'success');
    } catch (err) {
      push(apiClient.err(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <p className="eyebrow">Account</p>
      <h1 className="profile-title mt-2 text-[28px]">Your profile</h1>

      <div className="profile-card mt-8 p-7">
        <div className="flex items-center gap-4 border-b border-ink/[0.07] pb-6">
          <div className="profile-avatar flex h-14 w-14 items-center justify-center rounded-full text-[20px]">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-display text-[17px] font-semibold text-ink">{user?.full_name}</p>
            <p className="font-body text-[13px] text-slate">{user?.email}</p>
          </div>
          <span className="profile-role-badge ml-auto px-2.5 py-1">
            {user?.role}
          </span>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="field-label">Full name</label>
            <input
              className="field-input"
              minLength={2}
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Organization</label>
            <input
              className="field-input"
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="field-input opacity-60" value={user?.email || ''} disabled />
            <p className="mt-1.5 font-body text-[12px] text-slate-300">Email cannot be changed here.</p>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="profile-card mt-6 p-7">
        <p className="font-display text-[15px] font-semibold text-ink">Member since</p>
        <p className="mt-1 font-mono text-[12.5px] text-slate">
          {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
        </p>
      </div>
    </div>
  );
}
