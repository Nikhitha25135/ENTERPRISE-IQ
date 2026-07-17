import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

const publicLinks = [
  { to: '/#platform', label: 'Platform' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/#security', label: 'Security' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink/[0.07] bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {!user &&
            publicLinks.map((l) => (
              <a key={l.to} href={l.to} className="font-body text-[13.5px] text-slate transition-colors hover:text-ink">
                {l.label}
              </a>
            ))}
          {user && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `font-body text-[13.5px] transition-colors ${isActive ? 'text-ink' : 'text-slate hover:text-ink'}`}>
                Dashboard
              </NavLink>
              <NavLink to="/documents" className={({ isActive }) => `font-body text-[13.5px] transition-colors ${isActive ? 'text-ink' : 'text-slate hover:text-ink'}`}>
                Documents
              </NavLink>
              <NavLink to="/chat" className={({ isActive }) => `font-body text-[13.5px] transition-colors ${isActive ? 'text-ink' : 'text-slate hover:text-ink'}`}>
                Ask
              </NavLink>
              {(user.role === 'admin' || user.role === 'manager') && (
                <NavLink to="/users" className={({ isActive }) => `font-body text-[13.5px] transition-colors ${isActive ? 'text-ink' : 'text-slate hover:text-ink'}`}>
                  People
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/profile" className="font-mono text-[12px] uppercase tracking-[0.08em] text-slate hover:text-ink">
                {user.full_name?.split(' ')[0] || 'Account'}
              </Link>
              <button onClick={handleLogout} className="btn-secondary !py-2">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-body text-[13.5px] text-slate hover:text-ink">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary !py-2">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-ink/15 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className="font-mono text-[16px]">{open ? '×' : '≡'}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-ink/[0.07] bg-paper px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {!user &&
              publicLinks.map((l) => (
                <a key={l.to} href={l.to} onClick={() => setOpen(false)} className="font-body text-[14px] text-slate">
                  {l.label}
                </a>
              ))}
            {user && (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="font-body text-[14px] text-ink">Dashboard</Link>
                <Link to="/documents" onClick={() => setOpen(false)} className="font-body text-[14px] text-ink">Documents</Link>
                <Link to="/chat" onClick={() => setOpen(false)} className="font-body text-[14px] text-ink">Ask</Link>
                {(user.role === 'admin' || user.role === 'manager') && (
                  <Link to="/users" onClick={() => setOpen(false)} className="font-body text-[14px] text-ink">People</Link>
                )}
                <Link to="/profile" onClick={() => setOpen(false)} className="font-body text-[14px] text-ink">Profile</Link>
              </>
            )}
            <div className="mt-2 flex gap-3 border-t border-ink/10 pt-3">
              {user ? (
                <button onClick={handleLogout} className="btn-secondary w-full">Sign out</button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary w-full text-center">Sign in</Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-full text-center">Get started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
