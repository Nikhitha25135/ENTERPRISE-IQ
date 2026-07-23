import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import apiClient from '../lib/api';
import './Login.css';

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
    <div className="auth-shell grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="auth-brand-panel hidden flex-col justify-between px-12 py-12 lg:flex">
        <Link to="/"><Logo tone="light" /></Link>
        <div className="max-w-sm">
          <p className="auth-kicker">Welcome back</p>
          <h1 className="auth-brand-title mt-3 text-[34px] leading-tight">
            Sign in to continue your intelligence journey
          </h1>
          <p className="mt-4 font-body text-[14.5px] leading-relaxed text-paper/60">
            Pick up where you left off — your workspaces, documents, and question
            history are exactly as you left them.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { label: 'Secure & private', body: 'Role-based access enforced on every request.' },
              { label: 'AI-powered insights', body: 'Answers traced back to the source passage.' },
              { label: 'Enterprise ready', body: 'Built for teams, not just a single inbox.' },
            ].map((f) => (
              <li key={f.label} className="flex items-start gap-3">
                <span className="auth-brand-check mt-0.5">✓</span>
                <span>
                  <span className="block font-body text-[13.5px] font-medium text-paper">{f.label}</span>
                  <span className="block font-body text-[13px] text-paper/55">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-paper/35">
          v0.1.0 · SOC2-ready architecture
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link to="/"><Logo /></Link>
          </div>
          <h1 className="auth-title text-[24px]">Sign in to your account</h1>
          <p className="mt-1.5 font-body text-[13.5px] text-slate">Welcome back. Please enter your details.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <label className="field-label" htmlFor="email">Email address</label>
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
                <Link to="/forgot-password" className="auth-link mb-1.5 font-mono text-[11px]">Forgot?</Link>
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
              <p className="auth-error px-3 py-2 font-body text-[13px]">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-footer-text mt-6 font-body text-[13.5px]">
            New to EnterpriseIQ?{' '}
            <Link to="/register" className="font-medium text-ink underline underline-offset-2">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
