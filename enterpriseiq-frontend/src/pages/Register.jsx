import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import apiClient from '../lib/api';
import './Register.css';

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
    <div className="auth-shell flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex justify-center">
          <Link to="/"><Logo /></Link>
        </div>
        <div className="auth-card p-8">
          <p className="auth-kicker">Get started</p>
          <h1 className="auth-title mt-2 text-[24px]">Create your account</h1>

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
                  <li key={h.label} className={`password-hint ${h.met ? 'met' : ''}`}>
                    {h.met ? '✓' : '·'} {h.label}
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <p className="auth-error px-3 py-2 font-body text-[13px]">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="auth-footer-text mt-6 font-body text-[13.5px]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ink underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
