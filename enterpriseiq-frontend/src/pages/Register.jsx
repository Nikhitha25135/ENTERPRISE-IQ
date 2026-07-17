import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import apiClient from '../lib/api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', organization: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordHints = [
    { label: 'At least 8 characters', met: form.password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(form.password) },
    { label: 'One number', met: /[0-9]/.test(form.password) },
  ];

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        organization: form.organization || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(apiClient.err(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex justify-center">
          <Link to="/"><Logo /></Link>
        </div>
        <div className="card p-8">
          <p className="eyebrow text-center">Get started</p>
          <h1 className="mt-2 text-center font-display text-[24px] font-semibold text-ink">Create your account</h1>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <label className="field-label" htmlFor="full_name">Full name</label>
              <input
                id="full_name"
                required
                minLength={2}
                autoComplete="name"
                className="field-input"
                placeholder="Priya Sharma"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="organization">Organization <span className="normal-case text-slate-300">(optional)</span></label>
              <input
                id="organization"
                autoComplete="organization"
                className="field-input"
                placeholder="Acme Corp"
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="email">Work email</label>
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
              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="field-input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {passwordHints.map((h) => (
                  <li key={h.label} className={`font-mono text-[10.5px] ${h.met ? 'text-verified' : 'text-slate-300'}`}>
                    {h.met ? '✓' : '·'} {h.label}
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <p className="rounded-[3px] border border-rust/25 bg-rust/[0.06] px-3 py-2 font-body text-[13px] text-rust">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center font-body text-[13.5px] text-slate">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ink underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
