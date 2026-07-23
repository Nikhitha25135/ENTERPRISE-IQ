import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const publicLinks = [
  { to: '/#platform', label: 'Platform' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/#security', label: 'Security' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const onDark = !user && location.pathname === '/';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className={`navbar sticky top-0 z-50 ${onDark ? 'on-dark' : ''}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo tone={onDark ? 'light' : 'dark'} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {!user &&
            publicLinks.map((l) => (
              <a key={l.to} href={l.to} className="navbar-link">
                {l.label}
              </a>
            ))}
          {user && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                Dashboard
              </NavLink>
              <NavLink to="/documents" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                Documents
              </NavLink>
              <NavLink to="/chat" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                Ask
              </NavLink>
              {(user.role === 'admin' || user.role === 'manager') && (
                <NavLink to="/users" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                  People
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/profile" className="navbar-account">
                {user.full_name?.split(' ')[0] || 'Account'}
              </Link>
              <button onClick={handleLogout} className="btn-secondary !py-2">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Sign in
              </Link>
              <Link to="/register" className={onDark ? 'home-hero-btn-primary !py-2' : 'btn-primary !py-2'}>
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          className="navbar-mobile-toggle flex h-9 w-9 items-center justify-center md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className="font-mono text-[16px]">{open ? '×' : '≡'}</span>
        </button>
      </div>

      {open && (
        <div className="navbar-mobile-panel px-6 py-4 md:hidden">
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
