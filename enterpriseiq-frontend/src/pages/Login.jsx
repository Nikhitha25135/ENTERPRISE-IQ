import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import apiClient from '../lib/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
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
          <p className="eyebrow text-center">Welcome back</p>
          <h1 className="mt-2 text-center font-display text-[24px] font-semibold text-ink">Sign in to your workspace</h1>

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
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="field-label mb-0" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="mb-1.5 font-mono text-[11px] text-brass-600 hover:text-brass">Forgot?</Link>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="field-input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {error && (
              <p className="rounded-[3px] border border-rust/25 bg-rust/[0.06] px-3 py-2 font-body text-[13px] text-rust">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center font-body text-[13.5px] text-slate">
          New to EnterpriseIQ?{' '}
          <Link to="/register" className="font-medium text-ink underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
