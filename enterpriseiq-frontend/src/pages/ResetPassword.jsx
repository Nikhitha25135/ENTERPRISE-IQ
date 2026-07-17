import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import apiClient from '../lib/api';

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
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Link to="/"><Logo /></Link>
        </div>
        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-verified-100 text-verified">✓</div>
              <h1 className="mt-4 font-display text-[21px] font-semibold text-ink">Password updated</h1>
              <p className="mt-2 font-body text-[13.5px] text-slate">Taking you to sign in…</p>
            </div>
          ) : (
            <>
              <p className="eyebrow text-center">Reset password</p>
              <h1 className="mt-2 text-center font-display text-[22px] font-semibold text-ink">Choose a new password</h1>

              {!token && (
                <p className="mt-4 rounded-[3px] border border-brass/25 bg-brass/[0.06] px-3 py-2 text-center font-body text-[13px] text-brass-600">
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
                  <p className="rounded-[3px] border border-rust/25 bg-rust/[0.06] px-3 py-2 font-body text-[13px] text-rust">
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
