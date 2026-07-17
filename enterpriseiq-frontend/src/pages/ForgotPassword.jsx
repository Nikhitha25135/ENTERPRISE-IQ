import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import apiClient from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.forgotPassword(email);
      setSent(true);
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
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-verified-100 text-verified">
                ✓
              </div>
              <h1 className="mt-4 font-display text-[21px] font-semibold text-ink">Check your inbox</h1>
              <p className="mt-2 font-body text-[13.5px] leading-relaxed text-slate">
                If <span className="text-ink">{email}</span> is registered, a reset link is on its way.
              </p>
              <Link to="/login" className="btn-secondary mt-6 w-full">Back to sign in</Link>
            </div>
          ) : (
            <>
              <p className="eyebrow text-center">Reset password</p>
              <h1 className="mt-2 text-center font-display text-[22px] font-semibold text-ink">Forgot your password?</h1>
              <p className="mt-2 text-center font-body text-[13.5px] text-slate">
                Enter your email and we'll send a reset link.
              </p>

              <form onSubmit={onSubmit} className="mt-7 space-y-4">
                <div>
                  <label className="field-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="field-input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="rounded-[3px] border border-rust/25 bg-rust/[0.06] px-3 py-2 font-body text-[13px] text-rust">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="mt-6 text-center font-body text-[13.5px] text-slate">
          <Link to="/login" className="font-medium text-ink underline underline-offset-2">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
