import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import apiClient from '../lib/api';
import './ResetPassword.css';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(apiClient.err(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Link to="/"><Logo /></Link>
        </div>
        <div className="auth-card p-8">
          {done ? (
            <div className="text-center">
              <div className="auth-success-badge mx-auto flex h-11 w-11 items-center justify-center rounded-full">✓</div>
              <h1 className="mt-4 font-display text-[21px] font-semibold text-ink">Password updated</h1>
              <p className="mt-2 font-body text-[13.5px] text-slate">Taking you to sign in…</p>
            </div>
          ) : (
            <>
              <p className="auth-kicker">Reset password</p>
              <h1 className="auth-title mt-2 text-[22px]">Choose a new password</h1>

              {!token && (
                <p className="auth-warning mt-4 px-3 py-2 font-body text-[13px]">
                  This link is missing its reset token — open it directly from the email.
                </p>
              )}

              <form onSubmit={onSubmit} className="mt-7 space-y-4">
                <div>
                  <label className="field-label" htmlFor="password">New password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="field-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="auth-error px-3 py-2 font-body text-[13px]">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading || !token} className="btn-primary w-full !py-3">
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
