import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../lib/api';

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
      <h1 className="mt-2 font-display text-[28px] font-semibold text-ink">Your profile</h1>

      <div className="mt-8 card p-7">
        <div className="flex items-center gap-4 border-b border-ink/[0.07] pb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy font-display text-[20px] font-semibold text-paper">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-display text-[17px] font-semibold text-ink">{user?.full_name}</p>
            <p className="font-body text-[13px] text-slate">{user?.email}</p>
          </div>
          <span className="ml-auto rounded-[2px] bg-brass/[0.12] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-brass-600">
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

      <div className="mt-6 card p-7">
        <p className="font-display text-[15px] font-semibold text-ink">Member since</p>
        <p className="mt-1 font-mono text-[12.5px] text-slate">
          {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
        </p>
      </div>
    </div>
  );
}
