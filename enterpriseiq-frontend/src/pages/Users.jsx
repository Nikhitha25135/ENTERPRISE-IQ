import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../lib/api';

const ROLES = ['employee', 'manager', 'admin'];

export default function Users() {
  const { user: me } = useAuth();
  const { push } = useToast();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    apiClient
      .listUsers()
      .then(setUsers)
      .catch((err) => setError(apiClient.err(err)));
  };

  useEffect(load, []);

  const changeRole = async (userId, role) => {
    try {
      const updated = await apiClient.changeUserRole(userId, role);
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      push(`Role updated to ${role}`, 'success');
    } catch (err) {
      push(apiClient.err(err), 'error');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
      <p className="eyebrow">Organization</p>
      <h1 className="mt-2 font-display text-[28px] font-semibold text-ink">People</h1>
      <p className="mt-2 font-body text-[14px] text-slate">
        {me?.role === 'admin' ? 'Manage roles across your organization.' : 'View everyone in your organization.'}
      </p>

      {error && (
        <p className="mt-6 rounded-[3px] border border-rust/25 bg-rust/[0.06] px-4 py-3 font-body text-[13.5px] text-rust">{error}</p>
      )}

      <div className="mt-8 overflow-hidden rounded-[4px] border border-ink/[0.08]">
        <table className="w-full border-collapse bg-white/60 text-left">
          <thead>
            <tr className="border-b border-ink/[0.08] bg-paper-dim/50">
              <th className="px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-slate">Name</th>
              <th className="px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-slate">Email</th>
              <th className="px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-slate">Status</th>
              <th className="px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-slate">Role</th>
            </tr>
          </thead>
          <tbody>
            {users === null && !error && (
              <tr><td colSpan={4} className="px-4 py-8 text-center font-body text-[13.5px] text-slate">Loading…</td></tr>
            )}
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-ink/[0.06] last:border-0 hover:bg-paper-dim/30">
                <td className="px-4 py-3 font-body text-[13.5px] text-ink">{u.full_name}</td>
                <td className="px-4 py-3 font-body text-[13px] text-slate">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-[2px] px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] ${u.is_active ? 'bg-verified-100 text-verified' : 'bg-rust/[0.08] text-rust'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {me?.role === 'admin' && u.id !== me.id ? (
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="rounded-[3px] border border-ink/15 bg-white px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink outline-none focus:border-brass"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="rounded-[2px] bg-ink/[0.06] px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-slate">
                      {u.role}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
