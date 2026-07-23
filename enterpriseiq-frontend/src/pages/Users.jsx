import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../lib/api';
import './Users.css';

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
      <h1 className="users-title mt-2 text-[28px]">People</h1>
      <p className="mt-2 font-body text-[14px] text-slate">
        {me?.role === 'admin' ? 'Manage roles across your organization.' : 'View everyone in your organization.'}
      </p>

      {error && (
        <p className="users-error mt-6 px-4 py-3 font-body text-[13.5px]">{error}</p>
      )}

      <div className="users-table-wrap mt-8">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users === null && !error && (
              <tr><td colSpan={4} className="px-4 py-8 text-center font-body text-[13.5px] text-slate">Loading…</td></tr>
            )}
            {users?.map((u) => (
              <tr key={u.id}>
                <td className="font-body text-[13.5px] text-ink">{u.full_name}</td>
                <td className="font-body text-[13px] text-slate">{u.email}</td>
                <td>
                  <span className={`users-active-pill ${u.is_active ? 'active' : 'inactive'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {me?.role === 'admin' && u.id !== me.id ? (
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="users-role-select"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="users-role-static">
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
